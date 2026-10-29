# Bloques y diseños

Un `Email` es un `subject`, un `preheader` (la línea que algunas bandejas muestran después del asunto), un `theme` y sus `blocks`, uno debajo de otro. Algunos bloques contienen otros: una **sección** y las **columnas** de una fila.

```ts
interface Email {
  subject: string;
  preheader: string;
  theme: Theme;
  blocks: Block[];
}
```

## Bloques {#blocks}

| Bloque | Qué es |
| --- | --- |
| `heading` · `text` | Palabras. Una línea en blanco entre párrafos; `**negritas**`, `*cursivas*`, `[una liga](https://…)`. |
| `button` | Palabras y a dónde llevan, en el acento o un color propio. |
| `image` | Una imagen, con liga o sin ella, con sus palabras para quien no puede verla. |
| `hero` | Una portada: una imagen grande, un título, palabras y un botón. |
| `callout` | Palabras en un recuadro de un tono: `accent`, `green`, `amber`, `gray`. |
| `quote` | Palabras que alguien dijo, y quién. |
| `list` | Un elemento por línea, numerados o no. |
| `markdown` | Encabezados, listas, citas y separadores, escritos en Markdown. |
| `video` | Una imagen del video y la liga a él: ninguna bandeja reproduce videos. |
| `social` | Ligas a las redes: Facebook, Instagram, TikTok, YouTube, LinkedIn, X, un sitio web. |
| `menu` | Ligas en una fila, como arriba de un sitio: hasta ocho, cada una con sus palabras y a dónde lleva. |
| `coupon` | Un código en un recuadro punteado, lo que da arriba y hasta cuándo abajo. |
| `table` | Renglones de qué es algo y su valor, como un pedido o los datos de una cita; el último puede ser un total (`total`). |
| `rating` | Una pregunta y cinco estrellas, cada una una liga: `{score}` en su dirección es el número de la estrella, así `https://example.com/encuesta?score={score}` te dice cuántas. Cada clic se cuenta como cualquier otro. |
| `gallery` | Dos o tres imágenes en una fila, con liga o sin ella; una debajo de otra en el celular. |
| `divider` · `spacer` | Una línea; espacio (`sm`, `md`, `lg`). |
| `html` | HTML escrito a mano, limpio de lo que puede hacer daño. |
| `custom` | Uno propio de tu aplicación: ve [Bloques propios](/docs/custom-blocks/). |

## Diseños {#layouts}

| Diseño | Qué contiene |
| --- | --- |
| `section` | Un recuadro con fondo (`gray`, `accent`, `dark`, o solo su borde, `outline`) que contiene cualquier bloque menos una sección. |
| `columns` | Dos o tres columnas (`1-1`, `1-2`, `2-1`, `1-1-1`), cada una con cualquier bloque menos un diseño: en un celular no cabe más. Una debajo de otra en el celular. |

```ts
import { makeBlock } from '@rebomail/core';

const row = makeBlock('columns'); // { type: 'columns', widths: '1-1', columns: [[], []] }
row.columns[0].push({ ...makeBlock('image'), src: 'https://example.com/silla.jpg' });
row.columns[1].push({ ...makeBlock('text'), text: '**Silla lounge**\n\n$249' });
```

`allowed(inside, type)` dice si un bloque puede ir en un lugar: `allowed('columns', 'section')` es `false`.

## Cambiar el árbol {#changing-the-tree}

Cada función da listas nuevas, y los bloques que no tocó son los mismos objetos que antes, así que un cambio se encuentra comparándolos.

```ts
import { EMAIL, insertBlock, moveBlock, removeBlock, updateBlock } from '@rebomail/core';

let blocks = insertBlock(email.blocks, EMAIL, 0, row);
blocks = moveBlock(blocks, heading.id, { parent: row.id, column: 1 }, 0); // a la columna derecha
blocks = updateBlock(blocks, heading.id, { text: 'Hola {name}' });
blocks = removeBlock(blocks, spacer.id);
```

`moveBlock` toma el índice como está la lista antes de que el bloque salga, así que un bloque soltado entre dos cae ahí. `mayPut(blocks, block, place)` dice si puede ir; un movimiento que no puede no cambia nada.

## Variables {#variables}

Las palabras entre llaves son variables: `{name}`, `{company}`. `renderEmail` las llena con sus `values`; una que no se da se queda como está escrita, y `problemsOf(email, { variables })` la señala. `variablesIn(text)` lista las de un texto.

## Leer lo guardado {#reading-what-was-kept}

Un correo guardado como JSON, o enviado por alguien, puede ser cualquier cosa. `readEmail(given)` lo convierte en un correo: cada bloque solo con lo que tiene su tipo, los diseños dentro de diseños fuera, los colores que no son colores cambiados por los de siempre. `readBlocks` y `readTheme` lo hacen para una parte.
