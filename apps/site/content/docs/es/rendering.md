# HTML para toda bandeja

`renderEmail(email, options)` convierte un correo en lo que recibe una bandeja: su asunto y su preencabezado con las variables llenas, su HTML y su texto plano. Corre donde corre JavaScript: el navegador, Node, Deno, Bun, un Worker.

```ts
import { renderEmail } from '@rebomail/core';

const { subject, preheader, html, text } = renderEmail(email, {
  values: { name: 'Ana' },
  base: 'https://example.com',
  locale: 'es',
  footer: 'Estudio Rebo · Calle Principal 1',
  unsubscribe: 'https://example.com/baja/abc',
});
```

<demo name="render" />

## Opciones {#options}

| Opción | Qué es |
| --- | --- |
| `values` | Los valores de las variables: `{ name: 'Ana' }` para `{name}`. |
| `link` | Por dónde pasa cada liga, para contar sus clics: `(url) => string`. Tal cual, si no se da. |
| `base` | Dónde está una dirección que empieza con `/`: `https://example.com`. |
| `footer` | Palabras debajo del correo, con sus marcas: quién lo envía y por qué llega. |
| `unsubscribe` | Dónde dejar de recibirlos: ligado debajo del pie. |
| `pixel` | La dirección de una imagen que cuenta la apertura cuando se carga. |
| `locale` | `en` o `es`: las palabras que el correo dice por sí mismo ("Ya no quiero recibir estos correos", "Ver el video"). |
| `custom` | Cómo dibujar tus propios bloques, por su tipo. |

`@rebomail/server` da `link`, `pixel` y `unsubscribe` para cada destinatario; ve [Aperturas, clics y bajas](/docs/tracking/).

## Cómo es el HTML {#what-the-html-is}

Las bandejas no son navegadores. Outlook dibuja con Word; Gmail quita cualquier `<style>` que no le guste; ninguna corre un script. Así que el HTML se escribe como se escriben los correos desde hace veinte años:

- **Tablas**, no `div`s con `flex`: la tarjeta, cada sección, cada fila de columnas, cada botón.
- **Un estilo en cada elemento**, no una hoja de estilos. El único `<style>` que queda solo apila las columnas en el celular, y una bandeja que lo quita las muestra lado a lado, igual de legibles.
- **600 pixeles** de ancho de entrada (`theme.width`, de 320 a 800), centrado, la tarjeta sobre su fondo.
- **Columnas que se apilan** por debajo del ancho del correo, cada una tan ancha como el celular.
- **Botones en tablas propias**, el color en la celda, para que Outlook no los estire.
- **El preencabezado oculto** arriba, para que las bandejas lo muestren después del asunto y el correo no.
- **Direcciones completas**: `/noticias` se vuelve `https://example.com/noticias` sobre la `base`.

## Texto plano {#plain-text}

`text` es el mismo correo sin HTML, para las bandejas y las personas que solo leen eso: encabezados en mayúsculas, ligas escritas después de sus palabras, un botón como sus palabras y su dirección, columnas una tras otra. Se envía junto al HTML, en el mismo mensaje.

## Tu propio HTML {#your-own-html}

El bloque `html` recibe HTML escrito a mano. `cleanHtml` quita lo que puede hacer daño antes de que entre al correo: `<script>`, `<iframe>`, `<object>`, `<embed>`, formularios, manejadores `on…`, direcciones `javascript:`. Sus ligas pasan por `link` como las demás, y sus variables se llenan.

## Un bloque {#one-block}

`blockHtml(block, ctx)` y `blockText(block, ctx)` dibujan un solo bloque, con un contexto hecho por `contextOf(email, options)`: lo que usa la vista previa de un bloque, o un dibujante propio.
