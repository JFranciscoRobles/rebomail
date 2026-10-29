# What is Rebomail

Rebomail is an email editor for the browser, with an engine of its own. An email is blocks one under another, laid out in sections and columns that hold other blocks, and made into the HTML every inbox reads. It was built to live inside another application, a CRM that writes campaigns to its contacts, so it comes as packages you take one by one.

<demo name="editor" />

## What you get

- **An email written on itself.** Click a block and type where its words show; `⌘B`, `⌘I` and `⌘K` for bold, italic and a link. What is not words (links, pictures, colours) goes in a panel beside it.
- **Sections and columns.** Drag blocks into a section with a background, or into two or three columns that stack on a phone. A line says where each one falls.
- **Blocks of your own.** A product, a property, the signature of whoever sends it: registered with how it looks, what it asks and its HTML. Rebomail knows nothing of what you sell.
- **HTML every inbox reads.** Tables, a style on each element, 600 pixels, columns that stack, and plain text beside it. HTML written by hand is cleaned of scripts, frames and forms.
- **Checks before it goes.** No subject, an empty column, a button going nowhere, a variable nobody fills: each said with a code, and in words in English or Spanish.
- **Sending and following.** Resend or any SMTP server; opens and clicks counted through signed links; unsubscribing in one click, as Gmail and Yahoo ask.
- **Undo and redo, English and Spanish, light and dark.** No dependencies but React for the editor, and none at all for the engine.

## The packages

| Package | Take it when |
| --- | --- |
| `@rebomail/react` | You have a React or Next.js application and want the editor in a screen of it. |
| `@rebomail/core` | You make emails in code: render the HTML and text, change the tree of blocks, check what is missing. |
| `@rebomail/server` | You send them: Resend or SMTP, tracking opens and clicks, unsubscribing, Resend's webhooks. |

[Packages](/docs/packages/) says what each one holds and how they depend on each other.

## What it is not

- **Not a sending service.** There is nothing to sign up for. It is code you run; the emails go through your Resend account or your SMTP server.
- **Not a list manager.** Who the recipients are, who stopped the emails and what was opened is your application's to keep: Rebomail tells it each thing as it happens.
- **Not finished.** It is version 0.1: the engine, the editor and the sending written and tested, nothing on npm yet. [Status and roadmap](/docs/status/) lists what is checked and what is missing.

## License

MIT. Anyone may use it for anything, including commercially, with no warranty.
