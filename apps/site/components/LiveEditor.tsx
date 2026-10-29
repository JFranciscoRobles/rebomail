'use client';

// The editor, working, on the page: the sample email in the page's language,
// with a block of its own (a product) to show how one is added. Loaded only
// in the browser: it measures and drags, which a server cannot.

import '@rebomail/react/styles.css';
import { sampleEmail } from '@rebomail/core';
import type { CustomLookProps, EditorBlock } from '@rebomail/react';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { Locale } from '@/lib/i18n';

const MailEditor = dynamic(() => import('@rebomail/react').then((m) => m.MailEditor), {
  ssr: false,
  loading: () => <div className="grid h-[640px] place-items-center rounded-2xl border border-line text-muted">…</div>,
});

/** A product, as an application would add one: its name, price and picture on the email, and in the panel to change them. */
const product = (locale: Locale): EditorBlock => ({
  kind: 'product',
  label: locale === 'es' ? 'Producto' : 'Product',
  data: () => ({ name: locale === 'es' ? 'Silla lounge' : 'Lounge chair', price: '$249', src: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800' }),
  render: {
    html: (b, ctx) =>
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px;border:1px solid #e4e4e7;border-radius:12px;border-collapse:separate;"><tr><td>${
        b.data.src ? `<img src="${String(b.data.src)}" width="${ctx.width}" alt="" style="display:block;width:100%;height:auto;border-radius:12px 12px 0 0;">` : ''
      }</td></tr><tr><td style="padding:14px 16px;"><p style="margin:0;font-size:17px;font-weight:bold;color:${ctx.inks.strong};">${String(b.data.name)}</p><p style="margin:4px 0 0;font-size:16px;font-weight:bold;color:${ctx.theme.accent};">${String(b.data.price)}</p></td></tr></table>`,
    text: (b) => `${String(b.data.name)} — ${String(b.data.price)}`,
  },
  Look: ({ block, theme }: CustomLookProps) => (
    <div style={{ margin: '6px 0', border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden' }}>
      {/* biome-ignore lint/performance/noImgElement: the product's picture, from where it is. */}
      {block.data.src ? <img src={String(block.data.src)} alt="" style={{ display: 'block', width: '100%' }} /> : null}
      <div style={{ padding: '12px 16px' }}>
        <b style={{ fontSize: 17, color: '#18181b' }}>{String(block.data.name)}</b>
        <p style={{ margin: '4px 0 0', fontWeight: 700, color: theme.accent }}>{String(block.data.price)}</p>
      </div>
    </div>
  ),
  Fields: ({ block, update }: CustomLookProps) => (
    <>
      {(['name', 'price', 'src'] as const).map((key) => (
        <label key={key} className="rm-field">
          <span>{key}</span>
          <input className="rm-input" value={String(block.data[key] ?? '')} onChange={(e) => update({ ...block.data, [key]: e.target.value })} />
        </label>
      ))}
    </>
  ),
});

/** What the preview is made with: a name for {name}, and a foot as a sender's would be. */
const PREVIEW = { values: { name: 'Ana' }, footer: 'Rebo Studio · 1 Main St.', unsubscribe: '#' };

export function LiveEditor({ locale }: { locale: Locale }) {
  // The email and the block made once a language: the editor starts from them, and is then the reader's.
  const email = useMemo(() => sampleEmail(locale), [locale]);
  const blocks = useMemo(() => [product(locale)], [locale]);
  return <MailEditor email={email} blocks={blocks} locale={locale} preview={PREVIEW} />;
}
