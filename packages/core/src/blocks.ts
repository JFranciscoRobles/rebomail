// The blocks: each made new, as it starts; each read from what was given (kept
// anywhere, sent by anyone), only what its type has and as long as it may be;
// where each may go (a section holds anything but a section, a column no
// layout); and whether each has what it needs to show something.

import { type Block, BLOCK_TYPES, type BlockOf, type BlockType, type CustomData, DEFAULT_THEME, type Email, type Json, LOOKS, NETWORKS, partsOf, SIZES, type Theme, TONES, WIDTHS } from './model';

export const newId = () => Math.random().toString(36).slice(2, 10);

/** The blocks that hold others. */
export const LAYOUTS: readonly BlockType[] = ['section', 'columns'];
export const isLayout = (type: BlockType) => LAYOUTS.includes(type);

/** Where a list of blocks is: the email itself, a section, or a column. */
export type Inside = 'email' | 'section' | 'columns';

/** Whether a block of `type` may go in a list `inside`: no section in a section, no layout in a column (a phone has no room). */
export const allowed = (inside: Inside, type: BlockType) => (inside === 'columns' ? !isLayout(type) : inside === 'section' ? type !== 'section' : true);

/** A block of `type` as it starts: empty, for whoever writes it. A custom one says its kind and its data. */
export function makeBlock<T extends BlockType>(type: T, custom?: { kind: string; data?: CustomData }): BlockOf<T> {
  const id = newId();
  const made: Record<BlockType, () => Block> = {
    heading: () => ({ id, type: 'heading', text: '' }),
    text: () => ({ id, type: 'text', text: '' }),
    button: () => ({ id, type: 'button', label: '', url: '', color: null }),
    image: () => ({ id, type: 'image', src: '', alt: '', href: '' }),
    hero: () => ({ id, type: 'hero', src: '', title: '', text: '', label: '', url: '' }),
    callout: () => ({ id, type: 'callout', text: '', tone: 'accent' }),
    quote: () => ({ id, type: 'quote', text: '', author: '' }),
    list: () => ({ id, type: 'list', text: '', ordered: false }),
    markdown: () => ({ id, type: 'markdown', text: '' }),
    video: () => ({ id, type: 'video', src: '', url: '', title: '' }),
    social: () => ({ id, type: 'social', links: {} }),
    menu: () => ({ id, type: 'menu', links: [] }),
    coupon: () => ({ id, type: 'coupon', code: '', text: '', note: '' }),
    table: () => ({ id, type: 'table', rows: [{ label: '', value: '' }], total: false }),
    rating: () => ({ id, type: 'rating', text: '', url: '' }),
    gallery: () => ({
      id,
      type: 'gallery',
      pictures: [
        { src: '', alt: '', href: '' },
        { src: '', alt: '', href: '' },
      ],
    }),
    divider: () => ({ id, type: 'divider' }),
    spacer: () => ({ id, type: 'spacer', size: 'md' }),
    html: () => ({ id, type: 'html', html: '' }),
    section: () => ({ id, type: 'section', look: 'gray', blocks: [] }),
    columns: () => ({ id, type: 'columns', widths: '1-1', columns: [[], []] }),
    custom: () => ({ id, type: 'custom', kind: custom?.kind ?? '', data: custom?.data ?? {} }),
  };
  return made[type]() as BlockOf<T>;
}

/** An email with nothing in it yet, in the theme given over the default one. */
export const blankEmail = (theme: Partial<Theme> = {}): Email => ({ subject: '', preheader: '', theme: { ...DEFAULT_THEME, ...theme }, blocks: [] });

// ——— Reading what was given ———

const text = (v: unknown, most = 4000) => (typeof v === 'string' ? v.slice(0, most) : '');
const color = (v: unknown) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null);
const oneOf = <T>(v: unknown, of: readonly T[], otherwise: T): T => (of.includes(v as T) ? (v as T) : otherwise);
const object = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** What JSON says, no deeper than eight and no longer than it may be: the data of a custom block. */
function json(v: unknown, depth = 0): Json {
  if (depth > 8) return null;
  if (v === null || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') return v.slice(0, 20_000);
  if (Array.isArray(v)) return v.slice(0, 200).map((x) => json(x, depth + 1));
  if (typeof v === 'object')
    return Object.fromEntries(
      Object.entries(v)
        .slice(0, 100)
        .map(([k, x]) => [k.slice(0, 100), json(x, depth + 1)]),
    );
  return null;
}

/**
 * Blocks as they were given, only what each type has and as long as it may be: what is not a block, or may not go
 * where it is (`inside`), is left out. A block without an id is given one.
 */
export function readBlocks(given: unknown, inside: Inside = 'email'): Block[] {
  if (!Array.isArray(given)) return [];
  return given.slice(0, 200).flatMap((raw): Block[] => {
    const b = object(raw);
    const type = b.type as BlockType;
    if (!LAYOUT_OR_BLOCK.has(type) || !allowed(inside, type)) return [];
    const id = text(b.id, 40) || newId();
    switch (type) {
      case 'heading':
        return [{ id, type, text: text(b.text, 300) }];
      case 'text':
        return [{ id, type, text: text(b.text, 10_000) }];
      case 'button':
        return [{ id, type, label: text(b.label, 120), url: text(b.url, 2000), color: color(b.color) }];
      case 'image':
        return [{ id, type, src: text(b.src, 2000), alt: text(b.alt, 300), href: text(b.href, 2000) }];
      case 'hero':
        return [{ id, type, src: text(b.src, 2000), title: text(b.title, 300), text: text(b.text), label: text(b.label, 120), url: text(b.url, 2000) }];
      case 'callout':
        return [{ id, type, text: text(b.text), tone: oneOf(b.tone, TONES, 'accent') }];
      case 'quote':
        return [{ id, type, text: text(b.text), author: text(b.author, 200) }];
      case 'list':
        return [{ id, type, text: text(b.text), ordered: b.ordered === true }];
      case 'markdown':
        return [{ id, type, text: text(b.text, 20_000) }];
      case 'video':
        return [{ id, type, src: text(b.src, 2000), url: text(b.url, 2000), title: text(b.title, 300) }];
      case 'social': {
        const links = object(b.links);
        return [{ id, type, links: Object.fromEntries(NETWORKS.map((n) => [n, text(links[n], 1000)]).filter(([, v]) => v)) }];
      }
      case 'menu': {
        const links = Array.isArray(b.links) ? b.links.slice(0, 8).map(object) : [];
        return [{ id, type, links: links.map((l) => ({ label: text(l.label, 60), url: text(l.url, 2000) })) }];
      }
      case 'coupon':
        return [{ id, type, code: text(b.code, 60), text: text(b.text, 300), note: text(b.note, 300) }];
      case 'table': {
        const rows = Array.isArray(b.rows) ? b.rows.slice(0, 40).map(object) : [];
        return [{ id, type, rows: rows.map((r) => ({ label: text(r.label, 200), value: text(r.value, 1000) })), total: b.total === true }];
      }
      case 'rating':
        return [{ id, type, text: text(b.text, 300), url: text(b.url, 2000) }];
      case 'gallery': {
        const given = Array.isArray(b.pictures) ? b.pictures.slice(0, 3).map(object) : [];
        const pictures = given.map((p) => ({ src: text(p.src, 2000), alt: text(p.alt, 300), href: text(p.href, 2000) }));
        // Two at least: one alone is an image.
        while (pictures.length < 2) pictures.push({ src: '', alt: '', href: '' });
        return [{ id, type, pictures }];
      }
      case 'divider':
        return [{ id, type }];
      case 'spacer':
        return [{ id, type, size: oneOf(b.size, SIZES, 'md') }];
      case 'html':
        return [{ id, type, html: text(b.html, 100_000) }];
      case 'section':
        return [{ id, type, look: oneOf(b.look, LOOKS, 'gray'), blocks: readBlocks(b.blocks, 'section') }];
      case 'columns': {
        const widths = oneOf(b.widths, WIDTHS, '1-1');
        const columns = Array.isArray(b.columns) ? b.columns : [];
        return [{ id, type, widths, columns: partsOf(widths).map((_, i) => readBlocks(columns[i], 'columns')) }];
      }
      case 'custom': {
        const kind = text(b.kind, 60);
        const data = json(b.data);
        return kind ? [{ id, type, kind, data: data && typeof data === 'object' && !Array.isArray(data) ? data : {} }] : [];
      }
    }
  });
}
const LAYOUT_OR_BLOCK = new Set<string>(BLOCK_TYPES);

/** A theme as it was given, over the default: each colour a colour, each size a size. */
export function readTheme(given: unknown): Theme {
  const t = object(given);
  const within = (v: unknown, least: number, most: number, otherwise: number) => (typeof v === 'number' && v >= least && v <= most ? Math.round(v) : otherwise);
  return {
    accent: color(t.accent) ?? DEFAULT_THEME.accent,
    background: color(t.background) ?? DEFAULT_THEME.background,
    card: color(t.card) ?? DEFAULT_THEME.card,
    ink: color(t.ink) ?? DEFAULT_THEME.ink,
    font: text(t.font, 200).replace(/[;{}<>]/g, '') || DEFAULT_THEME.font,
    width: within(t.width, 320, 800, DEFAULT_THEME.width),
    radius: within(t.radius, 0, 32, DEFAULT_THEME.radius),
    name: text(t.name, 120),
    logo: text(t.logo, 2000) || null,
  };
}

/** An email as it was given: its subject, its line after it, its theme and its blocks. */
export function readEmail(given: unknown): Email {
  const e = object(given);
  return { subject: text(e.subject, 300), preheader: text(e.preheader, 300), theme: readTheme(e.theme), blocks: readBlocks(e.blocks) };
}
