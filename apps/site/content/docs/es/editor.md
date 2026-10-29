# El editor

`MailEditor` es el editor completo en un componente: la paleta de bloques, el correo que se escribe, el panel de al lado y la vista previa. Recibe el correo y lo devuelve cada vez que cambia.

```tsx
import '@rebomail/react/styles.css';
import { MailEditor } from '@rebomail/react';

<MailEditor email={email} onChange={save} locale="es" blocks={[product]} preview={{ values: { name: 'Ana' } }} />
```

<demo name="editor" />

## Props {#props}

| Prop | Tipo | Qué es |
| --- | --- | --- |
| `email` | `Email` | El correo a escribir. Si después le das otro, empieza de nuevo, también su historial; el que el editor devolvió no cuenta. |
| `onChange` | `(email: Email) => void` | Se le avisa de cada cambio. |
| `locale` | `'en' \| 'es'` | El idioma del editor y del correo que genera. Inglés si no se dice. |
| `blocks` | `EditorBlock[]` | Los bloques propios de tu aplicación: ve [Bloques propios](/docs/custom-blocks/). |
| `preview` | `RenderOptions` | Con qué se genera la vista previa: `values` para las variables, `footer`, `unsubscribe`, `base`. |
| `className` | `string` | Se pone en su raíz, junto a `rm-editor`. |

## Qué está dónde {#what-is-where}

- **La paleta**, a la izquierda: todos los bloques, por para qué sirven (palabras, imágenes, diseño, los tuyos). Se arrastran al correo, o se ponen con un clic después del bloque elegido.
- **El correo**, al centro, como se verá: su asunto y su preencabezado arriba como los lista una bandeja, y cada bloque escrito donde se ven sus palabras.
- **El panel**, a la derecha: del bloque elegido, lo que no se escribe sobre el correo (una liga, una imagen, un color, un tono, el ancho de las columnas). Sin bloque elegido, los colores del correo, su nombre, su logo y su ancho, y lo que le falta antes de enviarlo.
- **La vista previa**: el correo como lo genera el motor, en computadora o celular, a un clic.

## Escribir sobre el correo {#writing-on-the-email}

Da clic en un bloque para elegirlo, y escribe. Una línea en blanco entre párrafos; en una lista, un elemento por línea.

| Teclas | Qué hacen |
| --- | --- |
| `⌘B` · `⌘I` | Negritas y cursivas en las palabras elegidas: `**negritas**`, `*cursivas*`. |
| `⌘K` | Una liga en las palabras elegidas: `[palabras](https://…)`. |
| `⌘Z` · `⇧⌘Z` (`⌘Y`) | Deshacer y rehacer. Lo que se escribe en un campo con poco tiempo de diferencia es un solo cambio. |
| `Supr` | Quita el bloque elegido, cuando no se están escribiendo palabras. |
| `Esc` | Suelta el bloque. |

Las variables se escriben entre llaves, `{name}`, y se llenan al generar el correo.

## Arrastrar {#dragging}

Cada bloque tiene una agarradera a su izquierda. Arrástralo a donde sea: entre dos bloques, a una sección, a una columna, fuera de ellas. Una línea marca dónde cae, y donde no puede ir (una sección dentro de otra, columnas dentro de una columna) no aparece. La barra del bloque elegido lo sube, lo baja, lo duplica y lo quita sin arrastrar.

## Guardar {#saving}

`onChange` da el correo completo cada vez; guárdalo como JSON. Cuando regresa de donde se guardó, `readEmail` lo toma sin nada que el editor no conozca:

```ts
import { readEmail } from '@rebomail/core';

const email = readEmail(await (await fetch('/api/campaigns/7')).json());
```
