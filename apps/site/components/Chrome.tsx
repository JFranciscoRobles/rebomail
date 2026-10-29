// What every page has: the document in its language, the header (the name,
// the documentation, the demo, the code, the other language) and the footer.

import type { Metadata, Viewport } from 'next';
import { Caveat, Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { type L, type Locale, localize, translator } from '@/lib/i18n';
import { REPO, SITE } from '@/lib/site';

// The fonts of the suite, as CSS variables: `globals.css` makes them
// `font-display`, `font-text`, `font-code` and `font-hand`.
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-jakarta' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains' });
const caveat = Caveat({ subsets: ['latin'], weight: '600', variable: '--font-caveat' });

export const viewport: Viewport = { themeColor: '#0d9488', width: 'device-width', initialScale: 1 };

const DESCRIPTION: L = {
  en: 'Emails written on themselves, in your app: blocks in sections and columns, the HTML every inbox reads, and sending with Resend or SMTP.',
  es: 'Correos que se escriben sobre sí mismos, dentro de tu aplicación: bloques en secciones y columnas, el HTML que leen todas las bandejas, y el envío con Resend o SMTP.',
};

export function rootMetadata(locale: Locale): Metadata {
  const t = translator(locale);
  return {
    metadataBase: new URL(SITE),
    title: { default: 'Rebomail', template: '%s · Rebomail' },
    description: t(DESCRIPTION),
    alternates: { languages: { en: '/', es: '/es/' } },
    openGraph: { siteName: 'Rebomail', locale: locale === 'es' ? 'es_ES' : 'en_US', type: 'website' },
  };
}

export function RootDocument({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={locale} className={`${jakarta.variable} ${inter.variable} ${jetbrains.variable} ${caveat.variable}`}>
      <body>{children}</body>
    </html>
  );
}

/** The header, its links in the page's language; `path`, the page's address without its language, for the other one. */
export function SiteHeader({ locale, path }: { locale: Locale; path: string }) {
  const t = translator(locale);
  const other: Locale = locale === 'en' ? 'es' : 'en';
  const link = 'rounded-lg px-3 py-1.5 text-[15px] font-semibold text-ink-soft transition-colors hover:bg-hover hover:text-ink';
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-2 px-6">
        <Link href={localize('/', locale)} className="mr-auto flex items-center gap-2.5 font-display text-[19px] font-extrabold tracking-[-0.03em]">
          {/* biome-ignore lint/performance/noImgElement: the logo, a small file of the site. */}
          <img src="/logo.svg" alt="" width={28} height={28} />
          Rebomail
        </Link>
        <Link href={localize('/docs/', locale)} className={link}>
          {t({ en: 'Docs', es: 'Documentación' })}
        </Link>
        <Link href={localize('/demo/', locale)} className={`${link} max-sm:hidden`}>
          Demo
        </Link>
        <a href={REPO} className={`${link} max-sm:hidden`}>
          GitHub
        </a>
        <Link href={localize(path, other)} className={link} hrefLang={other} title={other === 'es' ? 'Español' : 'English'}>
          {other.toUpperCase()}
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = translator(locale);
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-2 px-6 py-8 text-sm text-muted">
        <span className="mr-auto">Rebomail · {t({ en: 'the email of the Rebo suite', es: 'el correo de la suite Rebo' })} · MIT</span>
        <Link href={localize('/docs/', locale)} className="hover:text-ink">
          {t({ en: 'Docs', es: 'Documentación' })}
        </Link>
        <Link href={localize('/demo/', locale)} className="hover:text-ink">
          Demo
        </Link>
        <a href={REPO} className="hover:text-ink">
          GitHub
        </a>
      </div>
    </footer>
  );
}
