# Blocks of your own

Rebomail knows nothing of what your application sells. A product, a property, the signature of whoever sends the email: each is a **custom** block, a kind and its data kept with the email, and drawn by what your application gives the editor and the renderer.

## In the email

A custom block is kept as `{ type: 'custom', kind, data }`, its data any JSON. The engine draws it with a `CustomBlock`: its HTML, its text, and whether it has what it needs.

```ts
import { type CustomBlock, renderEmail } from '@rebomail/core';

const product: CustomBlock = {
  html: (block, ctx) =>
    `<p style="margin:0 0 8px;font-weight:bold;color:${ctx.inks.strong}">${ctx.fill(String(block.data.name))}</p>` +
    ctx.button('Buy', String(block.data.url)),
  text: (block) => `${block.data.name}: ${block.data.url}`,
  complete: (block) => !!block.data.name && !!block.data.url,
};

renderEmail(email, { custom: { product } });
```

The `ctx` it is given is what the built-in blocks are drawn with:

| Field | What it is |
| --- | --- |
| `width` | How wide it may be, in pixels: the email's, a section's or a column's. |
| `theme` · `inks` | The email's colours, and the inks of its words (`text`, `strong`, `soft`, `faint`). |
| `fill(text)` | The text with its variables filled. |
| `inline(text)` | Filled, with its marks as HTML, escaped. |
| `link(url)` | A link as it goes in the email: whole, and through what counts the clicks. |
| `absolute(url)` | An address made whole on the `base`. |
| `button(label, url, color?)` | A button as the built-in one is drawn, in tables Outlook reads. |

What a block without `complete` has is always enough; one with it that says `false` is named by `problemsOf`.

> Escape what comes from people. `ctx.inline` does it; a value put in the HTML as it is does not.

## In the editor

The editor takes the same renderer, and how the block looks and what it asks:

```tsx
import { Editable, type EditorBlock } from '@rebomail/react';

const product: EditorBlock = {
  kind: 'product',
  label: 'Product',
  group: 'Shop',
  data: () => ({ name: '', url: '' }),
  render: productRenderer,
  Look: ({ block, update }) => (
    <Editable value={String(block.data.name)} onChange={(name) => update({ ...block.data, name })} placeholder="Name" />
  ),
  Fields: ({ block, update }) => (
    <input value={String(block.data.url)} onChange={(e) => update({ ...block.data, url: e.target.value })} />
  ),
};

<MailEditor email={email} blocks={[product]} />;
```

| Field | What it is |
| --- | --- |
| `kind` | Its name in the email. Never change it once emails are kept with it. |
| `label` · `group` · `icon` | How the palette shows it; under "Your blocks" if it has no group. |
| `data()` | Its data when it is put in the email. |
| `render` | The `CustomBlock` above: the preview and the sending draw it with it. |
| `Look` | How it looks on the email being written; its HTML if none. Given `block`, `theme`, `width` and `update`. |
| `Fields` | What of it is set in the panel. |

<demo name="editor" />

The Product block of the demo is one of these: its picture, name and price drawn on the email, and set in the panel.

## On the server

Give `sendEmail` and `prepare` the same renderers, by kind, in `custom`. A block whose kind has no renderer is left out of the email, not sent as something broken.
