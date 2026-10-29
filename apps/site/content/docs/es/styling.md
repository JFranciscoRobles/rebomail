# Estilos

`@rebomail/react/styles.css` dibuja el editor. Todo en él está bajo `.rm-editor`, sus clases empiezan con `rm-`, y sus colores son variables de CSS, así que una página le da los suyos sin tocar lo demás.

```ts
import '@rebomail/react/styles.css';
```

## Colores {#colours}

| Variable | Qué colorea |
| --- | --- |
| `--rm-bg` | Alrededor del correo. |
| `--rm-surface` | La paleta, el panel, las barras. |
| `--rm-line` | Líneas y bordes. |
| `--rm-text` · `--rm-muted` | Las palabras, y las más discretas. |
| `--rm-hover` | Lo que está bajo el puntero. |
| `--rm-brand` · `--rm-brand-light` | Lo elegido, dónde cae un bloque, los botones del editor. |

```css
.rm-editor {
  --rm-brand: #0d9488;
  --rm-brand-light: #e6f6f4;
}
```

## Claro y oscuro {#light-and-dark}

El editor es oscuro cuando la página lo es (`prefers-color-scheme: dark`), salvo que `<html data-theme="light">` diga otra cosa; `data-theme="dark"` lo hace oscuro siempre. El correo dentro de él siempre es claro, como lo muestran las bandejas: sus colores son los del tema del correo, no los de la página.

## Tamaño {#size}

El editor llena lo que se le da. Dale una altura a su contenedor (`height: 100vh`, o una fila de un grid) y la paleta, el correo y el panel se desplazan cada uno por su cuenta.

## El aspecto del correo {#the-look-of-the-email}

Cómo se ve el correo no es CSS sino su `theme`: el acento, el fondo, la tarjeta, la tinta, la fuente, el ancho, las esquinas, y el nombre y el logo de arriba. El panel los ajusta cuando no hay bloque elegido; en código:

```ts
import { blankEmail } from '@rebomail/core';

const email = blankEmail({ accent: '#0d9488', name: 'Estudio Rebo', logo: 'https://example.com/logo.png', radius: 12 });
```

Las fuentes son las que tiene toda computadora (`Arial`, `Georgia`, `Verdana`…): las bandejas no cargan ninguna.
