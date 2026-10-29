# Styling

`@rebomail/react/styles.css` draws the editor. Everything in it is under `.rm-editor`, its classes start with `rm-`, and its colours are CSS variables, so a page gives it its own without touching the rest.

```ts
import '@rebomail/react/styles.css';
```

## Colours

| Variable | What it colours |
| --- | --- |
| `--rm-bg` | Around the email. |
| `--rm-surface` | The palette, the panel, the bars. |
| `--rm-line` | Lines and borders. |
| `--rm-text` · `--rm-muted` | Words, and the quieter ones. |
| `--rm-hover` | What is under the pointer. |
| `--rm-brand` · `--rm-brand-light` | What is chosen, where a block falls, the buttons of the editor. |

```css
.rm-editor {
  --rm-brand: #0d9488;
  --rm-brand-light: #e6f6f4;
}
```

## Light and dark

The editor is dark when the page is (`prefers-color-scheme: dark`), unless `<html data-theme="light">` says otherwise; `data-theme="dark"` makes it dark always. The email in it is always light, as inboxes show it: its colours are the email's theme, not the page's.

## Size

The editor fills what it is given. Give its parent a height (`height: 100vh`, or a row of a grid) and the palette, the email and the panel scroll each by itself.

## The look of the email

How the email looks is not CSS but its `theme`: the accent, the background, the card, the ink, the font, the width, the corners, and the name and logo on top. The panel sets them when no block is chosen; in code:

```ts
import { blankEmail } from '@rebomail/core';

const email = blankEmail({ accent: '#0d9488', name: 'Rebo Studio', logo: 'https://example.com/logo.png', radius: 12 });
```

Fonts are those every computer has (`Arial`, `Georgia`, `Verdana`…): inboxes load none.
