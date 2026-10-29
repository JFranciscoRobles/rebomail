# API

Cada función, componente y hook que exportan los paquetes, por paquete, cada uno en una línea. Las páginas de la documentación dicen cómo se usan juntos.

## @rebomail/core {#core}

### renderEmail

`renderEmail(email, options?)` → `{ subject, preheader, html, text }`. El correo como lo recibe una bandeja. [Opciones](/docs/rendering/#options).

### blockHtml

`blockHtml(block, ctx, custom?)` and `blockText(block, ctx, custom?)`: un bloque, con un contexto de `contextOf`.

### contextOf

`contextOf(email, options?)` → `RenderContext`: con lo que se dibujan los bloques.

### cleanHtml

`cleanHtml(html, ctx)`: HTML escrito a mano, sin scripts, iframes, formularios, manejadores ni `javascript:`.

### problemsOf

`problemsOf(email, { variables?, custom? })` → `Problem[]`. Lo que le falta al correo antes de enviarlo. [Los problemas](/docs/checks/#the-problems).

### describeProblem

`describeProblem(problem, locale?)`: un problema en palabras, en inglés o español.

### isComplete

`isComplete(block, custom?)`: si un bloque tiene lo que necesita para mostrar algo.

### makeBlock

`makeBlock(type, custom?)`: un bloque como empieza, con un id nuevo. `makeBlock('custom', { kind, data })` para uno propio.

### blankEmail

`blankEmail(theme?)`: un correo vacío, con el tema dado sobre el de siempre.

### sampleEmail

`sampleEmail(locale?)`: un correo con cada tipo de bloque, para empezar.

### readEmail

`readEmail(given)`, `readBlocks(given)`, `readTheme(given)`: lo guardado o enviado, convertido en correo, con solo lo que tiene cada tipo.

### allowed

`allowed(inside, type)`: si un bloque de `type` puede ir en el correo, una sección o una columna.

### insertBlock

`insertBlock(blocks, place, index, block)`: el bloque puesto en `index` de la lista en `place`.

### moveBlock

`moveBlock(blocks, id, place, index)`: el bloque movido, `index` contado antes de que salga. Nada cambia si no puede ir ahí.

### updateBlock

`updateBlock(blocks, id, patch)`: el bloque cambiado.

### removeBlock

`removeBlock(blocks, id)`: el bloque quitado, donde sea que esté.

### duplicateBlock

`duplicateBlock(blocks, id)` → `{ blocks, copy }`: una copia después de él, con ids nuevos; `copyBlock(block)` hace la copia.

### findBlock

`findBlock(blocks, id)`, `whereIs(blocks, id)` (su lugar y su índice), `listAt(blocks, place)`, `insideOf(blocks, place)`, `walk(blocks)` (cada bloque, en orden), `contains(block, id)`, `mayPut(blocks, block, place)`, `editList(blocks, place, change)`.

### EMAIL

`EMAIL` (`{ parent: null }`): el lugar de la lista del propio correo. `samePlace(a, b)` compara dos lugares.

### fill

`fill(text, values)`, `variablesIn(text)`, `inlineHtml(text, link, accent)`, `inlineText(text, link?)`, `escapeHtml(text)`, `safeUrl(url)`.

### Tipos {#types}

`Email`, `Theme`, `Block`, `BlockOf<T>`, `BlockType`, `Place`, `Problem`, `RenderOptions`, `RenderContext`, `CustomBlock`, `Locale`; y las listas `BLOCK_TYPES`, `TONES`, `LOOKS`, `WIDTHS`, `SIZES`, `NETWORKS`, `DEFAULT_THEME`.

## @rebomail/react {#react}

### MailEditor

`<MailEditor email onChange locale blocks preview className />`: el editor completo. [Props](/docs/editor/#props).

### MailProvider

`<MailProvider email onChange locale blocks>`: el estado que comparten las partes.

### MailPalette

`<MailPalette />`, `<MailCanvas />`, `<MailInspector />`: las partes, dentro de un provider.

### MailPreview

`<MailPreview device options height />`: el correo como lo genera el motor, en un marco.

### useMail

`useMail()` → `MailState`: el correo y todas las formas de cambiarlo. [Sus campos](/docs/headless/#usemail).

### useSelection

`useSelection()` → `{ selected, block, select }`.

### Editable

`<Editable value onChange placeholder multiline marks />`: el campo donde se escriben las palabras sobre el correo.

### handleMailKeys

`handleMailKeys(event, mail)`: las teclas del editor, para una raíz propia.

### toggleMark

`toggleMark({ text, start, end }, mark)` and `addLink({ text, start, end }, placeholder?)` → el texto y la selección después: negritas, cursivas y ligas sobre texto plano.

### EditorBlock

`EditorBlock`: uno de tus bloques, como lo recibe el editor. [Sus campos](/docs/custom-blocks/#in-the-editor).

### WORDS

`WORDS`: lo que dice el editor, en inglés y español. `Icon`, los iconos que dibuja.

## @rebomail/server {#server}

### sendEmail

`sendEmail(email, recipients, options)` → `Delivery[]`. [Opciones](/docs/sending/#options).

### prepare

`prepare(email, recipient, options)` → `Message`: el de un destinatario, sin enviar.

### resendTransport

`resendTransport({ apiKey, fetch? })`: Resend, cien por llamada.

### smtpTransport

`smtpTransport({ host, port, secure, auth, name, allowPlain, tls, timeout })`: cualquier servidor SMTP.

### memoryTransport

`memoryTransport()`: guarda los mensajes en `.sent`.

### createTracker

`createTracker({ secret, base, prefix? })` → `Tracker`: `token`, `read`, `click`, `isClick`, `pixel`, `unsubscribe`.

### createMailHandler

`createMailHandler({ tracker, onEvent, resendSecret, sender, accent, locale, fallback })` → `(request) => Promise<Response>`. [Las rutas](/docs/tracking/#the-routes).

### nodeHandler

`nodeHandler(handle)`: el manejador como listener de `node:http`.

### verifySvix

`verifySvix(secret, headers, body)`: si Svix firmó un webhook con el secreto.

### toMime

`toMime(message)`: un mensaje como MIME, lo que envía SMTP: `multipart/alternative`, su asunto en palabras RFC 2047.
