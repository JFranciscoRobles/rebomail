# Headless: tu propia interfaz

El editor está hecho de partes, y las partes de un solo estado. Ponlas en un diseño propio, o déjalas fuera y construye la interfaz sobre los hooks: el estado, los cambios y el historial son los mismos.

## Las partes {#the-parts}

```tsx
import { MailCanvas, MailInspector, MailPalette, MailPreview, MailProvider } from '@rebomail/react';

<MailProvider email={email} onChange={save} locale="es" blocks={[product]}>
  <aside><MailPalette /></aside>
  <main><MailCanvas /></main>
  <aside><MailInspector /></aside>
</MailProvider>
```

| Parte | Qué es |
| --- | --- |
| `MailProvider` | El estado: el correo, el bloque elegido, lo que se arrastra, el historial. Recibe `email`, `onChange`, `locale` y `blocks`. |
| `MailPalette` | Los bloques para arrastrar o poner con un clic. |
| `MailCanvas` | El correo que se escribe. |
| `MailInspector` | El panel del bloque elegido, o del correo. |
| `MailPreview` | El correo como lo genera el motor, en un marco: `device` (`desktop`, `phone`), `options`, `height`. |

## useMail {#usemail}

Dentro de un `MailProvider`, `useMail()` da el correo y todas las formas de cambiarlo.

```tsx
import { useMail } from '@rebomail/react';

function Toolbar() {
  const { undo, redo, canUndo, canRedo, problems, add } = useMail();
  return (
    <>
      <button onClick={undo} disabled={!canUndo}>Deshacer</button>
      <button onClick={redo} disabled={!canRedo}>Rehacer</button>
      <button onClick={() => add('button')}>Agregar un botón</button>
      <span>{problems.length} por corregir</span>
    </>
  );
}
```

| Campo | Qué es |
| --- | --- |
| `email` | El correo como está ahora. |
| `selected`, `select(id)` | El id del bloque elegido; elegir otro, o ninguno. |
| `add(what, at?)` | Un bloque de la paleta, por su id (`'button'`, `'custom:product'`), o un bloque hecho: después del elegido, al final, o en `{ place, index }`. Da su id. |
| `update(id, patch)` | Cambia un bloque. |
| `move(id, place, index)` | Mueve un bloque a una lista: la del correo, la de una sección, la de una columna. |
| `duplicate(id)` · `remove(id)` | Lo que hace la barra de un bloque. |
| `setSubject` · `setPreheader` · `setTheme` | El resto del correo. |
| `undo` · `redo` · `canUndo` · `canRedo` | El historial: doscientos cambios. |
| `problems` | Lo que le falta al correo, como lo dice [problemsOf](/docs/checks/). |
| `palette` | Los bloques de la paleta, los incluidos y los tuyos. |
| `dragged` · `drag` · `canDrop` · `drop` | Arrastrar, para una paleta o un lienzo propios. |

`useSelection()` da el bloque elegido mismo: `{ selected, block, select }`.

## Un lugar en el correo {#a-place-in-the-email}

Una lista de bloques se nombra con un `Place`: `EMAIL` para el correo mismo, `{ parent: id }` para una sección, y `{ parent: id, column: 1 }` para la segunda columna de una fila. `move`, `drop` y `canDrop` reciben uno.

```ts
import { EMAIL } from '@rebomail/core';

move(heading.id, { parent: row.id, column: 1 }, 0); // arriba de la columna derecha
move(heading.id, EMAIL, 0); // arriba del correo
```

## Teclas {#keys}

`handleMailKeys(event, mail)` es lo que `MailEditor` hace con las teclas: deshacer, rehacer, quitar el bloque elegido y soltarlo. Ponlo en tu propia raíz para tener lo mismo.

## Editable {#editable}

`Editable` es el campo donde se escriben las palabras sobre el correo: texto plano con sus marcas, el cursor donde estaba. Úsalo en el `Look` de un bloque propio para escribir sobre él como sobre los demás.

```tsx
<Editable value={String(block.data.name)} onChange={(name) => update({ ...block.data, name })} placeholder="Nombre" />
```
