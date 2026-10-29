# HTML for every inbox

`renderEmail(email, options)` makes an email into what an inbox gets: its subject and preheader with their variables filled, its HTML, and its plain text. It runs anywhere JavaScript does: the browser, Node, Deno, Bun, a Worker.

```ts
import { renderEmail } from '@rebomail/core';

const { subject, preheader, html, text } = renderEmail(email, {
  values: { name: 'Ana' },
  base: 'https://example.com',
  footer: 'Rebo Studio · 1 Main St.',
  unsubscribe: 'https://example.com/unsubscribe/abc',
});
```

<demo name="render" />

## Options

| Option | What it is |
| --- | --- |
| `values` | The values of the variables: `{ name: 'Ana' }` for `{name}`. |
| `link` | What each link goes through, to count its clicks: `(url) => string`. As it is, if not given. |
| `base` | Where an address that starts with `/` is: `https://example.com`. |
| `footer` | Words under the email, with their marks: who sends it and why it comes. |
| `unsubscribe` | Where to stop receiving them: linked under the footer. |
| `pixel` | A picture's address that counts the opening when it is loaded. |
| `locale` | `en` or `es`: the words the email says by itself ("Unsubscribe", "Watch the video"). |
| `custom` | How to draw your own blocks, by their kind. |

`@rebomail/server` gives `link`, `pixel` and `unsubscribe` for each recipient; see [Opens, clicks and unsubscribing](/docs/tracking/).

## What the HTML is

Inboxes are not browsers. Outlook draws with Word; Gmail takes out every `<style>` it does not like; none runs a script. So the HTML is written as email has been written for twenty years:

- **Tables**, not `div`s with `flex`: the card, each section, each row of columns, each button.
- **A style on each element**, not a stylesheet. The one `<style>` left only stacks the columns on a phone, and an inbox that drops it shows them side by side, still readable.
- **600 pixels** wide by default (`theme.width`, from 320 to 800), centred, the card on its background.
- **Columns that stack** under the width of the email, each as wide as the phone.
- **Buttons in tables of their own**, the colour on the cell, so Outlook does not stretch them.
- **The preheader hidden** at the top, so inboxes show it after the subject and the email does not.
- **Addresses made whole**: `/news` becomes `https://example.com/news` on the `base`.

## Plain text

`text` is the same email without HTML, for the inboxes and the people who read only that: headings in capitals, links written after their words, a button as its words and its address, columns one after another. It is sent beside the HTML, in the same message.

## Your own HTML

The `html` block takes HTML written by hand. `cleanHtml` takes out what may do harm before it goes in the email: `<script>`, `<iframe>`, `<object>`, `<embed>`, forms, `on…` handlers, `javascript:` addresses. Its links go through `link` like the others, and its variables are filled.

## One block

`blockHtml(block, ctx)` and `blockText(block, ctx)` draw a single block, with a context made by `contextOf(email, options)`: what a preview of one block, or a renderer of your own, uses.
