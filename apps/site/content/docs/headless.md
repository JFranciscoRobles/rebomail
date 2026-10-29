# Headless: your own UI

The editor is made of parts, and the parts of one state. Put them in a layout of your own, or leave them out and build the interface on the hooks: the state, the changes and the undoing are the same.

## The parts

```tsx
import { MailCanvas, MailInspector, MailPalette, MailPreview, MailProvider } from '@rebomail/react';

<MailProvider email={email} onChange={save} locale="en" blocks={[product]}>
  <aside><MailPalette /></aside>
  <main><MailCanvas /></main>
  <aside><MailInspector /></aside>
</MailProvider>
```

| Part | What it is |
| --- | --- |
| `MailProvider` | The state: the email, the block chosen, what is dragged, the undoing. Takes `email`, `onChange`, `locale` and `blocks`. |
| `MailPalette` | The blocks to drag or put with a click. |
| `MailCanvas` | The email being written. |
| `MailInspector` | The panel of the block chosen, or of the email. |
| `MailPreview` | The email as the renderer makes it, in a frame: `device` (`desktop`, `phone`), `options`, `height`. |

## useMail

Inside a `MailProvider`, `useMail()` gives the email and every way to change it.

```tsx
import { useMail } from '@rebomail/react';

function Toolbar() {
  const { undo, redo, canUndo, canRedo, problems, add } = useMail();
  return (
    <>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
      <button onClick={() => add('button')}>Add a button</button>
      <span>{problems.length} to fix</span>
    </>
  );
}
```

| Field | What it is |
| --- | --- |
| `email` | The email as it is now. |
| `selected`, `select(id)` | The id of the block chosen; choosing another, or none. |
| `add(what, at?)` | A block of the palette, by its id (`'button'`, `'custom:product'`), or a block made: after the one chosen, at the end, or at `{ place, index }`. Gives its id. |
| `update(id, patch)` | Changes a block. |
| `move(id, place, index)` | Moves a block into a list: the email's, a section's, a column's. |
| `duplicate(id)` · `remove(id)` | What the bar of a block does. |
| `setSubject` · `setPreheader` · `setTheme` | The rest of the email. |
| `undo` · `redo` · `canUndo` · `canRedo` | The history: two hundred changes. |
| `problems` | What the email lacks, as [problemsOf](/docs/checks/) says it. |
| `palette` | The blocks of the palette, built in and your own. |
| `dragged` · `drag` · `canDrop` · `drop` | Dragging, for a palette or a canvas of your own. |

`useSelection()` gives the block chosen itself: `{ selected, block, select }`.

## A place in the email

A list of blocks is named by a `Place`: `EMAIL` for the email itself, `{ parent: id }` for a section, and `{ parent: id, column: 1 }` for the second column of a row. `move`, `drop` and `canDrop` take one.

```ts
import { EMAIL } from '@rebomail/core';

move(heading.id, { parent: row.id, column: 1 }, 0); // to the top of the right column
move(heading.id, EMAIL, 0); // to the top of the email
```

## Keys

`handleMailKeys(event, mail)` is what `MailEditor` does with the keys: undoing, redoing, removing the block chosen and letting it go. Put it on your own root to have the same.

## Editable

`Editable` is the field words are written in on the email: plain text with the marks, the caret kept where it was. Use it in the `Look` of a block of your own to write on it as on the others.

```tsx
<Editable value={String(block.data.name)} onChange={(name) => update({ ...block.data, name })} placeholder="Name" />
```
