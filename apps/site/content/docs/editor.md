# The editor

`MailEditor` is the whole editor in one component: the palette of blocks, the email being written, the panel beside it and the preview. It takes the email and gives it back each time it changes.

```tsx
import '@rebomail/react/styles.css';
import { MailEditor } from '@rebomail/react';

<MailEditor email={email} onChange={save} locale="en" blocks={[product]} preview={{ values: { name: 'Ana' } }} />
```

<demo name="editor" />

## Props

| Prop | Type | What it is |
| --- | --- | --- |
| `email` | `Email` | The email to write. A different one given later starts over, its undoing too; the one the editor gave back does not. |
| `onChange` | `(email: Email) => void` | Told of each change. |
| `locale` | `'en' \| 'es'` | The language of the editor and of the email it renders. English unless said. |
| `blocks` | `EditorBlock[]` | Your application's own blocks: see [Blocks of your own](/docs/custom-blocks/). |
| `preview` | `RenderOptions` | What the preview is rendered with: `values` for the variables, `footer`, `unsubscribe`, `base`. |
| `className` | `string` | Put on its root, beside `rm-editor`. |

## What is where

- **The palette**, on the left: every block, by what it is for (words, pictures, layout, your own). Dragged onto the email, or put with a click after the block chosen.
- **The email**, in the middle, as it will look: its subject and preheader on top as an inbox lists them, and each block written where its words show.
- **The panel**, on the right: of the block chosen, what is not written on the email (a link, a picture, a colour, a tone, the widths of the columns). With none chosen, the email's colours, name, logo and width, and what it lacks before it goes.
- **The preview**: the email as the renderer makes it, on a computer or a phone, a click away.

## Writing on the email

Click a block to choose it, and type. A blank line between paragraphs; in a list, one item a line.

| Keys | What they do |
| --- | --- |
| `⌘B` · `⌘I` | Bold and italic on the words chosen: `**bold**`, `*italic*`. |
| `⌘K` | A link on the words chosen: `[words](https://…)`. |
| `⌘Z` · `⇧⌘Z` (`⌘Y`) | Undo and redo. What is typed in one field a moment apart is one change. |
| `Delete` | Removes the block chosen, when no words are being written. |
| `Escape` | Lets the block go. |

Variables are written in braces, `{name}`, and filled when the email is rendered.

## Dragging

Each block has a handle on its left. Drag it anywhere: between two blocks, into a section, into a column, out of one. A line says where it falls, and where it may not (a section in a section, columns in a column) there is none. The bar of the block chosen moves it up and down, duplicates it and removes it without dragging.

## Saving

`onChange` gives the whole email each time; keep it as JSON. When it comes back from where it was kept, `readEmail` takes it with nothing the editor does not know:

```ts
import { readEmail } from '@rebomail/core';

const email = readEmail(await (await fetch('/api/campaigns/7')).json());
```
