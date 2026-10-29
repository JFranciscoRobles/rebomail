# Opens, clicks and unsubscribing

A tracker signs each recipient's links; a handler answers them. Between the two, each open, each click and each person who stops the emails is told to your application, with the recipient's `id` it was sent with. Resend's own events (delivered, bounced, complained) come by the same handler.

```ts
import { createMailHandler, createTracker } from '@rebomail/server';

export const tracker = createTracker({ secret: process.env.MAIL_SECRET!, base: 'https://example.com' });

export const handle = createMailHandler({
  tracker,
  resendSecret: process.env.RESEND_WEBHOOK_SECRET, // whsec_…
  sender: 'Rebo Studio',
  onEvent: async (event) => {
    // { type: 'opened' | 'clicked' | 'unsubscribed' | 'delivered' | 'bounced' | …, recipient?, providerId?, url?, at, via }
    await db.mailEvents.create({ data: event });
  },
});
```

## The tracker

| Option | What it is |
| --- | --- |
| `secret` | Long, random, the same in every process: what the addresses are signed with. Sixteen characters at least. |
| `base` | Where the server is seen from outside: `https://example.com`. |
| `prefix` | The path its routes are under: `/mail`. |

Every token is the recipient's id and a mark made with the secret: whose an address is cannot be made up or changed, and a link cannot be made to go anywhere it was not sent to.

## The routes

| Route | What it does |
| --- | --- |
| `GET /mail/o/:token.gif` | The picture that counts an opening: `opened`. |
| `GET /mail/c/:token?u=…&s=…` | A link counting its click on its way: `clicked`, then where it goes. Only a link made here, as it was made: never an open redirect. |
| `GET /mail/u/:token` | The page asking whether to stop the emails, in English or Spanish, in the `accent`. |
| `POST /mail/u/:token` | Stopped: `unsubscribed`. The inbox's own button (`List-Unsubscribe=One-Click`) posts here too. |
| `POST /mail/webhooks/resend` | Resend's events, only as Svix signed them with `resendSecret`. |

## Putting the handler somewhere

`createMailHandler` takes a `Request` and gives a `Response`, so it is a route handler of Next.js, a Bun or Deno server, or a Worker, as it is.

```ts
// app/mail/[...path]/route.ts, in Next.js
import { handle } from '@/lib/mail';

export const GET = handle;
export const POST = handle;
```

In Node, `nodeHandler` makes it a listener of `node:http`:

```ts
import { createServer } from 'node:http';
import { nodeHandler } from '@rebomail/server';

createServer(nodeHandler(handle)).listen(3000);
```

## Events

| Field | What it is |
| --- | --- |
| `type` | `opened`, `clicked`, `unsubscribed` from the links; `delivered`, `opened`, `clicked`, `bounced`, `complained`, `delayed` from Resend. |
| `recipient` | Your id, from the email's own links. |
| `providerId` | The provider's id of the message, from its events: the `id` of the delivery. |
| `url` | The link clicked. |
| `at` · `via` | When, and whether by a `link` or a `webhook`. |

An address that bounced or complained should not be written to again: keep it, and leave it out of the next recipients.

## The webhook of Resend

In Resend, add a webhook to `https://example.com/mail/webhooks/resend` and give its signing secret as `resendSecret`. Without it the route answers nothing. `verifySvix(secret, headers, body)` is the check, for a route of your own.

## Counting less

Opens are counted by a picture, which some inboxes load by themselves and others never: a number to compare, not a fact. `track: { opens: false }` leaves the picture out; `track: { clicks: false }` leaves links as they are. Without a tracker nothing is counted, and no way to stop the emails is put: put your own `unsubscribe`.
