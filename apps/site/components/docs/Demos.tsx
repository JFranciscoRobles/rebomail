'use client';

// The demos the pages of the documentation put among their words, each by the
// name a page gives it (`<demo name="render" />`): the engine and the editor
// running in the page, with what they say beside them.

import { type Email, type Problem, describeProblem, problemsOf, renderEmail, sampleEmail } from '@rebomail/core';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useT } from '@/components/i18n';
import { LiveEditor } from '@/components/LiveEditor';
import type { Locale } from '@/lib/i18n';

const CAPTION = 'm-0 text-xs font-semibold uppercase tracking-[0.04em] text-muted';
const chip = (on: boolean) =>
  `cursor-pointer rounded-full border px-3 py-1 text-[13px] font-medium transition-colors ${on ? 'border-brand bg-brand-light text-brand-dark' : 'border-border-strong bg-white text-ink hover:bg-hover'}`;

/** A demo to try, with a line on what it shows; `aside` goes beside it, `children` is the demo itself. */
export function DemoBox({ children, aside, title }: { children: ReactNode; aside?: ReactNode; title?: string }) {
  const t = useT();
  return (
    <div className="mt-7 flex flex-wrap overflow-hidden rounded-[18px] border border-border">
      <div className="min-w-0 flex-[1.6_1_440px] bg-surface px-6 py-5">
        <p className={`${CAPTION} flex items-center gap-2`}>
          <span className="size-2 animate-pulse-dot rounded-full bg-brand" aria-hidden="true" />
          {title ?? t({ en: 'Try it', es: 'Pruébalo' })}
        </p>
        <div className="mt-3 rounded-[14px] border border-border bg-white p-4">{children}</div>
      </div>
      {aside && <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-4 px-6 py-5">{aside}</div>}
    </div>
  );
}

/** What the engine says while a demo runs: a dark panel of plain lines. */
export function Readout({ label, lines }: { label: string; lines: [key: string, value: string, tone?: 'good' | 'warn' | 'dim'][] }) {
  const TONE = { good: 'text-[#9ee0b0]', warn: 'text-[#f5c443]', dim: 'text-[#a8a49a]' };
  return (
    <div>
      <p className={CAPTION}>{label}</p>
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: it scrolls when a line is long, and the keyboard reaches it. */}
      <div tabIndex={0} aria-live="polite" className="mt-2.5 overflow-x-auto rounded-xl bg-[#2f2e2b] px-4 py-3.5 font-code text-[13px] leading-[1.75] text-[#edece8]">
        {lines.map(([key, value, tone]) => (
          <div key={key} className="flex gap-2.5 whitespace-nowrap">
            <span className="text-[#9cc0fa]">{key}</span>
            <span className="text-[#a8a49a]" aria-hidden="true">
              →
            </span>
            <span className={tone ? TONE[tone] : 'text-[#f5c443]'}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditorDemo() {
  const locale = useLocale();
  const t = useT();
  return (
    <div className="mt-7">
      <div className="overflow-hidden rounded-[18px] border border-border bg-surface p-2">
        <LiveEditor locale={locale} />
      </div>
      <p className="m-0 mt-2.5 text-[13.5px] text-muted">
        {t({
          en: 'The editor, running: drag a block from the left, click one to write in it, and open the preview to see the HTML an inbox gets. The Product block is one of the page’s own.',
          es: 'El editor, corriendo: arrastra un bloque de la izquierda, da clic en uno para escribir, y abre la vista previa para ver el HTML que recibe una bandeja. El bloque Producto es uno propio de la página.',
        })}
      </p>
    </div>
  );
}

/**
 * The email in a frame as wide as an inbox shows it, made smaller to fit the
 * box: narrower, it would take the look it has on a phone.
 */
function Inbox({ html, width, title }: { html: string; width: number; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(width);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setRoom(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const scale = Math.min(1, room / width);
  return (
    <div ref={box} className="h-[440px] overflow-hidden rounded-lg bg-[#f4f4f5]">
      <iframe
        title={title}
        srcDoc={html}
        className="origin-top-left border-0 bg-white"
        style={{ width, height: 440 / scale, transform: `scale(${scale})`, marginLeft: width * scale < room ? (room - width * scale) / 2 : 0 }}
      />
    </div>
  );
}

function RenderDemo() {
  const t = useT();
  const page = useLocale();
  const [name, setName] = useState('Ana');
  const [locale, setLocale] = useState<Locale>(page);
  const [view, setView] = useState<'desktop' | 'phone' | 'text'>('desktop');
  const email = useMemo(() => sampleEmail(locale), [locale]);
  const out = useMemo(() => renderEmail(email, { values: { name }, locale, footer: 'Rebo Studio · 1 Main St.', unsubscribe: 'https://example.com/u/abc' }), [email, name, locale]);
  const links = (out.html.match(/<a /g) ?? []).length;

  return (
    <DemoBox
      aside={
        <>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            <code className="font-code text-[13px] text-muted">values.name</code>
            <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-border-strong px-3 py-2 text-[15px] outline-none focus:border-brand" />
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <code className="mr-1 font-code text-[13px] text-muted">locale</code>
            {(['en', 'es'] as const).map((one) => (
              <button key={one} type="button" onClick={() => setLocale(one)} className={chip(locale === one)}>
                {one}
              </button>
            ))}
          </div>
          <Readout
            label={t({ en: 'renderEmail gives', es: 'renderEmail da' })}
            lines={[
              ['subject', out.subject],
              ['preheader', out.preheader.slice(0, 38) + (out.preheader.length > 38 ? '…' : ''), 'dim'],
              ['html', `${(out.html.length / 1024).toFixed(1)} KB · ${links} links`, 'good'],
              ['text', `${out.text.split('\n').length} ${t({ en: 'lines', es: 'líneas' })}`, 'good'],
            ]}
          />
        </>
      }
    >
      <div role="tablist" className="mb-3 flex gap-1.5">
        {(
          [
            ['desktop', t({ en: 'Desktop', es: 'Computadora' })],
            ['phone', t({ en: 'Phone', es: 'Celular' })],
            ['text', t({ en: 'Plain text', es: 'Texto plano' })],
          ] as const
        ).map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => setView(key)} className={chip(view === key)}>
            {label}
          </button>
        ))}
      </div>
      {view === 'text' ? (
        <pre className="m-0 h-[440px] overflow-auto whitespace-pre-wrap rounded-lg bg-surface p-4 font-code text-[12.5px] leading-[1.6] text-ink-soft">{out.text}</pre>
      ) : (
        <Inbox html={out.html} width={view === 'phone' ? 375 : email.theme.width + 40} title={t({ en: 'The email', es: 'El correo' })} />
      )}
    </DemoBox>
  );
}

/** What can go wrong with an email, each one switched on by a box. */
const FAULTS = ['subject', 'variable', 'button', 'link', 'column'] as const;
type Fault = (typeof FAULTS)[number];

function emailWith(faults: Set<Fault>): Email {
  const base = sampleEmail('en');
  return {
    ...base,
    subject: faults.has('subject') ? '' : 'Hi {name}',
    blocks: [
      { id: 'title', type: 'heading', text: faults.has('variable') ? 'Hi {name}, from {company}' : 'Hi {name}' },
      { id: 'words', type: 'text', text: faults.has('link') ? 'Read [the news](javascript:go).' : 'Read [the news](https://example.com/news).' },
      { id: 'cta', type: 'button', label: 'See it', url: faults.has('button') ? '' : 'https://example.com', color: null },
      {
        id: 'row',
        type: 'columns',
        widths: '1-1',
        columns: [[{ id: 'left', type: 'text', text: 'Left' }], faults.has('column') ? [] : [{ id: 'right', type: 'text', text: 'Right' }]],
      },
    ],
  };
}

function ChecksDemo() {
  const t = useT();
  const locale = useLocale();
  const [faults, setFaults] = useState<Set<Fault>>(new Set(['variable', 'column']));
  const problems: Problem[] = useMemo(() => problemsOf(emailWith(faults), { variables: ['name'] }), [faults]);
  const LABEL: Record<Fault, string> = {
    subject: t({ en: 'No subject', es: 'Sin asunto' }),
    variable: t({ en: '{company}, which nobody fills', es: '{company}, que nadie llena' }),
    button: t({ en: 'A button going nowhere', es: 'Un botón que no va a ningún lado' }),
    link: t({ en: 'A javascript: link', es: 'Una liga javascript:' }),
    column: t({ en: 'An empty column', es: 'Una columna vacía' }),
  };
  const flip = (fault: Fault) =>
    setFaults((now) => {
      const next = new Set(now);
      if (!next.delete(fault)) next.add(fault);
      return next;
    });

  return (
    <DemoBox
      aside={
        <Readout
          label={`problemsOf(email, { variables: ['name'] })`}
          lines={problems.length ? problems.map((p, i) => [`${i}`, p.code, 'warn']) : [['[]', t({ en: 'ready to go', es: 'listo para enviar' }), 'good']]}
        />
      }
    >
      <p className={CAPTION}>{t({ en: 'Break the email', es: 'Rompe el correo' })}</p>
      <div className="mt-2.5 flex flex-col gap-2">
        {FAULTS.map((fault) => (
          <label key={fault} className="flex cursor-pointer items-center gap-2.5 text-[15px] text-ink">
            <input type="checkbox" checked={faults.has(fault)} onChange={() => flip(fault)} className="size-4 accent-[#0d9488]" />
            {LABEL[fault]}
          </label>
        ))}
      </div>
      <p className={`${CAPTION} mt-5`}>describeProblem(p, &apos;{locale}&apos;)</p>
      <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
        {problems.length ? (
          problems.map((p) => (
            <li key={JSON.stringify(p)} className="rounded-lg bg-pastel-yellow px-3 py-2 text-[14px] text-[#5c4a1e]">
              {describeProblem(p, locale)}
            </li>
          ))
        ) : (
          <li className="rounded-lg bg-pastel-green px-3 py-2 text-[14px] text-pastel-green-fg">{t({ en: 'Nothing is missing.', es: 'No falta nada.' })}</li>
        )}
      </ul>
    </DemoBox>
  );
}

/** The demos, by the name a page gives them. */
export function Demo({ name }: { name: string }) {
  if (name === 'editor') return <EditorDemo />;
  if (name === 'render') return <RenderDemo />;
  if (name === 'checks') return <ChecksDemo />;
  return null;
}
