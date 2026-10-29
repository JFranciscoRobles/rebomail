// Beside the email, what is not written on it: of the block chosen, its
// links, pictures, colours, widths and tones (and its words too); with none
// chosen, the email's own (its colours, its name, its logo, its width), how
// the editor is used, and what the email lacks before it goes.

import { type Block, describeProblem, LOOKS, NETWORKS, partsOf, SIZES, TONES, WIDTHS, type Widths } from '@rebomail/core';
import type { ReactNode } from 'react';
import { Icon } from './icons';
import { iconOf, useMail, useSelection } from './state';

export function MailInspector({ className }: { className?: string }) {
  const { block } = useSelection();
  return <div className={`rm-inspector${className ? ` ${className}` : ''}`}>{block ? <BlockPanel block={block} /> : <EmailPanel />}</div>;
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  // biome-ignore lint/a11y/noLabelWithoutControl: the control is the child given.
  <label className="rm-field">
    <span>{label}</span>
    {children}
  </label>
);

function Choice<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <span className="rm-choice">
      {options.map(([id, label]) => (
        <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </span>
  );
}

/** Things of a block one under another, each with its fields and, past the `least` it needs, a way to take it out; and a way to add one, while there is room. */
function Many<T>({
  items,
  name,
  fields,
  remove,
  add,
  least = 0,
}: {
  items: T[];
  name: (i: number) => string;
  fields: (item: T, i: number) => ReactNode;
  remove?: (i: number) => void;
  add?: { label: string; onAdd: () => void };
  least?: number;
}) {
  const { words } = useMail();
  return (
    <div className="rm-list-edit">
      {items.map((item, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the things are where they are, in their order.
        <div key={i} className="rm-list-edit-item">
          <div className="rm-list-edit-head">
            {name(i)}
            {remove && items.length > least && (
              <button type="button" className="rm-icon-button" title={words.fields.removeOne} aria-label={`${words.fields.removeOne}: ${name(i)}`} onClick={() => remove(i)}>
                <Icon name="close" size={12} />
              </button>
            )}
          </div>
          {fields(item, i)}
        </div>
      ))}
      {add && (
        <button type="button" className="rm-link rm-add" onClick={add.onAdd}>
          <Icon name="plus" size={14} /> {add.label}
        </button>
      )}
    </div>
  );
}

function BlockPanel({ block: b }: { block: Block }) {
  const { words, update, remove, labelOf, custom, email } = useMail();
  const set = (patch: Partial<Block>, field?: string) => update(b.id, patch, field);
  const f = words.fields;
  const input = (value: string, onChange: (v: string) => void, placeholder: string, field: string) => (
    <input className="rm-input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} data-field={field} />
  );
  const area = (value: string, onChange: (v: string) => void, placeholder: string, rows = 4, mono = false) => (
    <textarea className={`rm-input${mono ? ' rm-mono' : ''}`} rows={rows} value={value} placeholder={placeholder} spellCheck={!mono} onChange={(e) => onChange(e.target.value)} />
  );

  const fields = (): ReactNode => {
    switch (b.type) {
      case 'heading':
      case 'text':
      case 'markdown':
        return <Field label={f.text}>{area(b.text, (text) => set({ text }, 'text'), b.type === 'markdown' ? f.markdown : f.text, 4, b.type === 'markdown')}</Field>;
      case 'button':
        return (
          <>
            <Field label={f.label}>{input(b.label, (label) => set({ label }, 'label'), f.label, 'label')}</Field>
            <Field label={f.url}>{input(b.url, (url) => set({ url }, 'url'), 'https://', 'url')}</Field>
            <Field label={f.color}>
              <span className="rm-row">
                <input type="color" value={b.color ?? email.theme.accent} onChange={(e) => set({ color: e.target.value }, 'color')} aria-label={f.color} />
                {b.color && (
                  <button type="button" className="rm-link" onClick={() => set({ color: null })}>
                    {words.accent}
                  </button>
                )}
              </span>
            </Field>
          </>
        );
      case 'image':
        return (
          <>
            <Field label={f.picture}>{input(b.src, (src) => set({ src }, 'src'), 'https://', 'src')}</Field>
            <Field label={f.alt}>{input(b.alt, (alt) => set({ alt }, 'alt'), f.alt, 'alt')}</Field>
            <Field label={f.href}>{input(b.href, (href) => set({ href }, 'href'), 'https://', 'href')}</Field>
          </>
        );
      case 'hero':
        return (
          <>
            <Field label={f.picture}>{input(b.src, (src) => set({ src }, 'src'), 'https://', 'src')}</Field>
            <Field label={f.url}>{input(b.url, (url) => set({ url }, 'url'), 'https://', 'url')}</Field>
          </>
        );
      case 'callout':
        return (
          <>
            <Field label={words.tone}>
              <Choice options={TONES.map((t) => [t, words.tones[t]])} value={b.tone} onChange={(tone) => set({ tone })} />
            </Field>
            <Field label={f.text}>{area(b.text, (text) => set({ text }, 'text'), f.text, 3)}</Field>
          </>
        );
      case 'quote':
        return <Field label={f.author}>{input(b.author, (author) => set({ author }, 'author'), f.author, 'author')}</Field>;
      case 'list':
        return (
          <>
            <label className="rm-check">
              <input type="checkbox" checked={b.ordered} onChange={(e) => set({ ordered: e.target.checked })} /> {words.numbered}
            </label>
            <Field label={f.list}>{area(b.text, (text) => set({ text }, 'text'), f.list)}</Field>
          </>
        );
      case 'video':
        return (
          <>
            <Field label={f.video}>{input(b.url, (url) => set({ url }, 'url'), 'https://', 'url')}</Field>
            <Field label={f.cover}>{input(b.src, (src) => set({ src }, 'src'), 'https://', 'src')}</Field>
          </>
        );
      case 'social':
        return NETWORKS.map((n) => (
          <Field key={n} label={words.networks[n]}>
            {input(b.links[n] ?? '', (url) => set({ links: { ...b.links, [n]: url } }, `link:${n}`), 'https://', n)}
          </Field>
        ));
      case 'menu':
        return (
          <Many
            items={b.links}
            name={(i) => b.links[i].label || `${f.link} ${i + 1}`}
            fields={(l, i) => {
              const setLink = (patch: Partial<typeof l>, field: string) => set({ links: b.links.map((x, j) => (j === i ? { ...x, ...patch } : x)) }, `${field}:${i}`);
              return (
                <>
                  {input(l.label, (label) => setLink({ label }, 'link'), f.link, `link:${i}`)}
                  {input(l.url, (url) => setLink({ url }, 'url'), 'https://', `url:${i}`)}
                </>
              );
            }}
            remove={(i) => set({ links: b.links.filter((_, j) => j !== i) })}
            add={b.links.length < 8 ? { label: f.addLink, onAdd: () => set({ links: [...b.links, { label: '', url: '' }] }) } : undefined}
          />
        );
      case 'coupon':
        return (
          <>
            <Field label={f.code}>{input(b.code, (code) => set({ code }, 'code'), 'SAVE20', 'code')}</Field>
            <Field label={f.offer}>{input(b.text, (text) => set({ text }, 'text'), f.offer, 'text')}</Field>
            <Field label={f.note}>{input(b.note, (note) => set({ note }, 'note'), f.note, 'note')}</Field>
          </>
        );
      case 'table':
        return (
          <>
            <label className="rm-check">
              <input type="checkbox" checked={b.total} onChange={(e) => set({ total: e.target.checked })} /> {f.total}
            </label>
            <Many
              items={b.rows}
              least={1}
              name={(i) => b.rows[i].label || `${f.row} ${i + 1}`}
              fields={(r, i) => {
                const setRow = (patch: Partial<typeof r>, field: string) => set({ rows: b.rows.map((x, j) => (j === i ? { ...x, ...patch } : x)) }, `${field}:${i}`);
                return (
                  <>
                    {input(r.label, (label) => setRow({ label }, 'label'), f.row, `label:${i}`)}
                    {input(r.value, (value) => setRow({ value }, 'value'), f.value, `value:${i}`)}
                  </>
                );
              }}
              remove={(i) => set({ rows: b.rows.filter((_, j) => j !== i) })}
              add={b.rows.length < 40 ? { label: f.addRow, onAdd: () => set({ rows: [...b.rows, { label: '', value: '' }] }) } : undefined}
            />
          </>
        );
      case 'rating':
        return (
          <>
            <Field label={f.question}>{input(b.text, (text) => set({ text }, 'text'), f.question, 'text')}</Field>
            <Field label={f.stars}>{input(b.url, (url) => set({ url }, 'url'), 'https://example.com/survey?score={score}', 'url')}</Field>
            <p className="rm-help">{f.starsHelp}</p>
          </>
        );
      case 'gallery':
        return (
          <>
            <Field label={f.pictures}>
              <Choice
                options={[
                  ['2', '2'],
                  ['3', '3'],
                ]}
                value={String(b.pictures.length)}
                onChange={(n) => set({ pictures: Number(n) === 2 ? b.pictures.slice(0, 2) : [...b.pictures, { src: '', alt: '', href: '' }] })}
              />
            </Field>
            <Many
              items={b.pictures}
              name={(i) => f.nth(i + 1)}
              fields={(p, i) => {
                const setPicture = (patch: Partial<typeof p>, field: string) => set({ pictures: b.pictures.map((x, j) => (j === i ? { ...x, ...patch } : x)) }, `${field}:${i}`);
                return (
                  <>
                    {input(p.src, (src) => setPicture({ src }, 'src'), 'https://', `src:${i}`)}
                    {input(p.alt, (alt) => setPicture({ alt }, 'alt'), f.alt, `alt:${i}`)}
                    {input(p.href, (href) => setPicture({ href }, 'href'), f.href, `href:${i}`)}
                  </>
                );
              }}
            />
          </>
        );
      case 'spacer':
        return (
          <Field label={words.size}>
            <Choice options={SIZES.map((s) => [s, words.sizes[s]])} value={b.size} onChange={(size) => set({ size })} />
          </Field>
        );
      case 'html':
        return (
          <>
            <Field label={f.html}>{area(b.html, (html) => set({ html }, 'html'), '<table>…</table>', 10, true)}</Field>
            <p className="rm-help">{f.htmlHelp}</p>
          </>
        );
      case 'section':
        return (
          <>
            <Field label={words.look}>
              <Choice options={LOOKS.map((l) => [l, words.looks[l]])} value={b.look} onChange={(look) => set({ look })} />
            </Field>
            <p className="rm-help">{words.dragInto}</p>
          </>
        );
      case 'columns': {
        const setWidths = (widths: Widths) => {
          const count = partsOf(widths).length;
          // From three to two, what was in the third goes to the end of the second.
          const columns =
            count >= b.columns.length ? [...b.columns, ...Array.from({ length: count - b.columns.length }, () => [])] : [...b.columns.slice(0, count - 1), b.columns.slice(count - 1).flat()];
          set({ widths, columns });
        };
        return (
          <>
            <Field label={words.widths}>
              <Choice options={WIDTHS.map((w) => [w, { '1-1': '½ · ½', '1-2': '⅓ · ⅔', '2-1': '⅔ · ⅓', '1-1-1': '⅓ · ⅓ · ⅓' }[w]] as [Widths, string])} value={b.widths} onChange={setWidths} />
            </Field>
            <p className="rm-help">
              {words.dragInto} {words.phoneStacks}
            </p>
          </>
        );
      }
      case 'divider':
        return null;
      case 'custom': {
        const definition = custom[b.kind];
        return definition?.Fields ? <definition.Fields block={b} theme={email.theme} width={email.theme.width - 64} update={(data) => set({ data }, 'data')} /> : null;
      }
    }
  };

  return (
    <div className="rm-panel">
      <div className="rm-panel-head">
        {iconOf(b.type)}
        <b>{labelOf(b)}</b>
        <button type="button" className="rm-icon-button" title={words.remove} aria-label={words.remove} onClick={() => remove(b.id)}>
          <Icon name="trash" size={14} />
        </button>
      </div>
      {fields()}
    </div>
  );
}

function EmailPanel() {
  const { email, words, setTheme, problems, locale, select } = useMail();
  const { theme } = email;
  return (
    <>
      <div className="rm-panel">
        <div className="rm-panel-head">
          <b>{words.email}</b>
        </div>
        <span className="rm-row">
          <Field label={words.accent}>
            <input type="color" value={theme.accent} onChange={(e) => setTheme({ accent: e.target.value })} />
          </Field>
          <Field label={words.background}>
            <input type="color" value={theme.background} onChange={(e) => setTheme({ background: e.target.value })} />
          </Field>
        </span>
        <Field label={words.name}>
          <input className="rm-input" value={theme.name} onChange={(e) => setTheme({ name: e.target.value })} />
        </Field>
        <Field label={words.logo}>
          <input className="rm-input" value={theme.logo ?? ''} placeholder="https://" onChange={(e) => setTheme({ logo: e.target.value || null })} />
        </Field>
        <Field label={words.width}>
          <Choice
            options={[
              ['560', '560'],
              ['600', '600'],
              ['640', '640'],
            ]}
            value={String(theme.width)}
            onChange={(w) => setTheme({ width: Number(w) })}
          />
        </Field>
      </div>
      <div className="rm-panel">
        <div className="rm-panel-head">
          <b>{words.problems}</b>
        </div>
        {problems.length ? (
          <ul className="rm-problems">
            {problems.map((p, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: the problems as they are found, in their order.
              <li key={i}>
                <Icon name="alert" size={14} />
                {'block' in p ? (
                  <button type="button" className="rm-link" onClick={() => select(p.block)}>
                    {describeProblem(p, locale)}
                  </button>
                ) : (
                  describeProblem(p, locale)
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rm-ok">
            <Icon name="check" size={14} /> {words.noProblems}
          </p>
        )}
      </div>
      <div className="rm-panel rm-panel-quiet">
        {words.help.map((line) => (
          <p key={line} className="rm-help">
            {line}
          </p>
        ))}
      </div>
    </>
  );
}
