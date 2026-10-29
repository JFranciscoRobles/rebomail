# Sending

`@rebomail/server` makes an email for each of its recipients and gives the messages to a transport: Resend, an SMTP server, or memory to try it all without sending. It keeps nothing: who the recipients are, and what became of each, is your application's.

```ts
import { createTracker, resendTransport, sendEmail } from '@rebomail/server';

const tracker = createTracker({ secret: process.env.MAIL_SECRET!, base: 'https://example.com' });

const deliveries = await sendEmail(email, recipients, {
  from: 'Rebo Studio <news@example.com>',
  replyTo: 'hello@example.com',
  transport: resendTransport({ apiKey: process.env.RESEND_KEY! }),
  tracker,
  footer: 'Rebo Studio · 1 Main St.',
  onProgress: (done, of) => console.log(`${done}/${of}`),
});
// [{ recipient: 'contact:42', to: 'ana@example.com', id: 're_…' }, …]
```

## Recipients

| Field | What it is |
| --- | --- |
| `id` | Yours: what the events of this message will say it was. `contact:42`, a row's id. |
| `to` | The address. |
| `values` | The variables of this one: `{ name: 'Ana' }`. |
| `replyTo` | Where answers go, for this one only. |

Who may be written to is your application's to say: give only them, without those who stopped the emails.

## Options

| Option | What it is |
| --- | --- |
| `from` | `Name <address>`, of a domain your provider lets you send from. |
| `transport` | Where the messages go: below. |
| `tracker` | Counts opens and clicks, and puts the way to stop the emails. None: neither. |
| `track` | `{ opens: false }`, `{ clicks: false }`: count less. |
| `footer` · `base` · `locale` · `custom` | As [renderEmail](/docs/rendering/) takes them. |
| `headers` · `tags` | On every message. |
| `batch` | How many messages go to the transport at a time: a hundred. |
| `onProgress` | Told after each batch. |

Each delivery says the recipient's `id`, the address, and either the provider's `id` of the message (to know it again in the provider's events) or the `error` that kept it from going. One that fails does not stop the others.

## One message

`prepare(email, recipient, options)` makes the message of one recipient without sending it: `{ from, to, replyTo, subject, html, text, headers, tags }`. Its variables are filled, its links go through the tracker, the picture that counts the opening is at its end, and the way to stop the emails is in its foot and in its headers (`List-Unsubscribe` and `List-Unsubscribe-Post`, as Gmail and Yahoo ask of whoever sends many). No value can start a header of its own.

## Transports

### resendTransport

```ts
resendTransport({ apiKey: process.env.RESEND_KEY! });
```

[Resend](https://resend.com) by its HTTP API, without its SDK: a hundred messages a call to its batch endpoint, the recipient's id as a tag. `fetch` may be given, for a runtime of your own or a test.

### smtpTransport

```ts
smtpTransport({ host: 'smtp.example.com', port: 587, auth: { user, pass } });
```

Any server by SMTP, with nothing but Node's sockets: STARTTLS on 587, TLS from the start on 465 (`secure`), `PLAIN` or `LOGIN`, one connection a batch. An address the server refuses does not stop the rest. Nothing is sent in the clear: a server without STARTTLS is refused unless `allowPlain`, for one on your own machine.

| Option | What it is |
| --- | --- |
| `host` · `port` | The server; 587 unless said. |
| `secure` | TLS from the start; on 465 unless said. |
| `auth` | `{ user, pass }`. |
| `name` | What this end calls itself in `EHLO`. |
| `allowPlain` | Whether a server without STARTTLS may be written to in the clear. |
| `tls` | Node's TLS options: a certificate of your own. |
| `timeout` | How long a reply may take, in milliseconds. |

### memoryTransport

```ts
const transport = memoryTransport();
await sendEmail(email, recipients, { from, transport });
transport.sent; // the messages, with their ids
```

Nothing leaves: for tests, and for a demo without a key.

### Your own

A transport is an object with a `name` and `send(messages)`, which gives for each message its address and its `id` or `error`.

```ts
const logged: Transport = {
  name: 'log',
  send: async (messages) => messages.map((m) => (console.log(m.to, m.subject), { to: m.to, id: crypto.randomUUID() })),
};
```
