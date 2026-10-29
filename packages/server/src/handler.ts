// The routes the emails come back to, under the tracker's prefix: the picture
// that counts an opening, each link counting its click on its way, the page
// that stops the emails (and the one click an inbox posts to it), and the
// events Resend tells of each message (delivered, opened, clicked, bounced,
// complained), signed as Svix signs them. Nothing is kept here: each is told
// to the application (`onEvent`), whose the recipients are.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { escapeHtml, type Locale } from '@rebomail/core';
import type { Tracker } from './tracker';

/** Something that became of an email: by its recipient (from its own links), or by its provider's id (from the provider's events). */
export interface MailEvent {
  type: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed' | 'delayed';
  /** The recipient's id, as it was sent with; from the email's own links. */
  recipient?: string;
  /** The provider's id of the message; from its events. */
  providerId?: string;
  /** The link clicked. */
  url?: string;
  at: Date;
  via: 'link' | 'webhook';
}

export interface MailHandlerOptions {
  tracker: Tracker;
  /** Told of each event, as it comes: kept, counted, the address stopped. */
  onEvent: (event: MailEvent) => void | Promise<void>;
  /** The secret Resend signs its webhook with (`whsec_…`); its route answers nothing without it. */
  resendSecret?: string;
  /** Who sends them, on the page that stops them. */
  sender?: string;
  /** The accent of that page: #rrggbb. */
  accent?: string;
  locale?: Locale;
  /** Where a link that was not made here goes: the sender's site. */
  fallback?: string;
}

/** A picture of one transparent pixel. */
const PIXEL = Uint8Array.from(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));

const WORDS = {
  en: {
    title: 'Unsubscribe',
    ask: (who: string) => `Stop receiving emails from ${who}?`,
    yes: 'Yes, unsubscribe me',
    done: 'Done: you will not receive these emails any more.',
    bad: 'This link is not valid.',
  },
  es: {
    title: 'Darme de baja',
    ask: (who: string) => `¿Dejar de recibir los correos de ${who}?`,
    yes: 'Sí, darme de baja',
    done: 'Listo: ya no recibirás estos correos.',
    bad: 'Esta liga no es válida.',
  },
};

/** The page that stops the emails: one question and one button, or what became of it. */
function page(body: string, options: MailHandlerOptions, status = 200) {
  const w = WORDS[options.locale ?? 'en'];
  const accent = /^#[0-9a-f]{6}$/i.test(options.accent ?? '') ? options.accent : '#3b63fb';
  return new Response(
    `<!doctype html><html lang="${options.locale ?? 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${w.title}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f4f5;font:16px/1.5 system-ui,sans-serif;color:#27272a}main{max-width:420px;margin:16px;padding:32px;background:#fff;border-radius:16px;border-top:4px solid ${accent};text-align:center}button{margin-top:20px;padding:12px 24px;border:0;border-radius:999px;background:${accent};color:#fff;font:600 15px system-ui;cursor:pointer}</style></head>
<body><main>${body}</main></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } },
  );
}

/** Whether Resend's event is as it signed it (Svix: the secret over `id.timestamp.body`), and of the last five minutes. */
export function verifySvix(secret: string, headers: Headers, body: string, now = Date.now()): boolean {
  const id = headers.get('svix-id');
  const stamp = headers.get('svix-timestamp');
  const signature = headers.get('svix-signature');
  if (!id || !stamp || !signature || Math.abs(now / 1000 - Number(stamp)) > 300) return false;
  const expected = createHmac('sha256', Buffer.from(secret.replace(/^whsec_/, ''), 'base64'))
    .update(`${id}.${stamp}.${body}`)
    .digest('base64');
  return signature.split(' ').some((part) => {
    const given = part.split(',')[1] ?? '';
    return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  });
}

const RESEND_EVENTS: Record<string, MailEvent['type']> = {
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.delivery_delayed': 'delayed',
};

/** The routes, as a handler of `Request`s: a Next.js route handler, a Bun or Deno server, a Worker; `nodeHandler` for Node's. */
export function createMailHandler(options: MailHandlerOptions) {
  const { tracker } = options;
  const w = WORDS[options.locale ?? 'en'];
  const tell = async (event: MailEvent) => {
    try {
      await options.onEvent(event);
    } catch (error) {
      // An event not kept never breaks what the reader sees.
      console.error('[rebomail] onEvent failed:', error);
    }
  };

  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const at = url.pathname.indexOf(`${tracker.prefix}/`);
    const route = at >= 0 ? url.pathname.slice(at + tracker.prefix.length) : url.pathname;
    const [, kind, raw] = route.split('/');
    const token = raw?.replace(/\.gif$/, '') ?? '';

    if (request.method === 'GET' && kind === 'o') {
      const recipient = tracker.read(token);
      if (recipient) await tell({ type: 'opened', recipient, at: new Date(), via: 'link' });
      return new Response(PIXEL, { headers: { 'content-type': 'image/gif', 'cache-control': 'no-store, max-age=0' } });
    }

    if (request.method === 'GET' && kind === 'c') {
      const target = url.searchParams.get('u') ?? '';
      const recipient = tracker.read(token);
      // Only a link made here, as it was made, and only to the web: never an open redirect.
      if (!recipient || !/^https?:\/\//i.test(target) || !tracker.isClick(token, target, url.searchParams.get('s') ?? '')) {
        return options.fallback ? Response.redirect(options.fallback, 302) : new Response(w.bad, { status: 404 });
      }
      await tell({ type: 'clicked', recipient, url: target, at: new Date(), via: 'link' });
      return Response.redirect(target, 302);
    }

    if (kind === 'u') {
      const recipient = tracker.read(token);
      if (!recipient) return page(`<p>${w.bad}</p>`, options, 404);
      if (request.method === 'GET') {
        return page(`<p>${escapeHtml(w.ask(options.sender ?? 'us'))}</p><form method="post"><button type="submit">${w.yes}</button></form>`, options);
      }
      if (request.method === 'POST') {
        await tell({ type: 'unsubscribed', recipient, at: new Date(), via: 'link' });
        // The inbox's one click (`List-Unsubscribe=One-Click`) wants no page; a person, the word that it is done.
        const body = await request.text().catch(() => '');
        return body.includes('List-Unsubscribe=One-Click') ? new Response('OK') : page(`<p>${w.done}</p>`, options);
      }
    }

    if (request.method === 'POST' && kind === 'webhooks' && raw === 'resend') {
      if (!options.resendSecret) return new Response('No secret for Resend’s webhook.', { status: 404 });
      const body = await request.text();
      if (!verifySvix(options.resendSecret, request.headers, body)) return new Response('Bad signature.', { status: 401 });
      const event = JSON.parse(body) as { type?: string; created_at?: string; data?: { email_id?: string; click?: { link?: string } } };
      const type = event.type ? RESEND_EVENTS[event.type] : undefined;
      if (type && event.data?.email_id)
        await tell({ type, providerId: event.data.email_id, url: event.data.click?.link, at: event.created_at ? new Date(event.created_at) : new Date(), via: 'webhook' });
      return new Response('OK');
    }

    return new Response('Not found.', { status: 404 });
  };
}
