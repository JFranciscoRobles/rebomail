# Rebomail

Emails for the browser, with an engine of their own, in the look of the Rebo
suite. An email is blocks one under another (headings, texts, buttons,
pictures, a cover, quotes, lists, videos, Markdown, your own HTML), laid out in
**sections** and **columns** that hold other blocks, and made into the HTML
every inbox reads: in tables, its styles on each element, its columns one
under another on a phone, and in plain text beside it.

It is the email of the Rebo suite, beside [Rebodocs](https://rebodocs.com),
Rebosheets, ReboSlides, ReboNotes and ReboFiles. It is early: version 0.1,
the engine and the editor written and tested, nothing on npm yet.

The editor writes the email on itself: blocks dragged from a palette onto it,
into sections and columns, their words typed where they show, the rest set
in a panel beside it, and the email as an inbox shows it a click away.

```tsx
import '@rebomail/react/styles.css';
import { MailEditor, sampleEmail } from '@rebomail/react';

<MailEditor email={sampleEmail('es')} locale="es" onChange={save} />
```

## Quick start

```ts
import { renderEmail, sampleEmail } from '@rebomail/core';

const email = sampleEmail('en');

const { subject, html, text } = renderEmail(email, {
  values: { name: 'Ana' }, // fills {name}
  base: 'https://example.com', // where `/…` addresses are
  link: (url) => `https://example.com/t?u=${encodeURIComponent(url)}`, // counts the clicks
  footer: 'Rebo Studio · 1 Main St.',
  unsubscribe: 'https://example.com/unsubscribe/abc',
});
```

## Your own blocks

Rebomail knows nothing of what your application sells. A product, a property
or the signature of whoever sends the email is a **custom** block: a kind and
its data, kept with the email, and drawn by what you give the renderer.

```ts
import { type CustomBlock, renderEmail } from '@rebomail/core';

const product: CustomBlock = {
  html: (block, ctx) => `<p style="color:${ctx.inks.strong}">${block.data.name}</p>${ctx.button('Buy', String(block.data.url))}`,
  text: (block) => `${block.data.name}`,
  complete: (block) => !!block.data.name,
};

renderEmail(email, { custom: { product } });
```

## Packages

| Package | What it is |
| --- | --- |
| [`@rebomail/core`](packages/core) | The engine: the email and its blocks, the tree (moving a block into a column, out of a section), what an email lacks before it goes, and its HTML and text. No DOM. |
| [`@rebomail/react`](packages/react) | The editor in React: the whole of it as one component, or its parts (palette, canvas, panel, preview) and headless hooks; blocks of one's own registered with how they look and what they ask. |
| [`@rebomail/server`](packages/server) | Sending and following: each email made for its recipient, sent with Resend or by SMTP, its openings and clicks counted, stopping them in one click, Resend's events taken as signed. No dependencies but core. |

Coming: `@rebomail/mcp`, emails written by AI assistants.

## Developing

```sh
npm install
npm run dev       # the playground, on http://localhost:5300
npm run site      # the site (home, demo, docs in English and Spanish), on http://localhost:5301
npm test          # every package's tests
npm run typecheck
npm run lint
```

## License

MIT
# rebomail
