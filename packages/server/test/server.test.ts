import { createHmac } from 'node:crypto';
import { createServer, type Server, type Socket } from 'node:net';
import { blankEmail, type Email } from '@rebomail/core';
import { afterEach, describe, expect, it } from 'vitest';
import { createMailHandler, createTracker, type MailEvent, memoryTransport, prepare, resendTransport, sendEmail, smtpTransport, toMime, verifySvix, word } from '../src';

const SECRET = 'a-secret-long-enough-for-the-tests';
const tracker = createTracker({ secret: SECRET, base: 'https://example.com/', prefix: '/mail' });
const email: Email = {
  ...blankEmail({ name: 'Rebo' }),
  subject: 'Hi {name}',
  preheader: '',
  blocks: [
    { id: 'b', type: 'button', label: 'Go', url: 'https://shop.com/a?x=1&y=2', color: null },
    { id: 't', type: 'text', text: 'Write to [us](mailto:hi@rebo.com).' },
  ],
};

describe('the tracker', () => {
  it('signs whose each address is, and reads only what it signed', () => {
    const token = tracker.token('contact:42');
    expect(tracker.read(token)).toBe('contact:42');
    expect(tracker.read(`${token.split('.')[0]}.forged`)).toBeNull();
    expect(tracker.read('nothing')).toBeNull();
    expect(tracker.pixel('a')).toMatch(/^https:\/\/example\.com\/mail\/o\/[\w-]+\.[\w-]+\.gif$/);
    expect(() => createTracker({ secret: 'short', base: 'x' })).toThrow();
  });

  it('marks each link, and knows one changed', () => {
    const link = new URL(tracker.click('a', 'https://shop.com/x'));
    const token = link.pathname.split('/').at(-1)!;
    expect(tracker.isClick(token, 'https://shop.com/x', link.searchParams.get('s')!)).toBe(true);
    expect(tracker.isClick(token, 'https://evil.com', link.searchParams.get('s')!)).toBe(false);
  });
});

describe('an email made for its recipient', () => {
  it('fills it, sends its links through the tracker, and says how to stop them in its headers', () => {
    const m = prepare(email, { id: 'r1', to: 'ana@x.com', values: { name: 'Ana' } }, { from: 'Rebo <hi@rebo.com>', tracker, replyTo: 'carlos@rebo.com' });
    expect(m.subject).toBe('Hi Ana');
    expect(m.replyTo).toBe('carlos@rebo.com');
    expect(m.html).toContain(`href="${tracker.click('r1', 'https://shop.com/a?x=1&y=2').replace(/&/g, '&amp;')}"`);
    expect(m.html).toContain('href="mailto:hi@rebo.com"');
    expect(m.html).toContain(tracker.pixel('r1'));
    expect(m.headers['List-Unsubscribe']).toBe(`<${tracker.unsubscribe('r1')}>`);
    expect(m.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(m.tags).toEqual({ recipient: 'r1' });
  });

  it('counts nothing when told not to, and lets no header start another', () => {
    const m = prepare({ ...email, subject: 'Hi\r\nBcc: all@x.com' }, { id: 'r1', to: 'ana@x.com' }, { from: 'hi@rebo.com', tracker, track: { opens: false, clicks: false } });
    expect(m.html).not.toContain('/mail/o/');
    expect(m.html).toContain('href="https://shop.com/a?x=1&amp;y=2"');
    expect(m.subject).toBe('Hi Bcc: all@x.com');
  });
});

describe('a message by SMTP', () => {
  it('writes words that are not ASCII as RFC 2047 says, in pieces of 75 at most', () => {
    expect(word('Hola')).toBe('Hola');
    const long = word('¡Casas nuevas en Tijuana para ti, Ana! Échales un vistazo esta semana');
    for (const piece of long.split('\r\n ')) expect(piece.length).toBeLessThanOrEqual(75);
    const decoded = long
      .split('\r\n ')
      .map((p) => Buffer.from(p.slice(10, -2), 'base64').toString())
      .join('');
    expect(decoded).toBe('¡Casas nuevas en Tijuana para ti, Ana! Échales un vistazo esta semana');
  });

  it('has its text and its HTML as two parts', () => {
    const mime = toMime({ from: 'Rebo <hi@rebo.com>', to: 'ana@x.com', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi', headers: { 'List-Unsubscribe': '<https://x/u>' } });
    expect(mime).toMatch(/^From: Rebo <hi@rebo\.com>\r\nTo: ana@x\.com\r\nSubject: Hi\r\n/);
    expect(mime).toMatch(/Message-ID: <[0-9a-f]+@rebo\.com>/);
    expect(mime).toContain('List-Unsubscribe: <https://x/u>');
    expect(mime).toContain(Buffer.from('<p>Hi</p>').toString('base64'));
    expect(mime.match(/Content-Type: text\/(plain|html)/g)).toEqual(['Content-Type: text/plain', 'Content-Type: text/html']);
  });
});

describe('sending', () => {
  it('sends to each one in batches, saying what became of each', async () => {
    const transport = memoryTransport();
    const progress: number[] = [];
    const out = await sendEmail(
      email,
      [1, 2, 3].map((n) => ({ id: `r${n}`, to: `${n}@x.com`, values: { name: `N${n}` } })),
      { from: 'hi@rebo.com', tracker, transport, batch: 2, onProgress: (done) => progress.push(done) },
    );
    expect(out.map((d) => d.recipient)).toEqual(['r1', 'r2', 'r3']);
    expect(out.every((d) => d.id && !d.error)).toBe(true);
    expect(transport.sent.map((m) => m.subject)).toEqual(['Hi N1', 'Hi N2', 'Hi N3']);
    expect(progress).toEqual([2, 3]);
  });

  it('sends with Resend a hundred at a time, its tags as it takes them', async () => {
    const calls: unknown[][] = [];
    const fake = (async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as unknown[];
      calls.push(body);
      return new Response(JSON.stringify({ data: body.map((_, i) => ({ id: `re_${calls.length}_${i}` })) }), { status: 200 });
    }) as typeof fetch;
    const recipients = Array.from({ length: 150 }, (_, i) => ({ id: `contact:${i}`, to: `${i}@x.com` }));
    const out = await sendEmail(email, recipients, { from: 'hi@rebo.com', transport: resendTransport({ apiKey: 're_x', fetch: fake }), batch: 150 });
    expect(calls.map((c) => c.length)).toEqual([100, 50]);
    expect(out[149].id).toBe('re_2_49');
    expect((calls[0][0] as { tags: { name: string; value: string }[] }).tags).toEqual([{ name: 'recipient', value: 'contact_0' }]);
  });

  it('says why a batch Resend refused did not go', async () => {
    const fake = (async () => new Response(JSON.stringify({ message: 'Invalid from' }), { status: 422 })) as unknown as typeof fetch;
    const [d] = await sendEmail(email, [{ id: 'r', to: 'a@x.com' }], { from: 'bad', transport: resendTransport({ apiKey: 're_x', fetch: fake }) });
    expect(d.error).toBe('Resend said 422: Invalid from');
  });
});

describe('sending by SMTP', () => {
  let server: Server | undefined;
  afterEach(() => new Promise<void>((done) => (server ? server.close(() => done()) : done())));

  /** A server that talks SMTP as one would, keeps what it was told, and refuses one address. */
  async function fakeSmtp(options: { auth?: 'PLAIN' | 'LOGIN' } = {}) {
    const told: string[] = [];
    const messages: string[] = [];
    server = createServer((socket: Socket) => {
      let data: string | null = null;
      let buffer = '';
      let login = 0;
      const say = (line: string) => socket.write(`${line}\r\n`);
      say('220 fake.smtp ready');
      socket.on('data', (chunk) => {
        buffer += chunk.toString();
        if (data !== null) {
          const end = buffer.indexOf('\r\n.\r\n');
          if (end < 0) return;
          messages.push(buffer.slice(0, end));
          buffer = buffer.slice(end + 5);
          data = null;
          say(`250 2.0.0 Ok: queued as Q${messages.length}`);
        }
        let at = buffer.indexOf('\r\n');
        while (at >= 0 && data === null) {
          const line = buffer.slice(0, at);
          buffer = buffer.slice(at + 2);
          told.push(line);
          if (login === 1) (login = 2), say('334 UGFzc3dvcmQ6');
          else if (login === 2) (login = 0), say('235 ok');
          else if (line.startsWith('EHLO')) socket.write(`250-fake.smtp\r\n250-SIZE 1000000\r\n250 AUTH ${options.auth ?? 'PLAIN LOGIN'}\r\n`);
          else if (line.startsWith('AUTH PLAIN')) say('235 ok');
          else if (line === 'AUTH LOGIN') (login = 1), say('334 VXNlcm5hbWU6');
          else if (line.startsWith('MAIL FROM')) say('250 ok');
          else if (line.startsWith('RCPT TO')) say(line.includes('nobody@') ? '550 5.1.1 No such user' : '250 ok');
          else if (line === 'DATA') (data = ''), say('354 go on');
          else if (line === 'RSET') say('250 ok');
          else if (line === 'QUIT') say('221 bye'), socket.end();
          at = buffer.indexOf('\r\n');
        }
      });
    });
    await new Promise<void>((done) => server!.listen(0, '127.0.0.1', done));
    const port = (server!.address() as { port: number }).port;
    return { port, told, messages };
  }

  it('signs in, sends each message, and goes on past one refused', async () => {
    const smtp = await fakeSmtp();
    const transport = smtpTransport({ host: '127.0.0.1', port: smtp.port, allowPlain: true, auth: { user: 'u', pass: 'p' }, timeout: 3000 });
    const out = await sendEmail(
      { ...email, blocks: [{ id: 'x', type: 'text', text: '.starts with a dot' }] },
      [
        { id: 'a', to: 'ana@x.com', values: { name: 'Ana' } },
        { id: 'b', to: 'nobody@x.com' },
        { id: 'c', to: 'carlos@x.com', values: { name: 'Carlos' } },
      ],
      { from: 'Rebo <hi@rebo.com>', transport },
    );
    expect(out.map((d) => d.id ?? d.error)).toEqual(['Q1', 'RCPT: 550 5.1.1 No such user', 'Q2']);
    expect(smtp.told).toContain(`AUTH PLAIN ${Buffer.from('\0u\0p').toString('base64')}`);
    expect(smtp.told).toContain('RSET');
    expect(smtp.messages[1]).toContain('To: carlos@x.com');
  });

  it('signs in with LOGIN where PLAIN is not offered', async () => {
    const smtp = await fakeSmtp({ auth: 'LOGIN' });
    const out = await sendEmail(email, [{ id: 'a', to: 'ana@x.com' }], {
      from: 'hi@rebo.com',
      transport: smtpTransport({ host: '127.0.0.1', port: smtp.port, allowPlain: true, auth: { user: 'u', pass: 'p' }, timeout: 3000 }),
    });
    expect(out[0].id).toBe('Q1');
    expect(smtp.told).toEqual(expect.arrayContaining(['AUTH LOGIN', Buffer.from('u').toString('base64'), Buffer.from('p').toString('base64')]));
  });

  it('sends nothing in the clear to a server without STARTTLS, unless told', async () => {
    const smtp = await fakeSmtp();
    const [d] = await sendEmail(email, [{ id: 'a', to: 'ana@x.com' }], { from: 'hi@rebo.com', transport: smtpTransport({ host: '127.0.0.1', port: smtp.port, timeout: 3000 }) });
    expect(d.error).toMatch(/no STARTTLS/);
    expect(smtp.messages).toHaveLength(0);
  });
});

describe('the routes the emails come back to', () => {
  const events: MailEvent[] = [];
  const handle = createMailHandler({
    tracker,
    onEvent: (e) => void events.push(e),
    resendSecret: `whsec_${Buffer.from('webhook-secret').toString('base64')}`,
    sender: 'Rebo',
    locale: 'es',
    fallback: 'https://rebo.com',
  });
  afterEach(() => void events.splice(0));

  it('counts an opening, and answers with a picture', async () => {
    const r = await handle(new Request(tracker.pixel('r1')));
    expect(r.headers.get('content-type')).toBe('image/gif');
    expect(events).toMatchObject([{ type: 'opened', recipient: 'r1', via: 'link' }]);
  });

  it('counts a click on its way, and follows no link it did not make', async () => {
    const ok = await handle(new Request(tracker.click('r1', 'https://shop.com/x')));
    expect(ok.status).toBe(302);
    expect(ok.headers.get('location')).toBe('https://shop.com/x');
    expect(events).toMatchObject([{ type: 'clicked', recipient: 'r1', url: 'https://shop.com/x' }]);
    const forged = new URL(tracker.click('r1', 'https://shop.com/x'));
    forged.searchParams.set('u', 'https://evil.com');
    const bad = await handle(new Request(forged));
    expect(bad.headers.get('location')).toBe('https://rebo.com/');
    expect(events).toHaveLength(1);
  });

  it('asks before stopping the emails, stops them, and takes an inbox’s one click', async () => {
    const asked = await handle(new Request(tracker.unsubscribe('r1')));
    expect(await asked.text()).toContain('¿Dejar de recibir los correos de Rebo?');
    expect(events).toHaveLength(0);
    const done = await handle(new Request(tracker.unsubscribe('r1'), { method: 'POST' }));
    expect(await done.text()).toContain('Listo');
    const oneClick = await handle(new Request(tracker.unsubscribe('r2'), { method: 'POST', body: 'List-Unsubscribe=One-Click' }));
    expect(await oneClick.text()).toBe('OK');
    expect(events.map((e) => [e.type, e.recipient])).toEqual([
      ['unsubscribed', 'r1'],
      ['unsubscribed', 'r2'],
    ]);
    expect((await handle(new Request('https://example.com/mail/u/nope.nope'))).status).toBe(404);
  });

  it('takes Resend’s events only as Svix signed them', async () => {
    const body = JSON.stringify({ type: 'email.bounced', created_at: '2026-10-29T08:00:00.000Z', data: { email_id: 're_1' } });
    const stamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac('sha256', Buffer.from('webhook-secret')).update(`msg_1.${stamp}.${body}`).digest('base64');
    const headers = { 'svix-id': 'msg_1', 'svix-timestamp': stamp, 'svix-signature': `v1,${signature}` };
    const url = 'https://example.com/mail/webhooks/resend';
    expect((await handle(new Request(url, { method: 'POST', body, headers: { ...headers, 'svix-signature': 'v1,AAAA' } }))).status).toBe(401);
    expect((await handle(new Request(url, { method: 'POST', body, headers }))).status).toBe(200);
    expect(events).toMatchObject([{ type: 'bounced', providerId: 're_1', via: 'webhook' }]);
    expect(events[0].at.toISOString()).toBe('2026-10-29T08:00:00.000Z');
    expect(verifySvix('whsec_eA==', new Headers(headers), body, Date.now() + 10 * 60_000)).toBe(false);
  });
});

describe('the routes on Node', () => {
  it('answer through node:http as through a Request', async () => {
    const { createServer: http } = await import('node:http');
    const { nodeHandler } = await import('../src');
    const seen: MailEvent[] = [];
    const server = http(nodeHandler(createMailHandler({ tracker, onEvent: (e) => void seen.push(e) })));
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    const port = (server.address() as { port: number }).port;
    try {
      const pixel = await fetch(tracker.pixel('r9').replace('https://example.com', `http://127.0.0.1:${port}`));
      expect(pixel.headers.get('content-type')).toBe('image/gif');
      const stop = await fetch(tracker.unsubscribe('r9').replace('https://example.com', `http://127.0.0.1:${port}`), { method: 'POST', body: 'List-Unsubscribe=One-Click' });
      expect(await stop.text()).toBe('OK');
      expect(seen.map((e) => e.type)).toEqual(['opened', 'unsubscribed']);
    } finally {
      await new Promise<void>((done) => server.close(() => done()));
    }
  });
});
