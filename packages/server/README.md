# @rebomail/server

Sending the emails of [Rebomail](../../README.md) and following them: each one made for whom it goes to, sent with Resend or by SMTP, its openings and clicks counted, and stopping them in one click. No dependencies but core; nothing is kept here: each thing that becomes of an email is told to the application, whose the recipients are.

```ts
import { createServer } from 'node:http';
import { createMailHandler, createTracker, nodeHandler, resendTransport, sendEmail } from '@rebomail/server';

const tracker = createTracker({ secret: process.env.MAIL_SECRET!, base: 'https://example.com' }); // routes under /mail

const deliveries = await sendEmail(email, [{ id: 'contact:42', to: 'ana@example.com', values: { name: 'Ana' } }], {
  from: 'Rebo Studio <news@example.com>',
  transport: resendTransport({ apiKey: process.env.RESEND_KEY! }),
  tracker,
  footer: 'Rebo Studio · 1 Main St.',
});
// [{ recipient: 'contact:42', to: 'ana@example.com', id: 're_…' }]

const handle = createMailHandler({
  tracker,
  resendSecret: process.env.RESEND_WEBHOOK_SECRET, // whsec_…
  sender: 'Rebo Studio',
  onEvent: (event) => keep(event), // { type: 'opened' | 'clicked' | 'unsubscribed' | 'bounced' | …, recipient | providerId, at }
});

createServer(nodeHandler(handle)).listen(3000);
```

`createMailHandler` takes a `Request` and gives a `Response`, so the same handler is a Next.js route handler, a Bun or Deno server, or a Worker.

## Sending

- `prepare(email, recipient, options)` makes the email for one recipient: its variables filled, each link through the tracker (counting the click), the picture that counts the opening, the way to stop them in its foot and in its headers (`List-Unsubscribe` and `List-Unsubscribe-Post`, as Gmail and Yahoo ask of whoever sends many). No header can start another.
- `sendEmail(email, recipients, options)` does it for each, gives them to the transport in batches, and says what became of each by the recipient's id, with the provider's id to know it again in the provider's events. Who may be written to is the application's to say: it gives only them.
- `track: { opens: false, clicks: false }` counts neither; without a tracker, nothing is counted and no way to stop them is put.

## Transports

| Transport | What it is |
| --- | --- |
| `resendTransport({ apiKey })` | [Resend](https://resend.com), by its HTTP API, a hundred messages a call, the recipient's id as a tag. |
| `smtpTransport({ host, port, auth })` | Any server by SMTP, with nothing but Node's sockets: STARTTLS (or TLS on 465), PLAIN or LOGIN, one connection a batch; one address refused does not stop the rest. Nothing is sent in the clear unless `allowPlain`. |
| `memoryTransport()` | Nothing leaves: the messages are kept (`.sent`), to try everything without sending. |

A transport of one's own is an object with `send(messages)` giving, for each, its id or why it did not go.

## The routes

Under the tracker's prefix (`/mail`):

| Route | What it does |
| --- | --- |
| `GET /mail/o/:token.gif` | The picture that counts an opening: `opened`. |
| `GET /mail/c/:token?u=…&s=…` | A link counting its click on its way: `clicked`, then where it goes. Only a link made here, as it was made, to the web: never an open redirect. |
| `GET /mail/u/:token` | The page asking whether to stop the emails, in English or Spanish. |
| `POST /mail/u/:token` | Stopped: `unsubscribed`; the inbox's one click (`List-Unsubscribe=One-Click`) too. |
| `POST /mail/webhooks/resend` | Resend's events (delivered, opened, clicked, bounced, complained, delayed), only as Svix signed them with `resendSecret`. |

Every token is signed with the tracker's secret: whose an address is cannot be made up or changed.
