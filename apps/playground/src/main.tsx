// The playground: the whole editor on a page, with a block of the
// application's own (a product, to try how one is registered), the email kept
// in the browser as it is written, and its HTML and text to copy.

import '@rebomail/react/styles.css';
import { type CustomLookProps, type EditorBlock, type Email, MailEditor, readEmail, renderEmail, sampleEmail } from '@rebomail/react';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

const KEPT = 'rebomail:playground';
type Locale = 'en' | 'es';

/** A product: its picture, name and price on the email, and the same in the panel to change them. */
const product: EditorBlock = {
  kind: 'product',
  label: 'Product',
  data: () => ({ name: 'Lounge chair', price: '$249', src: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800', url: 'https://example.com/chair' }),
  render: {
    html: (b, ctx) =>
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px;border:1px solid #e4e4e7;border-radius:12px;border-collapse:separate;"><tr><td>${
        b.data.src ? `<img src="${String(b.data.src)}" width="${ctx.width}" alt="" style="display:block;width:100%;height:auto;border-radius:12px 12px 0 0;">` : ''
      }</td></tr><tr><td style="padding:14px 16px;"><p style="margin:0;font-size:17px;font-weight:bold;color:${ctx.inks.strong};">${String(b.data.name)}</p><p style="margin:4px 0 0;font-size:16px;font-weight:bold;color:${ctx.theme.accent};">${String(b.data.price)}</p>${ctx.button('Buy', String(b.data.url))}</td></tr></table>`,
    text: (b, ctx) => `${String(b.data.name)} — ${String(b.data.price)}\n${ctx.link(String(b.data.url))}`,
    complete: (b) => !!b.data.name && !!b.data.url,
  },
  Look: ({ block, theme }: CustomLookProps) => (
    <div style={{ margin: '6px 0', border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden' }}>
      {block.data.src ? <img src={String(block.data.src)} alt="" style={{ display: 'block', width: '100%' }} /> : null}
      <div style={{ padding: '12px 16px' }}>
        <b style={{ fontSize: 17, color: '#18181b' }}>{String(block.data.name)}</b>
        <p style={{ margin: '4px 0 0', fontWeight: 700, color: theme.accent }}>{String(block.data.price)}</p>
      </div>
    </div>
  ),
  Fields: ({ block, update }: CustomLookProps) => (
    <>
      {(['name', 'price', 'src', 'url'] as const).map((key) => (
        <label key={key} className="rm-field">
          <span>{key}</span>
          <input className="rm-input" value={String(block.data[key] ?? '')} onChange={(e) => update({ ...block.data, [key]: e.target.value })} />
        </label>
      ))}
    </>
  ),
};

function kept(): Email | undefined {
  try {
    const raw = localStorage.getItem(KEPT);
    return raw ? readEmail(JSON.parse(raw)) : undefined;
  } catch {
    return undefined;
  }
}

function Playground() {
  const [locale, setLocale] = useState<Locale>('es');
  const [email, setEmail] = useState<Email>(() => kept() ?? sampleEmail('es'));
  const [current, setCurrent] = useState(email);
  const [copied, setCopied] = useState('');
  const save = (next: Email) => {
    setCurrent(next);
    try {
      localStorage.setItem(KEPT, JSON.stringify(next));
    } catch {
      // Without storage, only for this visit.
    }
  };
  const copy = async (what: 'html' | 'text' | 'json') => {
    const out = renderEmail(current, { values: { name: 'Ana' }, custom: { product: product.render }, locale, footer: 'Rebo Studio · 1 Main St.', unsubscribe: 'https://example.com/unsubscribe' });
    await navigator.clipboard.writeText(what === 'json' ? JSON.stringify(current, null, 2) : out[what]);
    setCopied(what);
    setTimeout(() => setCopied(''), 1500);
  };
  const button = { padding: '6px 12px', borderRadius: 999, border: '1.5px solid #d4d4d8', background: 'transparent', color: 'inherit', font: '600 13px system-ui', cursor: 'pointer' };
  return (
    <div style={{ padding: 20, fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <img src="/logo.svg" alt="" width={26} height={26} />
        <b style={{ fontSize: 18, flex: 1 }}>Rebomail</b>
        {(['es', 'en'] as const).map((l) => (
          <button key={l} type="button" style={{ ...button, borderColor: locale === l ? '#3b63fb' : '#d4d4d8' }} onClick={() => setLocale(l)}>
            {l.toUpperCase()}
          </button>
        ))}
        {(['html', 'text', 'json'] as const).map((w) => (
          <button key={w} type="button" style={button} onClick={() => void copy(w)}>
            {copied === w ? '✓' : 'Copy'} {w.toUpperCase()}
          </button>
        ))}
        <button
          type="button"
          style={button}
          onClick={() => {
            const fresh = sampleEmail(locale);
            setEmail(fresh);
            save(fresh);
          }}
        >
          {locale === 'es' ? 'Empezar de nuevo' : 'Start over'}
        </button>
      </header>
      <MailEditor
        email={email}
        onChange={save}
        locale={locale}
        blocks={[product]}
        preview={{ values: { name: 'Ana' }, footer: 'Rebo Studio · 1 Main St.', unsubscribe: 'https://example.com/unsubscribe' }}
      />
    </div>
  );
}

createRoot(document.getElementById('mail')!).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
);
