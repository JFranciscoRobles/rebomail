# Primeros pasos

El editor en una página de React, un correo convertido en HTML en Node, y el repositorio corriendo en tu máquina: las tres formas de entrar, cada una en unas líneas.

## Ponlo en una aplicación de React {#put-it-in-a-react-application}

Rebomail todavía no está en npm: toma los paquetes del repositorio (son fuentes de TypeScript, que Next.js y Vite compilan tal cual). En Next.js, ponlos en `transpilePackages`.

```tsx
'use client';

import '@rebomail/react/styles.css';
import { type Email, MailEditor, sampleEmail } from '@rebomail/react';
import { useState } from 'react';

export function Campaign() {
  const [email, setEmail] = useState<Email>(() => sampleEmail('es'));
  return <MailEditor email={email} onChange={setEmail} locale="es" preview={{ values: { name: 'Ana' } }} />;
}
```

El correo es un objeto simple: guárdalo como JSON donde tu aplicación guarde las cosas, y devuélveselo al editor con `readEmail(json)`, que conserva solo lo que tiene cada bloque.

<demo name="editor" />

## Genera el HTML en Node {#make-the-html-in-node}

El motor no usa DOM. El mismo correo que escribió el editor se convierte en el HTML y el texto que recibe una bandeja:

```ts
import { readEmail, renderEmail } from '@rebomail/core';

const email = readEmail(JSON.parse(saved));
const { subject, preheader, html, text } = renderEmail(email, {
  values: { name: 'Ana' },
  locale: 'es',
  footer: 'Estudio Rebo · Calle Principal 1',
  unsubscribe: 'https://example.com/baja/abc',
});
```

## Envíalo {#send-it}

`@rebomail/server` prepara el correo para cada destinatario y se lo da a Resend o a un servidor SMTP:

```ts
import { createTracker, resendTransport, sendEmail } from '@rebomail/server';

const tracker = createTracker({ secret: process.env.MAIL_SECRET!, base: 'https://example.com' });

await sendEmail(email, [{ id: 'contact:42', to: 'ana@example.com', values: { name: 'Ana' } }], {
  from: 'Estudio Rebo <noticias@example.com>',
  transport: resendTransport({ apiKey: process.env.RESEND_KEY! }),
  tracker,
  locale: 'es',
});
```

[Enviar](/docs/sending/) y [Aperturas, clics y bajas](/docs/tracking/) dicen el resto.

## Corre el repositorio {#run-the-repository}

```bash
git clone https://github.com/JFranciscoRobles/rebomail
cd rebomail
npm install
npm run dev
```

El playground abre en `localhost:5300`: el editor con un bloque propio de ejemplo, el correo guardado en el navegador, y botones para copiar su HTML, su texto y su JSON.

## Comandos {#commands}

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | El playground, en `localhost:5300`. |
| `npm run site` | Este sitio, en `localhost:5301`. |
| `npm test` | Las pruebas de todos los paquetes, con Vitest. |
| `npm run typecheck` | Los tipos, en todos los paquetes y aplicaciones. |
| `npm run lint` · `format` | Biome: dice qué está mal, o lo escribe bien. |
| `npm run coverage` | Las pruebas, con qué parte de los paquetes alcanzan. |
| `npm run build` · `build:site` | El playground y este sitio, como archivos estáticos. |
