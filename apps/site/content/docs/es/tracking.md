# Aperturas, clics y bajas

Un rastreador firma las ligas de cada destinatario; un manejador las contesta. Entre los dos, cada apertura, cada clic y cada persona que se da de baja se le avisa a tu aplicación, con el `id` del destinatario con el que se envió. Los eventos propios de Resend (entregado, rebotado, marcado como spam) llegan por el mismo manejador.

```ts
import { createMailHandler, createTracker } from '@rebomail/server';

export const tracker = createTracker({ secret: process.env.MAIL_SECRET!, base: 'https://example.com' });

export const handle = createMailHandler({
  tracker,
  resendSecret: process.env.RESEND_WEBHOOK_SECRET, // whsec_…
  sender: 'Estudio Rebo',
  locale: 'es',
  onEvent: async (event) => {
    // { type: 'opened' | 'clicked' | 'unsubscribed' | 'delivered' | 'bounced' | …, recipient?, providerId?, url?, at, via }
    await db.mailEvents.create({ data: event });
  },
});
```

## El rastreador {#the-tracker}

| Opción | Qué es |
| --- | --- |
| `secret` | Largo, aleatorio, el mismo en cada proceso: con lo que se firman las direcciones. Dieciséis caracteres por lo menos. |
| `base` | Dónde se ve el servidor desde fuera: `https://example.com`. |
| `prefix` | La ruta bajo la que están sus rutas: `/mail`. |

Cada token es el id del destinatario y una marca hecha con el secreto: no se puede inventar ni cambiar de quién es una dirección, y una liga no puede llevar a ningún lado al que no se envió.

## Las rutas {#the-routes}

| Ruta | Qué hace |
| --- | --- |
| `GET /mail/o/:token.gif` | La imagen que cuenta una apertura: `opened`. |
| `GET /mail/c/:token?u=…&s=…` | Una liga que cuenta su clic en el camino: `clicked`, y luego a donde va. Solo una liga hecha aquí, tal como se hizo: nunca una redirección abierta. |
| `GET /mail/u/:token` | La página que pregunta si dejar de recibir los correos, en inglés o español, en el `accent`. |
| `POST /mail/u/:token` | Dado de baja: `unsubscribed`. El botón propio de la bandeja (`List-Unsubscribe=One-Click`) también llega aquí. |
| `POST /mail/webhooks/resend` | Los eventos de Resend, solo si Svix los firmó con `resendSecret`. |

## Dónde poner el manejador {#putting-the-handler-somewhere}

`createMailHandler` recibe un `Request` y da un `Response`, así que es un route handler de Next.js, un servidor de Bun o Deno, o un Worker, tal cual.

```ts
// app/mail/[...path]/route.ts, en Next.js
import { handle } from '@/lib/mail';

export const GET = handle;
export const POST = handle;
```

En Node, `nodeHandler` lo convierte en un listener de `node:http`:

```ts
import { createServer } from 'node:http';
import { nodeHandler } from '@rebomail/server';

createServer(nodeHandler(handle)).listen(3000);
```

## Eventos {#events}

| Campo | Qué es |
| --- | --- |
| `type` | `opened`, `clicked`, `unsubscribed` desde las ligas; `delivered`, `opened`, `clicked`, `bounced`, `complained`, `delayed` desde Resend. |
| `recipient` | Tu id, desde las ligas del propio correo. |
| `providerId` | El id del mensaje en el proveedor, desde sus eventos: el `id` de la entrega. |
| `url` | La liga en la que dieron clic. |
| `at` · `via` | Cuándo, y si fue por una liga (`link`) o un `webhook`. |

A una dirección que rebotó o marcó como spam no se le debe volver a escribir: guárdala, y déjala fuera de los siguientes destinatarios.

## El webhook de Resend {#the-webhook-of-resend}

En Resend, agrega un webhook a `https://example.com/mail/webhooks/resend` y da su secreto de firma como `resendSecret`. Sin él la ruta no contesta nada. `verifySvix(secret, headers, body)` es la revisión, para una ruta propia.

## Contar menos {#counting-less}

Las aperturas se cuentan con una imagen, que algunas bandejas cargan solas y otras nunca: un número para comparar, no un hecho. `track: { opens: false }` deja fuera la imagen; `track: { clicks: false }` deja las ligas como están. Sin rastreador no se cuenta nada, ni se pone la forma de darse de baja: pon tu propio `unsubscribe`.
