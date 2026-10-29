# Getting started

The editor in a React page, an email made into HTML in Node, and the repository run on your machine: the three ways in, each in a few lines.

## Put it in a React application

Rebomail is not on npm yet: take the packages from the repository (they are TypeScript sources, which Next.js and Vite compile as they are). In Next.js, list them in `transpilePackages`.

```tsx
'use client';

import '@rebomail/react/styles.css';
import { type Email, MailEditor, sampleEmail } from '@rebomail/react';
import { useState } from 'react';

export function Campaign() {
  const [email, setEmail] = useState<Email>(() => sampleEmail('en'));
  return <MailEditor email={email} onChange={setEmail} preview={{ values: { name: 'Ana' } }} />;
}
```

The email is a plain object: keep it as JSON wherever your application keeps things, and give it back to the editor with `readEmail(json)`, which keeps only what each block has.

<demo name="editor" />

## Make the HTML in Node

The engine has no DOM. The same email the editor wrote is made into the HTML and text an inbox gets:

```ts
import { readEmail, renderEmail } from '@rebomail/core';

const email = readEmail(JSON.parse(saved));
const { subject, preheader, html, text } = renderEmail(email, {
  values: { name: 'Ana' },
  footer: 'Rebo Studio · 1 Main St.',
  unsubscribe: 'https://example.com/unsubscribe/abc',
});
```

## Send it

`@rebomail/server` makes the email for each recipient and gives it to Resend or an SMTP server:

```ts
import { createTracker, resendTransport, sendEmail } from '@rebomail/server';

const tracker = createTracker({ secret: process.env.MAIL_SECRET!, base: 'https://example.com' });

await sendEmail(email, [{ id: 'contact:42', to: 'ana@example.com', values: { name: 'Ana' } }], {
  from: 'Rebo Studio <news@example.com>',
  transport: resendTransport({ apiKey: process.env.RESEND_KEY! }),
  tracker,
});
```

[Sending](/docs/sending/) and [Opens, clicks and unsubscribing](/docs/tracking/) say the rest.

## Run the repository

```bash
git clone https://github.com/JFranciscoRobles/rebomail
cd rebomail
npm install
npm run dev
```

The playground opens at `localhost:5300`: the editor with an example block of its own, the email kept in the browser, and buttons to copy its HTML, text and JSON.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | The playground, at `localhost:5300`. |
| `npm run site` | This website, at `localhost:5301`. |
| `npm test` | The tests of every package, with Vitest. |
| `npm run typecheck` | Types, over every package and app. |
| `npm run lint` · `format` | Biome: says what is wrong, or writes it right. |
| `npm run coverage` | The tests, with what of the packages they reach. |
| `npm run build` · `build:site` | The playground and this website, as static files. |
