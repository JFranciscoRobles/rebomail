// The pages of the site, each in the language it is given: the home (what
// Rebomail is, the editor working, what it does, how it is put in an app) and
// the demo (the editor alone). The documentation has a frame of its own.

import type { Metadata } from 'next';
import Link from 'next/link';
import { LiveEditor } from '@/components/LiveEditor';
import { SiteFooter, SiteHeader } from '@/components/Chrome';
import { type L, type Locale, localize, translator } from '@/lib/i18n';
import { VERSION, hrefOf } from '@/lib/site';

const primary = 'inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-dark';
const secondary = 'inline-flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 font-semibold text-ink transition-colors hover:bg-hover';

// ——— Home ———

const HOME: { title: L; description: L } = {
  title: { en: 'Rebomail: emails you build into your app', es: 'Rebomail: correos que integras en tu aplicación' },
  description: {
    en: 'An email editor where the email is written on itself, an engine that makes the HTML every inbox reads, and sending with Resend or SMTP — in packages you take one at a time.',
    es: 'Un editor donde el correo se escribe sobre sí mismo, un motor que genera el HTML que leen todas las bandejas, y el envío con Resend o SMTP, en paquetes que tomas uno a uno.',
  },
};

export const homeMetadata = (locale: Locale): Metadata => ({ title: { absolute: translator(locale)(HOME.title) }, description: translator(locale)(HOME.description) });

const FEATURES: { title: L; text: L; color: string }[] = [
  {
    title: { en: 'Written on the email itself', es: 'Se escribe sobre el correo' },
    text: {
      en: 'Click a block and type where the words show. ⌘B, ⌘I and ⌘K for bold, italic and links. What is not words — links, pictures, colours — goes in the panel beside it.',
      es: 'Das clic en un bloque y escribes donde se ven las palabras. ⌘B, ⌘I y ⌘K para negritas, cursivas y ligas. Lo que no son palabras (ligas, imágenes, colores) va en el panel de al lado.',
    },
    color: 'bg-pastel-blue text-pastel-blue-fg',
  },
  {
    title: { en: 'Sections and columns', es: 'Secciones y columnas' },
    text: {
      en: 'Drag blocks into a section with a background, or into two or three columns that stack on a phone. A line shows where each one falls.',
      es: 'Arrastra bloques a una sección con fondo, o a dos o tres columnas que se apilan en el celular. Una línea marca dónde cae cada uno.',
    },
    color: 'bg-pastel-green text-pastel-green-fg',
  },
  {
    title: { en: 'Blocks of your own', es: 'Bloques propios' },
    text: {
      en: 'A product, a property, the signature of whoever sends it: register a block with how it looks, what it asks and its HTML. Rebomail knows nothing of what you sell.',
      es: 'Un producto, una propiedad, la firma de quien lo envía: registras un bloque con cómo se ve, qué pide y su HTML. Rebomail no sabe nada de lo que vendes.',
    },
    color: 'bg-pastel-purple text-pastel-purple-fg',
  },
  {
    title: { en: 'Every inbox reads it', es: 'Lo lee cualquier bandeja' },
    text: {
      en: 'Tables, a style on each element, 600 pixels, columns that stack, plain text beside it. HTML of your own is cleaned of scripts, frames and forms.',
      es: 'Tablas, estilo en cada elemento, 600 pixeles, columnas que se apilan y el texto plano al lado. Tu propio HTML se limpia de scripts, iframes y formularios.',
    },
    color: 'bg-pastel-orange text-pastel-orange-fg',
  },
  {
    title: { en: 'Sent and followed', es: 'Se envía y se sigue' },
    text: {
      en: 'Resend or any SMTP server. Opens and clicks counted through signed links, unsubscribing in one click, Resend’s events taken only as signed.',
      es: 'Resend o cualquier servidor SMTP. Aperturas y clics contados con ligas firmadas, baja en un clic, y los eventos de Resend solo si vienen firmados.',
    },
    color: 'bg-pastel-pink text-pastel-pink-fg',
  },
  {
    title: { en: 'Yours, piece by piece', es: 'Tuyo, pieza por pieza' },
    text: {
      en: 'The whole editor as one component, or its parts and hooks for an interface of your own. English and Spanish, light and dark, MIT, no dependencies but React.',
      es: 'El editor completo como un componente, o sus partes y hooks para una interfaz propia. Inglés y español, claro y oscuro, MIT, sin dependencias además de React.',
    },
    color: 'bg-pastel-yellow text-pastel-yellow-fg',
  },
];

const CODE: { title: string; page: string; code: string }[] = [
  {
    title: '@rebomail/react',
    page: 'editor',
    code: `import '@rebomail/react/styles.css';
import { MailEditor, sampleEmail } from '@rebomail/react';

<MailEditor email={sampleEmail('en')} onChange={save} />`,
  },
  {
    title: '@rebomail/core',
    page: 'rendering',
    code: `import { renderEmail } from '@rebomail/core';

const { subject, html, text } = renderEmail(email, {
  values: { name: 'Ana' },
  unsubscribe: 'https://example.com/unsubscribe/abc',
});`,
  },
  {
    title: '@rebomail/server',
    page: 'sending',
    code: `import { createTracker, resendTransport, sendEmail } from '@rebomail/server';

const tracker = createTracker({ secret, base: 'https://example.com' });
await sendEmail(email, recipients, {
  from: 'Rebo <news@example.com>',
  transport: resendTransport({ apiKey }),
  tracker,
});`,
  },
];

export function HomePage({ locale }: { locale: Locale }) {
  const t = translator(locale);
  return (
    <>
      <SiteHeader locale={locale} path="/" />
      <main>
        <section className="mx-auto max-w-[920px] px-6 pb-12 pt-20 text-center">
          <span className="rounded-full bg-brand-light px-3 py-1 text-[13px] font-semibold text-brand-dark">
            v{VERSION} · {t({ en: 'the email of the Rebo suite', es: 'el correo de la suite Rebo' })}
          </span>
          <h1 className="mt-6 font-display text-[clamp(38px,6vw,68px)] font-extrabold leading-[1.04] tracking-[-0.035em]">
            {t({ en: 'Emails you build into your app.', es: 'Correos que integras en tu aplicación.' })}
          </h1>
          <p className="mx-auto mt-5 max-w-[640px] text-[clamp(17px,2vw,20px)] leading-relaxed text-ink-soft">{t(HOME.description)}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#try" className={primary}>
              {t({ en: 'Try it here', es: 'Pruébalo aquí' })}
            </a>
            <Link href={localize('/docs/', locale)} className={secondary}>
              {t({ en: 'Read the docs', es: 'Leer la documentación' })}
            </Link>
          </div>
        </section>

        <section id="try" className="mx-auto max-w-[1280px] scroll-mt-20 px-4">
          <div className="rounded-[28px] border border-line bg-surface p-[clamp(10px,2vw,22px)] shadow-editor">
            <LiveEditor locale={locale} />
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            {t({
              en: 'This is the editor, working. Drag a block from the left, click one to write in it, switch to Desktop or Phone to see the HTML inboxes get.',
              es: 'Este es el editor, funcionando. Arrastra un bloque de la izquierda, da clic en uno para escribir, cambia a Computadora o Celular para ver el HTML que reciben las bandejas.',
            })}
          </p>
        </section>

        <section className="mx-auto mt-24 max-w-[1180px] px-6">
          <h2 className="text-center font-display text-[clamp(30px,4vw,44px)] font-extrabold tracking-[-0.03em]">{t({ en: 'What it does', es: 'Qué hace' })}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title.en} className="rounded-2xl border border-line p-6">
                <span className={`inline-block rounded-full px-3 py-1 text-[13px] font-semibold ${f.color}`}>{t(f.title)}</span>
                <p className="mt-4 leading-relaxed text-ink-soft">{t(f.text)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-[1180px] px-6">
          <h2 className="text-center font-display text-[clamp(30px,4vw,44px)] font-extrabold tracking-[-0.03em]">{t({ en: 'Three packages, one at a time', es: 'Tres paquetes, uno a la vez' })}</h2>
          <p className="mx-auto mt-3 max-w-[620px] text-center text-ink-soft">
            {t({
              en: 'Take the editor, the engine or the sending alone: each one stands on the one below it, nothing more.',
              es: 'Toma el editor, el motor o el envío por separado: cada uno se apoya en el de abajo y en nada más.',
            })}
          </p>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {CODE.map((c) => (
              <div key={c.title} className="flex flex-col overflow-hidden rounded-2xl border border-line">
                <Link href={localize(hrefOf(c.page), locale)} className="border-b border-line bg-surface px-5 py-3 font-code text-sm font-semibold hover:text-brand-dark">
                  {c.title}
                </Link>
                <pre className="flex-1 overflow-x-auto bg-[#16181d] p-5 font-code text-[13px] leading-relaxed text-[#e7e7ea]">{c.code}</pre>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}

// ——— Demo ———

export const demoMetadata = (locale: Locale): Metadata => ({ title: 'Demo', description: translator(locale)({ en: 'The Rebomail editor, working.', es: 'El editor de Rebomail, funcionando.' }) });

export function DemoPage({ locale }: { locale: Locale }) {
  return (
    <>
      <SiteHeader locale={locale} path="/demo/" />
      <main className="mx-auto max-w-[1400px] px-4 py-6">
        <LiveEditor locale={locale} />
      </main>
    </>
  );
}
