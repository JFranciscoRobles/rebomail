# Blocks and layouts

An `Email` is a `subject`, a `preheader` (the line some inboxes show after it), a `theme` and its `blocks`, one under another. Some blocks hold others: a **section** and the **columns** of a row.

```ts
interface Email {
  subject: string;
  preheader: string;
  theme: Theme;
  blocks: Block[];
}
```

## Blocks

| Block | What it is |
| --- | --- |
| `heading` · `text` | Words. A blank line between paragraphs; `**bold**`, `*italic*`, `[a link](https://…)`. |
| `button` | Words and where they go, in the accent or a colour of its own. |
| `image` | A picture, linked or not, with its words for whoever cannot see it. |
| `hero` | A cover: a big picture, a title, words and a button. |
| `callout` | Words in a box of a tone: `accent`, `green`, `amber`, `gray`. |
| `quote` | Words someone said, and who. |
| `list` | One item a line, numbered or not. |
| `markdown` | Headings, lists, quotes and rules, written as Markdown. |
| `video` | A picture of it and the way to it: no inbox plays a video. |
| `social` | Links to the networks: Facebook, Instagram, TikTok, YouTube, LinkedIn, X, a website. |
| `menu` | Links in a row, as the top of a site: up to eight, each its words and where it goes. |
| `coupon` | A code in a dashed box, what it gives above it and until when under it. |
| `table` | Rows of what something is and its value, as an order or the details of an appointment; its last row may be a `total`. |
| `rating` | A question and five stars, each a link: `{score}` in its address is the star's number, so `https://example.com/survey?score={score}` tells you how many. Each click is counted as any other. |
| `gallery` | Two or three pictures in a row, each linked or not; one under another on a phone. |
| `divider` · `spacer` | A line; room (`sm`, `md`, `lg`). |
| `html` | HTML written by hand, cleaned of what may do harm. |
| `custom` | One of your application's own: see [Blocks of your own](/docs/custom-blocks/). |

## Layouts

| Layout | What it holds |
| --- | --- |
| `section` | A box with a background (`gray`, `accent`, `dark`, or only its `outline`) holding any block but a section. |
| `columns` | Two or three columns (`1-1`, `1-2`, `2-1`, `1-1-1`), each holding any block but a layout: a phone has no room for more. One under another on a phone. |

```ts
import { makeBlock } from '@rebomail/core';

const row = makeBlock('columns'); // { type: 'columns', widths: '1-1', columns: [[], []] }
row.columns[0].push({ ...makeBlock('image'), src: 'https://example.com/chair.jpg' });
row.columns[1].push({ ...makeBlock('text'), text: '**Lounge chair**\n\n$249' });
```

`allowed(inside, type)` says whether a block may go in a place: `allowed('columns', 'section')` is `false`.

## Changing the tree

Every function gives new lists, and the blocks it did not touch are the same objects as before, so a change is found by comparing them.

```ts
import { EMAIL, insertBlock, moveBlock, removeBlock, updateBlock } from '@rebomail/core';

let blocks = insertBlock(email.blocks, EMAIL, 0, row);
blocks = moveBlock(blocks, heading.id, { parent: row.id, column: 1 }, 0); // into the right column
blocks = updateBlock(blocks, heading.id, { text: 'Hi {name}' });
blocks = removeBlock(blocks, spacer.id);
```

`moveBlock` takes the index as the list is before the block leaves it, so a block dropped between two falls there. `mayPut(blocks, block, place)` says whether it may; a move that may not changes nothing.

## Variables

Words in braces are variables: `{name}`, `{company}`. `renderEmail` fills them from its `values`; one not given stays as written, and `problemsOf(email, { variables })` names it. `variablesIn(text)` lists those of a text.

## Reading what was kept

An email kept as JSON, or sent by someone, may be anything. `readEmail(given)` makes it an email: each block with only what its type has, layouts in layouts taken out, colours that are not colours made the default. `readBlocks` and `readTheme` do it for a part.
