# API

Every function, component and hook the packages export, by package, each in a line. The pages of the documentation say how they are used together.

## @rebomail/core {#core}

### renderEmail

`renderEmail(email, options?)` → `{ subject, preheader, html, text }`. The email as an inbox gets it. [Options](/docs/rendering/#options).

### blockHtml

`blockHtml(block, ctx, custom?)` and `blockText(block, ctx, custom?)`: one block, with a context of `contextOf`.

### contextOf

`contextOf(email, options?)` → `RenderContext`: what blocks are drawn with.

### cleanHtml

`cleanHtml(html, ctx)`: HTML written by hand, without scripts, frames, forms, handlers or `javascript:`.

### problemsOf

`problemsOf(email, { variables?, custom? })` → `Problem[]`. What the email lacks before it goes. [The problems](/docs/checks/#the-problems).

### describeProblem

`describeProblem(problem, locale?)`: a problem in words, in English or Spanish.

### isComplete

`isComplete(block, custom?)`: whether a block has what it needs to show something.

### makeBlock

`makeBlock(type, custom?)`: a block as it starts, with a new id. `makeBlock('custom', { kind, data })` for one of your own.

### blankEmail

`blankEmail(theme?)`: an email with nothing in it, in the theme given over the default one.

### sampleEmail

`sampleEmail(locale?)`: an email of every kind of block, to start from.

### readEmail

`readEmail(given)`, `readBlocks(given)`, `readTheme(given)`: what was kept or sent, made an email, with only what each type has.

### allowed

`allowed(inside, type)`: whether a block of `type` may go in the email, a section or a column.

### insertBlock

`insertBlock(blocks, place, index, block)`: the block put at `index` of the list at `place`.

### moveBlock

`moveBlock(blocks, id, place, index)`: the block moved, `index` counted before it leaves. Nothing changes if it may not go there.

### updateBlock

`updateBlock(blocks, id, patch)`: the block changed.

### removeBlock

`removeBlock(blocks, id)`: the block taken out, wherever it is.

### duplicateBlock

`duplicateBlock(blocks, id)` → `{ blocks, copy }`: a copy after it, with new ids; `copyBlock(block)` makes the copy.

### findBlock

`findBlock(blocks, id)`, `whereIs(blocks, id)` (its place and index), `listAt(blocks, place)`, `insideOf(blocks, place)`, `walk(blocks)` (every block, in order), `contains(block, id)`, `mayPut(blocks, block, place)`, `editList(blocks, place, change)`.

### EMAIL

`EMAIL` (`{ parent: null }`): the place of the email's own list. `samePlace(a, b)` compares two places.

### fill

`fill(text, values)`, `variablesIn(text)`, `inlineHtml(text, link, accent)`, `inlineText(text, link?)`, `escapeHtml(text)`, `safeUrl(url)`.

### Types

`Email`, `Theme`, `Block`, `BlockOf<T>`, `BlockType`, `Place`, `Problem`, `RenderOptions`, `RenderContext`, `CustomBlock`, `Locale`; and the lists `BLOCK_TYPES`, `TONES`, `LOOKS`, `WIDTHS`, `SIZES`, `NETWORKS`, `DEFAULT_THEME`.

## @rebomail/react {#react}

### MailEditor

`<MailEditor email onChange locale blocks preview className />`: the whole editor. [Props](/docs/editor/#props).

### MailProvider

`<MailProvider email onChange locale blocks>`: the state the parts share.

### MailPalette

`<MailPalette />`, `<MailCanvas />`, `<MailInspector />`: the parts, inside a provider.

### MailPreview

`<MailPreview device options height />`: the email as the renderer makes it, in a frame.

### useMail

`useMail()` → `MailState`: the email and every way to change it. [Its fields](/docs/headless/#usemail).

### useSelection

`useSelection()` → `{ selected, block, select }`.

### Editable

`<Editable value onChange placeholder multiline marks />`: the field words are written in on the email.

### handleMailKeys

`handleMailKeys(event, mail)`: the keys of the editor, for a root of your own.

### toggleMark

`toggleMark({ text, start, end }, mark)` and `addLink({ text, start, end }, placeholder?)` → the text and the selection after: bold, italic and links on plain text.

### EditorBlock

`EditorBlock`: one of your own blocks, as the editor takes it. [Its fields](/docs/custom-blocks/#in-the-editor).

### WORDS

`WORDS`: what the editor says, in English and Spanish. `Icon`, the icons it draws.

## @rebomail/server {#server}

### sendEmail

`sendEmail(email, recipients, options)` → `Delivery[]`. [Options](/docs/sending/#options).

### prepare

`prepare(email, recipient, options)` → `Message`: one recipient's, unsent.

### resendTransport

`resendTransport({ apiKey, fetch? })`: Resend, a hundred a call.

### smtpTransport

`smtpTransport({ host, port, secure, auth, name, allowPlain, tls, timeout })`: any SMTP server.

### memoryTransport

`memoryTransport()`: keeps the messages in `.sent`.

### createTracker

`createTracker({ secret, base, prefix? })` → `Tracker`: `token`, `read`, `click`, `isClick`, `pixel`, `unsubscribe`.

### createMailHandler

`createMailHandler({ tracker, onEvent, resendSecret, sender, accent, locale, fallback })` → `(request) => Promise<Response>`. [The routes](/docs/tracking/#the-routes).

### nodeHandler

`nodeHandler(handle)`: the handler as a listener of `node:http`.

### verifySvix

`verifySvix(secret, headers, body)`: whether a webhook was signed by Svix with the secret.

### toMime

`toMime(message)`: a message as MIME, what SMTP sends: `multipart/alternative`, its subject in RFC 2047 words.
