# Bloques propios

Rebomail no sabe nada de lo que vende tu aplicación. Un producto, una propiedad, la firma de quien envía el correo: cada uno es un bloque **custom**, un tipo y sus datos guardados con el correo, y dibujado con lo que tu aplicación le da al editor y al motor.

## En el correo {#in-the-email}

Un bloque propio se guarda como `{ type: 'custom', kind, data }`, sus datos cualquier JSON. El motor lo dibuja con un `CustomBlock`: su HTML, su texto, y si tiene lo que necesita.

```ts
import { type CustomBlock, renderEmail } from '@rebomail/core';

const product: CustomBlock = {
  html: (block, ctx) =>
    `<p style="margin:0 0 8px;font-weight:bold;color:${ctx.inks.strong}">${ctx.fill(String(block.data.name))}</p>` +
    ctx.button('Comprar', String(block.data.url)),
  text: (block) => `${block.data.name}: ${block.data.url}`,
  complete: (block) => !!block.data.name && !!block.data.url,
};

renderEmail(email, { custom: { product } });
```

El `ctx` que recibe es con lo que se dibujan los bloques incluidos:

| Campo | Qué es |
| --- | --- |
| `width` | Qué tan ancho puede ser, en pixeles: el del correo, el de una sección o el de una columna. |
| `theme` · `inks` | Los colores del correo, y las tintas de sus palabras (`text`, `strong`, `soft`, `faint`). |
| `fill(text)` | El texto con sus variables llenas. |
| `inline(text)` | Lleno, con sus marcas como HTML, escapado. |
| `link(url)` | Una liga como va en el correo: completa, y pasando por lo que cuenta los clics. |
| `absolute(url)` | Una dirección completada sobre la `base`. |
| `button(label, url, color?)` | Un botón como se dibuja el incluido, en tablas que lee Outlook. |

Lo que tiene un bloque sin `complete` siempre basta; uno con él que diga `false` aparece en `problemsOf`.

> Escapa lo que viene de las personas. `ctx.inline` lo hace; un valor puesto en el HTML tal cual, no.

## En el editor {#in-the-editor}

El editor recibe el mismo dibujante, y cómo se ve el bloque y qué pide:

```tsx
import { Editable, type EditorBlock } from '@rebomail/react';

const product: EditorBlock = {
  kind: 'product',
  label: 'Producto',
  group: 'Tienda',
  data: () => ({ name: '', url: '' }),
  render: productRenderer,
  Look: ({ block, update }) => (
    <Editable value={String(block.data.name)} onChange={(name) => update({ ...block.data, name })} placeholder="Nombre" />
  ),
  Fields: ({ block, update }) => (
    <input value={String(block.data.url)} onChange={(e) => update({ ...block.data, url: e.target.value })} />
  ),
};

<MailEditor email={email} blocks={[product]} locale="es" />;
```

| Campo | Qué es |
| --- | --- |
| `kind` | Su nombre en el correo. No lo cambies una vez que haya correos guardados con él. |
| `label` · `group` · `icon` | Cómo lo muestra la paleta; en "Tus bloques" si no tiene grupo. |
| `data()` | Sus datos cuando se pone en el correo. |
| `render` | El `CustomBlock` de arriba: la vista previa y el envío lo dibujan con él. |
| `Look` | Cómo se ve en el correo mientras se escribe; su HTML si no tiene. Recibe `block`, `theme`, `width` y `update`. |
| `Fields` | Lo que se ajusta de él en el panel. |

<demo name="editor" />

El bloque Producto de la demo es uno de estos: su imagen, nombre y precio dibujados en el correo, y ajustados en el panel.

## En el servidor {#on-the-server}

Dale a `sendEmail` y a `prepare` los mismos dibujantes, por tipo, en `custom`. Un bloque cuyo tipo no tiene dibujante se deja fuera del correo, en vez de enviarse roto.
