# @rebomail/core

The engine of [Rebomail](../../README.md): an email of blocks, the tree they make (sections and columns holding others), what is done to it as it is written, what it lacks before it goes, and the HTML and text every inbox reads. No DOM: it runs in the browser, Node, Deno, Bun and Workers.

```ts
import { blankEmail, insertBlock, makeBlock, moveBlock, problemsOf, renderEmail, EMAIL } from '@rebomail/core';

let email = blankEmail({ name: 'Rebo Studio', accent: '#3b63fb' });
const row = makeBlock('columns'); // two halves
const hello = { ...makeBlock('heading'), text: 'Hi {name}' };

email = { ...email, subject: 'Hi {name}', blocks: insertBlock(insertBlock(email.blocks, EMAIL, 0, row), EMAIL, 1, hello) };
email = { ...email, blocks: moveBlock(email.blocks, hello.id, { parent: row.id, column: 1 }, 0) }; // into the right column

problemsOf(email); // [{ code: 'empty-layout', block: row.id, type: 'columns', column: 0 }]
renderEmail(email, { values: { name: 'Ana' } }).html;
```

Everything is immutable: each function gives new lists, and the blocks it did not touch are the same objects as before, so a change is found by comparing them.

## The email

An `Email` is a `subject`, a `preheader` (the line some inboxes show after it), a `theme` (accent, background, card and ink colours, font, width, corners, and the name and logo on top) and its `blocks`.

| Block | What it is |
| --- | --- |
| `heading`, `text` | Words. A blank line between paragraphs; `**bold**`, `*italic*`, `[a link](https://…)`. |
| `button` | Words and where they go, in the accent or a colour of its own. |
| `image`, `hero` | A picture, linked or not; a cover: a big picture, a title, words and a button. |
| `callout`, `quote`, `list` | Words in a box of a tone; words someone said, and who; one item a line. |
| `markdown` | Headings, lists, quotes and rules, written as Markdown. |
| `video` | A picture of it and the way to it: no inbox plays a video. |
| `social` | Links to the networks, by their names. |
| `menu`, `coupon` | Links in a row; a code in a dashed box, what it gives and until when. |
| `table` | Rows of what something is and its value; the last one a total, if it says so. |
| `rating` | A question and five stars, each a link: `{score}` in its address is the star's number. |
| `gallery` | Two or three pictures in a row, one under another on a phone. |
| `divider`, `spacer` | A line; room. |
| `html` | HTML written by hand, cleaned of what may do harm (scripts, frames, forms, handlers, `javascript:`). |
| `section` | A box with a background (grey, the accent's light, dark, or only its edge) holding any block but a section. |
| `columns` | Two or three columns (½·½, ⅓·⅔, ⅔·⅓, ⅓·⅓·⅓), each holding any block but a layout: a phone has no room for more. One under another on a phone. |
| `custom` | One of the application's own: a kind and its data, drawn by what it gives `renderEmail`. |

Variables in braces (`{name}`) are filled by `renderEmail`'s `values`; one not given stays as written, and `problemsOf(email, { variables })` names it.

## Functions

- **Blocks**: `makeBlock(type)`, `blankEmail(theme?)`, `readEmail(given)`, `readBlocks(given)`, `readTheme(given)` (what was kept or sent, only what each type has), `allowed(inside, type)`.
- **The tree**: `walk`, `findBlock`, `whereIs`, `listAt`, `insideOf`, `updateBlock`, `removeBlock`, `insertBlock`, `moveBlock` (the index as the list is before the block leaves, so a block dropped between two falls there), `mayPut`, `copyBlock`, `duplicateBlock`.
- **Words**: `fill`, `variablesIn`, `inlineHtml`, `inlineText`, `escapeHtml`, `safeUrl`.
- **Rendering**: `renderEmail(email, options)` gives `{ subject, preheader, html, text }`; `blockHtml` and `blockText` for one block; `cleanHtml`. Options: `values`, `link` (what each link goes through, to count clicks), `base` (where `/…` is), `footer`, `unsubscribe`, `pixel`, `locale` (`en`, `es`), `custom`.
- **Before it goes**: `problemsOf(email, { custom?, variables? })` and `describeProblem(problem, locale)`.
- `sampleEmail(locale)`, to start from.
