# Packages

Three packages, each standing on the one below it and on nothing else. Take only the ones you need: an application that renders emails in code and sends them through a service of its own needs only the engine.

| Package | What it holds | Depends on |
| --- | --- | --- |
| `@rebomail/core` | The engine: the email and its blocks, the tree, the checks, the HTML and text. No DOM. | nothing |
| `@rebomail/react` | The editor: the whole of it as one component, its parts, the hooks, the styles. | core, React 19 |
| `@rebomail/server` | Sending and following: prepare, transports, the tracker and its handler. Node 22. | core |

## @rebomail/core {#core}

```ts
import { renderEmail, problemsOf, readEmail, sampleEmail } from '@rebomail/core';
```

Runs in the browser, Node, Deno, Bun and Workers. Everything in it is a function of plain objects: an email is JSON, and each change gives a new one. [Blocks and layouts](/docs/blocks/), [HTML for every inbox](/docs/rendering/) and [Before it goes](/docs/checks/) say what it does.

## @rebomail/react {#react}

```ts
import '@rebomail/react/styles.css';
import { MailEditor, MailProvider, useMail } from '@rebomail/react';
```

| Entry | What it is |
| --- | --- |
| `@rebomail/react` | The components and the hooks; `blankEmail`, `readEmail`, `renderEmail` and `sampleEmail` of core again, so a page needs only this one. |
| `@rebomail/react/styles.css` | The styles of the editor, under `.rm-editor`. |

[The editor](/docs/editor/), [Headless](/docs/headless/), [Blocks of your own](/docs/custom-blocks/) and [Styling](/docs/styling/) say how it is used.

## @rebomail/server {#server}

```ts
import { createMailHandler, createTracker, sendEmail, resendTransport, smtpTransport } from '@rebomail/server';
```

For a server: it uses `node:crypto`, and `node:net` and `node:tls` for SMTP. The handler is a `Request` to a `Response`, and runs wherever those are. [Sending](/docs/sending/) and [Opens, clicks and unsubscribing](/docs/tracking/) say how.

## How they are made

The packages are TypeScript sources, exported as they are, with no build: Next.js, Vite and Vitest compile them. Each is tested with Vitest; the editor in a DOM made by happy-dom, the SMTP client against a server listening on a real socket.
