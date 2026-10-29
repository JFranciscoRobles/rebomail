// What sends the messages: Resend, by its HTTP API and a hundred at a time,
// with no SDK; any server by SMTP, with nothing but Node's sockets (STARTTLS,
// a sign-in with PLAIN or LOGIN); or memory, where they are kept and nothing
// leaves, to try everything without sending. Each says of each message whether
// it went, and the id its provider gave it.

import { randomBytes } from 'node:crypto';
import { connect as plainConnect, type Socket } from 'node:net';
import { type ConnectionOptions, connect as tlsConnect, type TLSSocket } from 'node:tls';
import type { Message } from './message';
import { addressOf, toMime } from './mime';

/** What became of a message: the id its provider gave it, or why it did not go. */
export interface Sent {
  to: string;
  id?: string;
  error?: string;
}

export interface Transport {
  readonly name: string;
  send(messages: Message[]): Promise<Sent[]>;
}

// ——— Resend ———

export interface ResendOptions {
  apiKey: string;
  fetch?: typeof fetch;
}

/** Resend (resend.com): a hundred messages a call, with a key of its and a `from` of a domain checked there. */
export function resendTransport({ apiKey, fetch: send = fetch }: ResendOptions): Transport {
  return {
    name: 'resend',
    async send(messages) {
      const out: Sent[] = [];
      for (let i = 0; i < messages.length; i += 100) {
        const batch = messages.slice(i, i + 100);
        try {
          const answer = await send('https://api.resend.com/emails/batch', {
            method: 'POST',
            headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
            body: JSON.stringify(
              batch.map((m) => ({
                from: m.from,
                to: [m.to],
                subject: m.subject,
                html: m.html,
                text: m.text,
                ...(m.replyTo ? { reply_to: m.replyTo } : {}),
                headers: m.headers,
                // Resend's tags take letters, numbers, _ and - only.
                tags: Object.entries(m.tags ?? {}).map(([name, value]) => ({ name: name.replace(/[^\w-]/g, '_'), value: value.replace(/[^\w-]/g, '_').slice(0, 256) })),
              })),
            ),
          });
          const said = (await answer.json().catch(() => ({}))) as { data?: { id: string }[]; message?: string };
          if (!answer.ok || !said.data) throw new Error(`Resend said ${answer.status}: ${said.message ?? 'no answer'}`);
          batch.forEach((m, j) => out.push({ to: m.to, id: said.data![j]?.id }));
        } catch (error) {
          for (const m of batch) out.push({ to: m.to, error: (error as Error).message });
        }
      }
      return out;
    },
  };
}

// ——— SMTP ———

export interface SmtpOptions {
  host: string;
  /** 587 (STARTTLS) unless said; 465 is TLS from the start. */
  port?: number;
  /** TLS from the start; on 465 unless said. */
  secure?: boolean;
  auth?: { user: string; pass: string };
  /** What this end is called, in EHLO. */
  name?: string;
  /** Whether a server without STARTTLS may be sent to in the clear: only for one on one's own machine. */
  allowPlain?: boolean;
  tls?: ConnectionOptions;
  /** How long a reply may take, in milliseconds. */
  timeout?: number;
}

interface Reply {
  code: number;
  lines: string[];
}

/** A talk with an SMTP server: each command, and its reply as it comes, of one line or many. */
class Talk {
  private buffer = '';
  private replies: Reply[] = [];
  private waiting: ((r: Reply | Error) => void)[] = [];
  private lines: string[] = [];
  constructor(
    public socket: Socket | TLSSocket,
    private timeout: number,
  ) {
    this.listen(socket);
  }

  listen(socket: Socket | TLSSocket) {
    this.socket = socket;
    socket.setEncoding('utf8');
    socket.on('data', (chunk: string) => {
      this.buffer += chunk;
      let at = this.buffer.indexOf('\r\n');
      while (at >= 0) {
        const line = this.buffer.slice(0, at);
        this.buffer = this.buffer.slice(at + 2);
        this.lines.push(line.slice(4));
        // `250-…` goes on; `250 …` ends the reply.
        if (/^\d{3}( |$)/.test(line)) {
          const reply = { code: Number(line.slice(0, 3)), lines: this.lines };
          this.lines = [];
          const next = this.waiting.shift();
          if (next) next(reply);
          else this.replies.push(reply);
        }
        at = this.buffer.indexOf('\r\n');
      }
    });
    socket.on('error', (error) => {
      for (const w of this.waiting.splice(0)) w(error);
    });
  }

  read(): Promise<Reply> {
    const ready = this.replies.shift();
    if (ready) return Promise.resolve(ready);
    return new Promise((done, fail) => {
      const timer = setTimeout(() => fail(new Error('The SMTP server did not answer in time.')), this.timeout);
      this.waiting.push((r) => {
        clearTimeout(timer);
        if (r instanceof Error) fail(r);
        else done(r);
      });
    });
  }

  /** A command, and its reply if it is one of `expect`; else a failure saying it. */
  async say(line: string | null, expect: number[], what = line?.split(' ')[0] ?? 'greeting'): Promise<Reply> {
    if (line !== null) this.socket.write(`${line}\r\n`);
    const reply = await this.read();
    if (!expect.includes(reply.code)) throw new SmtpError(`${what}: ${reply.code} ${reply.lines.join(' ')}`, reply.code);
    return reply;
  }
}

class SmtpError extends Error {
  constructor(
    message: string,
    public code: number,
  ) {
    super(message);
  }
}

/** A socket once connected: in the clear, or in TLS. */
const opened = (socket: Socket | TLSSocket, event: 'connect' | 'secureConnect') =>
  new Promise<void>((done, fail) => {
    socket.once(event, () => done());
    socket.once('error', fail);
  });

/** Any server by SMTP: one connection a batch, each message in turn; one refused does not stop the rest. */
export function smtpTransport(options: SmtpOptions): Transport {
  const port = options.port ?? 587;
  const secure = options.secure ?? port === 465;
  const name = options.name ?? 'localhost';
  const timeout = options.timeout ?? 30_000;
  return {
    name: 'smtp',
    async send(messages) {
      if (!messages.length) return [];
      const socket = secure ? tlsConnect({ host: options.host, port, servername: options.host, ...options.tls }) : plainConnect({ host: options.host, port });
      const talk = new Talk(socket, timeout);
      const out: Sent[] = [];
      try {
        await opened(socket, secure ? 'secureConnect' : 'connect');
        await talk.say(null, [220]);
        let hello = await talk.say(`EHLO ${name}`, [250]);
        if (!secure) {
          if (hello.lines.some((l) => /^STARTTLS\b/i.test(l))) {
            await talk.say('STARTTLS', [220]);
            const safe = tlsConnect({ socket, servername: options.host, ...options.tls });
            await opened(safe, 'secureConnect');
            talk.listen(safe);
            hello = await talk.say(`EHLO ${name}`, [250]);
          } else if (!options.allowPlain) {
            throw new Error('The SMTP server offers no STARTTLS: nothing is sent in the clear (allowPlain, for one on your own machine).');
          }
        }
        if (options.auth) {
          const ways = hello.lines.find((l) => /^AUTH\b/i.test(l))?.toUpperCase() ?? '';
          if (ways.includes('PLAIN') || !ways.includes('LOGIN')) {
            await talk.say(`AUTH PLAIN ${Buffer.from(`\0${options.auth.user}\0${options.auth.pass}`).toString('base64')}`, [235], 'AUTH');
          } else {
            await talk.say('AUTH LOGIN', [334], 'AUTH');
            await talk.say(Buffer.from(options.auth.user).toString('base64'), [334], 'AUTH');
            await talk.say(Buffer.from(options.auth.pass).toString('base64'), [235], 'AUTH');
          }
        }
        for (const m of messages) {
          try {
            await talk.say(`MAIL FROM:<${addressOf(m.from)}>`, [250]);
            await talk.say(`RCPT TO:<${addressOf(m.to)}>`, [250, 251]);
            await talk.say('DATA', [354]);
            // A line that starts with a dot gets another: one alone ends the message.
            const body = toMime(m).replace(/^\./gm, '..');
            const done = await talk.say(`${body}\r\n.`, [250], 'DATA');
            // `250 2.0.0 Ok: queued as 4F3A2B`: its last word is the server's id of it.
            out.push({ to: m.to, id: done.lines.join(' ').trim().split(/\s+/).at(-1) || randomBytes(8).toString('hex') });
          } catch (error) {
            if (!(error instanceof SmtpError)) throw error;
            out.push({ to: m.to, error: error.message });
            // What was begun of it is forgotten, for the next one.
            await talk.say('RSET', [250]).catch(() => undefined);
          }
        }
        await talk.say('QUIT', [221]).catch(() => undefined);
      } catch (error) {
        for (const m of messages.slice(out.length)) out.push({ to: m.to, error: (error as Error).message });
      } finally {
        talk.socket.destroy();
      }
      return out;
    },
  };
}

// ——— Memory ———

/** Nothing leaves: the messages are kept, to try everything without sending. Each gets an id, as a provider would give it. */
export function memoryTransport(): Transport & { sent: (Message & { id: string })[] } {
  const sent: (Message & { id: string })[] = [];
  return {
    name: 'memory',
    sent,
    async send(messages) {
      return messages.map((m) => {
        const id = randomBytes(8).toString('hex');
        sent.push({ ...m, id });
        return { to: m.to, id };
      });
    },
  };
}
