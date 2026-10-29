# Paquetes

Tres paquetes, cada uno apoyado en el de abajo y en nada más. Toma solo los que necesitas: una aplicación que genera correos en código y los envía por un servicio propio solo necesita el motor.

| Paquete | Qué contiene | Depende de |
| --- | --- | --- |
| `@rebomail/core` | El motor: el correo y sus bloques, el árbol, la revisión, el HTML y el texto. Sin DOM. | nada |
| `@rebomail/react` | El editor: completo como un componente, sus partes, los hooks, los estilos. | core, React 19 |
| `@rebomail/server` | Envío y seguimiento: preparar, transportes, el rastreador y su manejador. Node 22. | core |

## @rebomail/core {#core}

```ts
import { renderEmail, problemsOf, readEmail, sampleEmail } from '@rebomail/core';
```

Corre en el navegador, Node, Deno, Bun y Workers. Todo en él son funciones de objetos simples: un correo es JSON, y cada cambio da uno nuevo. [Bloques y diseños](/docs/blocks/), [HTML para toda bandeja](/docs/rendering/) y [Antes de enviarlo](/docs/checks/) dicen qué hace.

## @rebomail/react {#react}

```ts
import '@rebomail/react/styles.css';
import { MailEditor, MailProvider, useMail } from '@rebomail/react';
```

| Entrada | Qué es |
| --- | --- |
| `@rebomail/react` | Los componentes y los hooks; además `blankEmail`, `readEmail`, `renderEmail` y `sampleEmail` de core, para que una página solo necesite este. |
| `@rebomail/react/styles.css` | Los estilos del editor, bajo `.rm-editor`. |

[El editor](/docs/editor/), [Headless](/docs/headless/), [Bloques propios](/docs/custom-blocks/) y [Estilos](/docs/styling/) dicen cómo se usa.

## @rebomail/server {#server}

```ts
import { createMailHandler, createTracker, sendEmail, resendTransport, smtpTransport } from '@rebomail/server';
```

Para un servidor: usa `node:crypto`, y `node:net` y `node:tls` para SMTP. El manejador va de un `Request` a un `Response`, y corre donde existan. [Enviar](/docs/sending/) y [Aperturas, clics y bajas](/docs/tracking/) dicen cómo.

## Cómo están hechos {#how-they-are-made}

Los paquetes son fuentes de TypeScript, exportadas tal cual, sin compilar: Next.js, Vite y Vitest las compilan. Cada uno se prueba con Vitest; el editor en un DOM hecho por happy-dom, el cliente SMTP contra un servidor escuchando en un socket real.
