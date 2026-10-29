# @rebomail/react

The email of [Rebomail](../../README.md) written on itself, in React: the whole editor as one component, or its parts and headless hooks for an interface of one's own.

```tsx
import '@rebomail/react/styles.css';
import { MailEditor, sampleEmail } from '@rebomail/react';

<MailEditor email={sampleEmail('es')} locale="es" onChange={save} preview={{ values: { name: 'Ana' } }} />
```

- **The palette**: every block, by what it is for, dragged onto the email or put with a click after the one chosen.
- **The email**, as it will look: its subject on top as an inbox shows it; each block chosen with a click and its words written where they show (`⌘B` bold, `⌘I` italic, `⌘K` a link); blocks dragged by their handle anywhere, into a section or a column too, a line saying where they fall; the chosen one with its bar (up, down, duplicate, remove).
- **The panel**: of the block chosen, what is not written on the email (links, pictures, colours, tones, widths); with none, the email's colours, name, logo and width, and what it lacks before it goes.
- **The preview**: the email as the renderer makes it, on a computer or a phone.
- `⌘Z` undoes and `⇧⌘Z` redoes, what is typed in one field a moment apart being one change; `Delete` removes the block chosen, `Escape` lets it go.

## Its parts, in a layout of one's own

```tsx
import { MailCanvas, MailInspector, MailPalette, MailPreview, MailProvider, useMail } from '@rebomail/react';

function Bar() {
  const { undo, canUndo, problems } = useMail();
  return <button onClick={undo} disabled={!canUndo}>Undo ({problems.length} to fix)</button>;
}

<MailProvider email={email} onChange={save} locale="en">
  <Bar />
  <MailPalette />
  <MailCanvas />
  <MailInspector />
</MailProvider>
```

`useMail()` gives the email and every way to change it (`add`, `update`, `move`, `duplicate`, `remove`, `setSubject`, `setTheme`, `undo`, `redo`), the block chosen, what is dragged and where it may fall, the palette and the problems; `useSelection()` gives the block chosen. `Editable` is the field the words are written in on the email, for blocks of one's own.

## Blocks of one's own

```tsx
import type { EditorBlock } from '@rebomail/react';

const product: EditorBlock = {
  kind: 'product',
  label: 'Product',
  data: () => ({ name: '', url: '' }),
  render: { html: (b, ctx) => `<p>${b.data.name}</p>${ctx.button('Buy', String(b.data.url))}`, complete: (b) => !!b.data.name },
  Look: ({ block }) => <p>{String(block.data.name)}</p>, // on the email being written; its HTML if none
  Fields: ({ block, update }) => <input value={String(block.data.name)} onChange={(e) => update({ ...block.data, name: e.target.value })} />,
};

<MailEditor email={email} blocks={[product]} />;
```

It goes in the palette under its group ("Your blocks" if none), on the email as its `Look` says, in the panel as its `Fields` say, and in the preview and the email sent as its `render` says.

## Styles

`@rebomail/react/styles.css` draws the editor, light and dark as the page is (`prefers-color-scheme`, or `data-theme` on `<html>`). Its colours are variables on `.rm-editor` (`--rm-bg`, `--rm-surface`, `--rm-line`, `--rm-text`, `--rm-muted`, `--rm-brand`…), for a page to give its own. The email in it is always light, as inboxes show it.
