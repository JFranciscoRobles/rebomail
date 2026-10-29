# Status and roadmap

Rebomail is at version 0.1. This page says plainly what is checked, what is not, and what comes next.

## What is checked

- **The engine**: every block drawn to HTML and text; the tree (inserting, moving between columns and sections, removing, copying); reading what was kept; the checks; cleaning HTML written by hand.
- **The editor**: in a DOM made by happy-dom, the palette, choosing, writing with the marks, the panel, undoing, the keys and custom blocks.
- **The server**: preparing a message and its headers; Resend's batch API against a fake `fetch`; the SMTP client against a server on a real socket (STARTTLS refused, authentication, an address refused, dot-stuffing); the tracker's signatures; every route of the handler; Svix's signatures; the node adapter.
- Types and Biome over everything; the playground and this site built.

## What is not

- **Dragging in a real browser.** The tests cover the state; the hand of a person on a mouse and a touch screen has not been tested by a machine.
- **Sending for real.** Neither a real Resend account nor a real SMTP server has been written to yet.
- **Inboxes.** The HTML follows what is known to work in Gmail, Outlook and Apple Mail, but it has not been seen in each of them by a service like Litmus.

## Known limits

- Fonts are only those every computer has; inboxes load none.
- A video is a picture and a link: no inbox plays one.
- Columns are two or three; a column holds no layout.
- Opens are counted by a picture, which some inboxes load by themselves and others never.

## Roadmap

- **`@rebomail/mcp`**: emails written by AI assistants, block by block, with the same checks.
- **Inside ReboCRM**, the application it was made for: its properties and its agents' signatures as blocks of its own.
- **On npm.**

## Contributing

Open an issue or a pull request in the [repository](https://github.com/JFranciscoRobles/rebomail). Run `npm test`, `npm run typecheck` and `npm run lint` before; a change to what an inbox gets wants a test of its HTML.

## License

MIT.
