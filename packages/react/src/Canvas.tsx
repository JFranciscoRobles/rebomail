// The email written on itself: as it will look in an inbox, its subject on
// top as an inbox shows it, each block chosen with a click and its words
// written where they show; a line between blocks where what is dragged may
// fall, a box in a section or a column still empty. The chosen block has its
// bar: its handle to drag, up, down, duplicate, remove.

import { type Block, type BlockOf, contextOf, partsOf, type Place, type Theme, whereIs } from '@rebomail/core';
import { type CSSProperties, type DragEvent, type ReactNode, useRef, useState } from 'react';
import { Editable } from './Editable';
import { Icon } from './icons';
import { type EditorBlock, useMail } from './state';

/** The inks of the words, as variables: those of a dark section are light. */
const inks = (theme: Theme): CSSProperties => ({ '--rm-ink': theme.ink, '--rm-strong': '#18181b', '--rm-soft': '#52525b', '--rm-faint': '#71717a', '--rm-accent': theme.accent }) as CSSProperties;
const DARK = { '--rm-ink': '#e4e4e7', '--rm-strong': '#ffffff', '--rm-soft': '#d4d4d8', '--rm-faint': '#a1a1aa' } as CSSProperties;
/** The light of a colour: as the email draws a callout and a section of the accent. */
const light = (hex: string) => `color-mix(in srgb, ${hex} 9%, white)`;

export function MailCanvas({ className }: { className?: string }) {
  const { email, words, setSubject, setPreheader, select } = useMail();
  const { theme } = email;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a click outside every block chooses none; Escape does the same by keyboard.
    // biome-ignore lint/a11y/useKeyWithClickEvents: as above.
    <div className={`rm-canvas${className ? ` ${className}` : ''}`} onClick={() => select(null)} style={{ background: theme.background }}>
      <div className="rm-inbox">
        <span className="rm-inbox-avatar" style={{ background: theme.accent }}>
          {(theme.name || '?')[0]}
        </span>
        <div className="rm-inbox-lines">
          <small>
            {words.from} <b>{theme.name || '—'}</b>
          </small>
          <Editable value={email.subject} onChange={setSubject} placeholder={words.subject} className="rm-inbox-subject" />
          <Editable value={email.preheader} onChange={setPreheader} placeholder={words.preheader} className="rm-inbox-preheader" marks={false} />
        </div>
      </div>
      <div className="rm-sheet" style={{ maxWidth: theme.width, fontFamily: theme.font }}>
        {(theme.name || theme.logo) && (
          <p className="rm-sheet-name">
            {theme.logo && <img src={theme.logo} alt="" />}
            {theme.name}
          </p>
        )}
        <div className="rm-card" style={{ background: theme.card, borderRadius: theme.radius, borderTopColor: theme.accent, ...inks(theme) }}>
          <Blocks list={email.blocks} place={{ parent: null }} width={theme.width - 64} />
        </div>
      </div>
    </div>
  );
}

/** A list of blocks with a place to drop between each two: the email, a section, a column. */
function Blocks({ list, place, width }: { list: Block[]; place: Place; width: number }) {
  const { dragged, canDrop, words } = useMail();
  if (!list.length)
    return (
      <Drop place={place} index={0} empty>
        {dragged && canDrop(place) ? words.dropHere : place.parent ? words.dragHere : words.dragFromPalette}
      </Drop>
    );
  return (
    <div className="rm-blocks">
      <Drop place={place} index={0} />
      {list.map((b, i) => (
        <div key={b.id}>
          <Item block={b} width={width} />
          <Drop place={place} index={i + 1} />
        </div>
      ))}
    </div>
  );
}

/** Where a block may fall: a line between two while something that may go there is dragged; a box in an empty list. */
function Drop({ place, index, empty, children }: { place: Place; index: number; empty?: boolean; children?: ReactNode }) {
  const { dragged, canDrop, drop } = useMail();
  const [over, setOver] = useState(false);
  const may = !!dragged && canDrop(place);
  const handlers = {
    onDragOver: (e: DragEvent) => {
      if (!may) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = dragged && 'id' in dragged ? 'move' : 'copy';
      setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOver(false);
      drop(place, index);
    },
  };
  if (empty)
    return (
      <div {...handlers} className="rm-empty" data-may={may || undefined} data-over={over || undefined}>
        {children}
      </div>
    );
  return (
    <div {...handlers} className="rm-drop" data-may={may || undefined} data-over={over || undefined}>
      <span />
    </div>
  );
}

/** A block on the email: chosen with a click, dragged by its handle, with its bar while chosen. */
function Item({ block: b, width }: { block: Block; width: number }) {
  const { selected, select, drag, email, words, labelOf, move, duplicate, remove } = useMail();
  const box = useRef<HTMLDivElement>(null);
  const chosen = selected === b.id;
  const at = whereIs(email.blocks, b.id);
  const siblings = at ? countIn(email.blocks, at.place) : 0;
  const start = (e: DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', b.id);
    e.dataTransfer.effectAllowed = 'move';
    if (box.current) e.dataTransfer.setDragImage(box.current, 16, 16);
    drag({ id: b.id, type: b.type });
  };
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a block is chosen with a click; its bar's buttons and the panel do the rest by keyboard.
    // biome-ignore lint/a11y/useKeyWithClickEvents: as above.
    <div ref={box} className="rm-item" data-chosen={chosen || undefined} data-layout={b.type === 'section' || b.type === 'columns' || undefined} onClick={(e) => (e.stopPropagation(), select(b.id))}>
      {chosen ? (
        <div className="rm-bar">
          {/* biome-ignore lint/a11y/noStaticElementInteractions: a handle to drag with the pointer; up and down move it by keyboard. */}
          <span className="rm-handle" draggable onDragStart={start} onDragEnd={() => drag(null)} title={words.move}>
            <Icon name="grip" size={14} />
          </span>
          <span className="rm-bar-name">{labelOf(b)}</span>
          <BarButton title={words.up} disabled={!at || at.index === 0} onClick={() => at && move(b.id, at.place, at.index - 1)} icon="up" />
          <BarButton title={words.down} disabled={!at || at.index >= siblings - 1} onClick={() => at && move(b.id, at.place, at.index + 2)} icon="down" />
          <BarButton title={words.duplicate} onClick={() => duplicate(b.id)} icon="duplicate" />
          <BarButton title={words.remove} onClick={() => remove(b.id)} icon="trash" />
        </div>
      ) : (
        // biome-ignore lint/a11y/noStaticElementInteractions: a handle to drag with the pointer; the block chosen moves by keyboard.
        <span className="rm-grip" draggable onDragStart={start} onDragEnd={() => drag(null)} title={words.move}>
          <Icon name="grip" size={14} />
        </span>
      )}
      <Look block={b} width={width} />
    </div>
  );
}

const countIn = (blocks: Block[], place: Place) => {
  if (place.parent === null) return blocks.length;
  const parent = blocks
    .flatMap(function all(b): Block[] {
      return [b, ...(b.type === 'section' ? b.blocks.flatMap(all) : b.type === 'columns' ? b.columns.flat().flatMap(all) : [])];
    })
    .find((b) => b.id === place.parent);
  return parent?.type === 'section' ? parent.blocks.length : parent?.type === 'columns' ? (parent.columns[place.column ?? 0]?.length ?? 0) : 0;
};

function BarButton({ title, icon, disabled, onClick }: { title: string; icon: 'up' | 'down' | 'duplicate' | 'trash'; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" title={title} aria-label={title} disabled={disabled} onClick={(e) => (e.stopPropagation(), onClick())}>
      <Icon name={icon} size={14} />
    </button>
  );
}

/** A picture not given yet: where it will go, and where to give it. */
const NoPicture = ({ label, tall }: { label: string; tall?: boolean }) => (
  <div className="rm-nopicture" data-tall={tall || undefined}>
    <Icon name="image" size={20} />
    {label}
  </div>
);

/** A block as it looks in the email, its words written on it. */
function Look({ block: b, width }: { block: Block; width: number }) {
  const { email, words, update, custom } = useMail();
  const { theme } = email;
  const change = (patch: Partial<Block>, field?: string) => update(b.id, patch, field);
  const pill = (label: string, onLabel: (v: string) => void, color: string | null = null) => (
    <span className="rm-pill" style={{ background: color ?? theme.accent }}>
      <Editable value={label} onChange={onLabel} placeholder={words.fields.label} marks={false} />
    </span>
  );
  switch (b.type) {
    case 'heading':
      return <Editable value={b.text} onChange={(text) => change({ text }, 'text')} placeholder={words.blocks.heading} className="rm-h2" />;
    case 'text':
      return <Editable multiline value={b.text} onChange={(text) => change({ text }, 'text')} placeholder={words.fields.text} className="rm-p" />;
    case 'button':
      return pill(b.label, (label) => change({ label }, 'label'), b.color);
    case 'image':
      return b.src ? <img src={b.src} alt={b.alt} className="rm-img" /> : <NoPicture label={words.missing.image ?? ''} />;
    case 'hero':
      return (
        <div className="rm-hero">
          {b.src ? <img src={b.src} alt="" className="rm-img" /> : <NoPicture label={words.missing.hero ?? ''} tall />}
          <Editable value={b.title} onChange={(title) => change({ title }, 'title')} placeholder={words.fields.title} className="rm-h1" />
          <Editable multiline value={b.text} onChange={(text) => change({ text }, 'text')} placeholder={words.fields.text} className="rm-p" />
          {pill(b.label, (label) => change({ label }, 'label'))}
        </div>
      );
    case 'callout': {
      const tone = b.tone === 'accent' ? [light(theme.accent), theme.accent] : { green: ['#ecfdf5', '#047857'], amber: ['#fffbeb', '#b45309'], gray: ['#f4f4f5', '#3f3f46'] }[b.tone];
      return (
        <div className="rm-callout" style={{ background: tone[0], color: tone[1] }}>
          <Editable multiline value={b.text} onChange={(text) => change({ text }, 'text')} placeholder={words.blocks.callout} />
        </div>
      );
    }
    case 'quote':
      return (
        <div className="rm-quote">
          <Editable multiline value={b.text} onChange={(text) => change({ text }, 'text')} placeholder={words.blocks.quote} className="rm-quote-text" />
          <Editable value={b.author} onChange={(author) => change({ author }, 'author')} placeholder={`— ${words.fields.author}`} className="rm-quote-author" marks={false} />
        </div>
      );
    case 'list':
      return (
        <div className="rm-list">
          <span className="rm-list-marks" aria-hidden="true">
            {(b.text || ' ').split('\n').map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: one mark for each line, in their order.
              <span key={i}>{b.ordered ? `${i + 1}.` : '•'}</span>
            ))}
          </span>
          <Editable multiline value={b.text} onChange={(text) => change({ text }, 'text')} placeholder={words.fields.list} className="rm-p" />
        </div>
      );
    case 'markdown':
      return (
        <div className="rm-code-box">
          <small>Markdown</small>
          <Editable multiline value={b.text} onChange={(text) => change({ text }, 'text')} placeholder={words.fields.markdown} className="rm-mono" marks={false} />
        </div>
      );
    case 'video':
      return (
        <div>
          {b.src ? (
            <div className="rm-video">
              <img src={b.src} alt="" className="rm-img" />
              <Icon name="play" size={48} />
            </div>
          ) : (
            <NoPicture label={words.missing.video ?? ''} tall />
          )}
          <p className="rm-video-title">
            ▶ <Editable value={b.title} onChange={(title) => change({ title }, 'title')} placeholder={words.blocks.video} marks={false} />
          </p>
        </div>
      );
    case 'social': {
      const given = (Object.keys(b.links) as (keyof typeof b.links)[]).filter((n) => b.links[n]);
      return (
        <p className="rm-social">
          {given.length ? (
            given.map((n) => (
              <span key={n} className="rm-social-link">
                {words.networks[n]}
              </span>
            ))
          ) : (
            <em>{words.missing.social}</em>
          )}
        </p>
      );
    }
    case 'menu':
      return b.links.length ? (
        <p className="rm-menu">
          {b.links.map((l, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the links are where they are, in their order.
            <span key={i} className="rm-menu-item">
              {i > 0 && <span className="rm-menu-dot">·</span>}
              <Editable value={l.label} onChange={(label) => change({ links: b.links.map((x, j) => (j === i ? { ...x, label } : x)) }, `link:${i}`)} placeholder={words.fields.link} marks={false} />
            </span>
          ))}
        </p>
      ) : (
        <p className="rm-social">
          <em>{words.missing.menu}</em>
        </p>
      );
    case 'coupon':
      return (
        <div className="rm-coupon" style={{ borderColor: theme.accent }}>
          <Editable value={b.text} onChange={(text) => change({ text }, 'text')} placeholder={words.fields.offer} className="rm-p" />
          <Editable value={b.code} onChange={(code) => change({ code }, 'code')} placeholder={words.fields.code} className="rm-coupon-code" marks={false} />
          <Editable value={b.note} onChange={(note) => change({ note }, 'note')} placeholder={words.fields.note} className="rm-coupon-note" />
        </div>
      );
    case 'table':
      return (
        <div className="rm-table">
          {b.rows.map((r, i) => {
            const set = (patch: Partial<typeof r>, field: string) => change({ rows: b.rows.map((x, j) => (j === i ? { ...x, ...patch } : x)) }, `${field}:${i}`);
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: the rows are where they are, in their order.
              <div key={i} className="rm-table-row" data-total={(b.total && b.rows.length > 1 && i === b.rows.length - 1) || undefined}>
                <Editable value={r.label} onChange={(label) => set({ label }, 'label')} placeholder={words.fields.row} />
                <Editable value={r.value} onChange={(value) => set({ value }, 'value')} placeholder={words.fields.value} className="rm-table-value" />
              </div>
            );
          })}
        </div>
      );
    case 'rating':
      return (
        <div className="rm-rating">
          <Editable value={b.text} onChange={(text) => change({ text }, 'text')} placeholder={words.fields.question} className="rm-rating-text" />
          <p className="rm-stars" style={{ color: theme.accent }} aria-hidden="true">
            ★★★★★
          </p>
        </div>
      );
    case 'gallery':
      return (
        <div className="rm-gallery" style={{ gridTemplateColumns: `repeat(${b.pictures.length}, minmax(0, 1fr))` }}>
          {b.pictures.map((p, i) =>
            p.src ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: the pictures are where they are, in their order.
              <img key={i} src={p.src} alt={p.alt} className="rm-img" />
            ) : (
              // biome-ignore lint/suspicious/noArrayIndexKey: as above.
              <NoPicture key={i} label={words.fields.nth(i + 1)} />
            ),
          )}
        </div>
      );
    case 'divider':
      return <hr className="rm-hr" />;
    case 'spacer':
      return <div className="rm-spacer" style={{ height: { sm: 12, md: 28, lg: 48 }[b.size] }} />;
    case 'html':
      return (
        <div className="rm-code-box">
          <small>HTML</small>
          <pre className="rm-mono">{b.html || words.fields.html}</pre>
        </div>
      );
    case 'section': {
      const look: CSSProperties =
        b.look === 'dark'
          ? { background: '#18181b', ...DARK }
          : b.look === 'accent'
            ? { background: light(theme.accent) }
            : b.look === 'outline'
              ? { border: '1px solid #e4e4e7' }
              : { background: '#f4f4f5' };
      return (
        <div className="rm-section" style={look}>
          <Blocks list={b.blocks} place={{ parent: b.id }} width={width - 48} />
        </div>
      );
    }
    case 'columns': {
      const parts = partsOf(b.widths);
      const total = parts.reduce((a, n) => a + n, 0);
      const room = width - 16 * (parts.length - 1);
      return (
        <div className="rm-columns" style={{ gridTemplateColumns: parts.map((p) => `minmax(0,${p}fr)`).join(' ') }}>
          {b.columns.map((column, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the columns are where they are; their place is what they are.
            <div key={i} className="rm-column">
              <Blocks list={column} place={{ parent: b.id, column: i }} width={Math.floor((room * parts[i]) / total)} />
            </div>
          ))}
        </div>
      );
    }
    case 'custom':
      return <CustomLook block={b} width={width} definition={custom[b.kind]} />;
  }
}

/** One of the application's blocks: as it says it looks, or as its HTML in the email. */
function CustomLook({ block, width, definition }: { block: BlockOf<'custom'>; width: number; definition?: EditorBlock }) {
  const { email, update, locale } = useMail();
  if (!definition) return <div className="rm-unknown">{block.kind}</div>;
  if (definition.Look) return <definition.Look block={block} theme={email.theme} width={width} update={(data) => update(block.id, { data })} />;
  const html = definition.render.html(block, { ...contextOf(email, { locale }), width });
  // biome-ignore lint/security/noDangerouslySetInnerHtml: the application's own HTML for its own block, as it goes in the email.
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
