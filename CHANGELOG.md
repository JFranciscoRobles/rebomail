# Changelog

Every package of Rebomail is released at the same version. Before 1.0, a
minor version (0.x.0) may change the API; such changes are listed under
**Changed** with what to do about them.

## Unreleased

### Added

- **The engine** (`@rebomail/core`): an email of blocks (headings, texts,
  buttons, pictures, a cover, callouts, quotes, lists, Markdown, videos,
  social links, a menu, a coupon, a table with its total, a rating of five
  stars, a gallery, dividers, room, HTML written by hand), **sections** and
  **columns** that hold other blocks, and **custom** blocks of the
  application's own, drawn by what it gives the renderer.
- Reading an email from what was kept or sent: only what each type has, as
  long as it may be, and only where it may go (no section in a section, no
  layout in a column).
- The tree, immutable: finding, changing, taking away, putting, moving (into
  a column, out of a section) and duplicating a block, wherever it is.
- Rendering: HTML in tables with each element's style on it, columns one
  under another on a phone, variables filled, links through what counts the
  clicks, the footer, the way to unsubscribe and the pixel that counts the
  opening; and the email's text beside it. HTML written by hand is cleaned of
  what may do harm.
- **The editor** (`@rebomail/react`): the email written on itself. A
  palette of every block, dragged onto the email or put with a click; the
  email as it will look, each block chosen with a click and its words typed
  where they show (⌘B, ⌘I, ⌘K for bold, italic and links), the marks shown
  as the email draws them until the words are clicked; blocks dragged by
  their handle into sections and columns, a line where they fall; a panel for
  what is not written on the email, and the email's colours, name, logo,
  width and what it lacks; the preview on a computer or a phone; undo and
  redo. As one component (`MailEditor`) or as parts and hooks
  (`MailProvider`, `useMail`, `MailCanvas`, `MailPalette`, `MailInspector`,
  `MailPreview`). Blocks of the application's own, registered with how they
  look and what they ask. English and Spanish; light and dark.
- **Sending** (`@rebomail/server`): each email made for its recipient
  (values filled, links through a signed tracker, the picture that counts the
  opening, `List-Unsubscribe` in one click), sent in batches with Resend
  (its batch API, no SDK), by SMTP (Node's sockets only: STARTTLS, PLAIN and
  LOGIN; one address refused does not stop the rest) or kept in memory. The
  routes the emails come back to (openings, clicks, the page that stops them,
  Resend's events signed as Svix signs them), as a handler of `Request`s and
  for `node:http`; each event told to the application, nothing kept.
- **The playground** (`npm run dev`): the editor with a block of its own, the
  email kept in the browser, and its HTML, text and JSON to copy.
- **The site** (`npm run site`): the home, with the editor working in it;
  the demo; and the documentation, in the frame of Rebodocs': fourteen pages
  in English and Spanish (`apps/site/content/docs`), by group in a sidebar,
  searched with ⌘K, their code coloured by Shiki, the engine and the editor
  running among their words. As plain files for any host.
- What an email lacks before it goes (a subject, an empty column, a picture
  without its address, a link no inbox opens, a variable nobody fills), by a
  code and in words, in English and Spanish.
