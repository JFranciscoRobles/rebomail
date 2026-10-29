# Antes de enviarlo

`problemsOf(email)` dice qué le falta a un correo antes de enviarse: cada problema es un código para tu aplicación, y `describeProblem` lo pone en palabras, en inglés o español. El editor los muestra en su panel y `useMail().problems` los da.

```ts
import { describeProblem, problemsOf } from '@rebomail/core';

const problems = problemsOf(email, { variables: ['name', 'company'] });
if (problems.length) throw new Error(problems.map((p) => describeProblem(p, 'es')).join('\n'));
```

<demo name="checks" />

## Los problemas {#the-problems}

| Código | Cuándo | Con |
| --- | --- | --- |
| `no-subject` | El asunto está vacío. | |
| `no-blocks` | No hay nada en el correo. | |
| `incomplete` | A un bloque le falta lo que necesita para mostrar algo: una imagen sin su dirección, un botón sin palabras o sin liga, un encabezado sin palabras. | `block`, `type` |
| `empty-layout` | Una sección, o una columna de una fila, no contiene nada. | `block`, `type`, `column` |
| `bad-link` | Una liga lleva a donde ninguna bandeja sigue: `javascript:`, una palabra que no es una dirección. | `block`, `type`, `url` |
| `unknown-variable` | Se usa una variable que la aplicación no llena. Solo cuando se da `variables`. | `name` |

`block` es el id del bloque, para que el editor, o tu interfaz, lo elija: `select(problem.block)`.

## Opciones {#options}

| Opción | Qué es |
| --- | --- |
| `variables` | Los nombres que llena tu aplicación. Sin ellos, ninguna variable es un problema. |
| `custom` | Los dibujantes de tus bloques propios: un bloque cuyo `complete` diga `false` es `incomplete`. |

## Si un bloque está completo {#whether-a-block-is-complete}

`isComplete(block, custom)` es la revisión de `incomplete` para un bloque: lo que usa el editor para mostrar un bloque al que todavía le falta algo.
