# Enviar

`@rebomail/server` prepara un correo para cada uno de sus destinatarios y le da los mensajes a un transporte: Resend, un servidor SMTP, o la memoria para probarlo todo sin enviar. No guarda nada: quiénes son los destinatarios, y qué pasó con cada uno, lo guarda tu aplicación.

```ts
import { createTracker, resendTransport, sendEmail } from '@rebomail/server';

const tracker = createTracker({ secret: process.env.MAIL_SECRET!, base: 'https://example.com' });

const deliveries = await sendEmail(email, recipients, {
  from: 'Estudio Rebo <noticias@example.com>',
  replyTo: 'hola@example.com',
  transport: resendTransport({ apiKey: process.env.RESEND_KEY! }),
  tracker,
  locale: 'es',
  footer: 'Estudio Rebo · Calle Principal 1',
  onProgress: (done, of) => console.log(`${done}/${of}`),
});
// [{ recipient: 'contact:42', to: 'ana@example.com', id: 're_…' }, …]
```

## Destinatarios {#recipients}

| Campo | Qué es |
| --- | --- |
| `id` | Tuyo: lo que los eventos de este mensaje dirán que era. `contact:42`, el id de una fila. |
| `to` | La dirección. |
| `values` | Las variables de este: `{ name: 'Ana' }`. |
| `replyTo` | A dónde van las respuestas, solo para este. |

A quién se le puede escribir lo dice tu aplicación: da solo a ellos, sin los que se dieron de baja.

## Opciones {#options}

| Opción | Qué es |
| --- | --- |
| `from` | `Nombre <dirección>`, de un dominio desde el que tu proveedor te deje enviar. |
| `transport` | A dónde van los mensajes: abajo. |
| `tracker` | Cuenta aperturas y clics, y pone la forma de darse de baja. Sin él: ninguna de las dos. |
| `track` | `{ opens: false }`, `{ clicks: false }`: contar menos. |
| `footer` · `base` · `locale` · `custom` | Como los recibe [renderEmail](/docs/rendering/). |
| `headers` · `tags` | En cada mensaje. |
| `batch` | Cuántos mensajes van al transporte a la vez: cien. |
| `onProgress` | Se le avisa después de cada lote. |

Cada entrega dice el `id` del destinatario, la dirección, y el `id` del mensaje en el proveedor (para reconocerlo en sus eventos) o el `error` que impidió que saliera. Uno que falla no detiene a los demás.

## Un mensaje {#one-message}

`prepare(email, recipient, options)` prepara el mensaje de un destinatario sin enviarlo: `{ from, to, replyTo, subject, html, text, headers, tags }`. Sus variables van llenas, sus ligas pasan por el rastreador, la imagen que cuenta la apertura va al final, y la forma de darse de baja va en su pie y en sus encabezados (`List-Unsubscribe` y `List-Unsubscribe-Post`, como piden Gmail y Yahoo a quien envía muchos). Ningún valor puede meter un encabezado propio.

## Transportes {#transports}

### resendTransport

```ts
resendTransport({ apiKey: process.env.RESEND_KEY! });
```

[Resend](https://resend.com) por su API HTTP, sin su SDK: cien mensajes por llamada a su envío por lotes, el id del destinatario como etiqueta. Se le puede dar `fetch`, para un entorno propio o una prueba.

### smtpTransport

```ts
smtpTransport({ host: 'smtp.example.com', port: 587, auth: { user, pass } });
```

Cualquier servidor por SMTP, sin más que los sockets de Node: STARTTLS en el 587, TLS desde el inicio en el 465 (`secure`), `PLAIN` o `LOGIN`, una conexión por lote. Una dirección que el servidor rechaza no detiene a las demás. Nada se envía sin cifrar: un servidor sin STARTTLS se rechaza salvo con `allowPlain`, para uno en tu propia máquina.

| Opción | Qué es |
| --- | --- |
| `host` · `port` | El servidor; 587 si no se dice. |
| `secure` | TLS desde el inicio; en el 465 si no se dice. |
| `auth` | `{ user, pass }`. |
| `name` | Cómo se presenta este lado en `EHLO`. |
| `allowPlain` | Si se le puede escribir sin cifrar a un servidor sin STARTTLS. |
| `tls` | Las opciones de TLS de Node: un certificado propio. |
| `timeout` | Cuánto puede tardar una respuesta, en milisegundos. |

### memoryTransport

```ts
const transport = memoryTransport();
await sendEmail(email, recipients, { from, transport });
transport.sent; // los mensajes, con sus ids
```

No sale nada: para pruebas, y para una demo sin llave.

### Uno propio {#your-own}

Un transporte es un objeto con un `name` y `send(messages)`, que da para cada mensaje su dirección y su `id` o su `error`.

```ts
const logged: Transport = {
  name: 'log',
  send: async (messages) => messages.map((m) => (console.log(m.to, m.subject), { to: m.to, id: crypto.randomUUID() })),
};
```
