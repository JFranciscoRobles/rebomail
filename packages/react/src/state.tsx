// What the editor knows as an email is written: the email, and what was
// before it to undo (what is typed in one field at a time counts as one
// change); the block chosen; what is being dragged and where it may fall;
// the blocks there are to put (those of Rebomail, and the application's own,
// registered with how they look and what they ask); and what the email lacks.
// `MailProvider` keeps it; `useMail` gives it and every way to change it.

import {
  type Block,
  type BlockOf,
  type BlockType,
  blankEmail,
  type CustomBlock,
  type CustomData,
  duplicateBlock,
  type Email,
  findBlock,
  insertBlock,
  type Locale,
  makeBlock,
  mayPut,
  moveBlock,
  type Place,
  type Problem,
  problemsOf,
  removeBlock,
  type Theme,
  updateBlock,
  whereIs,
} from '@rebomail/core';
import { type ComponentType, createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { WORDS, type Words } from './i18n';
import { Icon, type IconName } from './icons';

/** What a custom block looks like on the email being written: its data, and the way to change it. */
export interface CustomLookProps {
  block: BlockOf<'custom'>;
  theme: Theme;
  /** How wide it may be, in pixels: the email's, a section's or a column's. */
  width: number;
  update: (data: CustomData) => void;
}

/** One of the application's own blocks: its name and place in the palette, its data as it starts, how it is drawn, and what it asks. */
export interface EditorBlock {
  kind: string;
  label: string;
  /** The group of the palette it goes in; its own one if none. */
  group?: string;
  icon?: ReactNode;
  data?: () => CustomData;
  /** Its HTML and text in the email, and whether it has what it needs: as `renderEmail` draws it. */
  render: CustomBlock;
  /** How it looks while the email is written; its HTML if none. */
  Look?: ComponentType<CustomLookProps>;
  /** What of it is set in the panel. */
  Fields?: ComponentType<CustomLookProps>;
}

/** A block of the palette: built in, or one of the application's. */
export interface PaletteEntry {
  id: string;
  group: string;
  label: string;
  icon: ReactNode;
  type: BlockType;
  make: () => Block;
}

/** What is being dragged: a block of the palette, or one already in the email. */
export type Dragged = { entry: string; type: BlockType } | { id: string; type: BlockType };

const BUILT_IN: [keyof Words['groups'], Exclude<BlockType, 'custom'>[]][] = [
  ['text', ['heading', 'text', 'list', 'callout', 'quote', 'table', 'markdown']],
  ['media', ['hero', 'image', 'gallery', 'video']],
  ['layout', ['section', 'columns']],
  ['actions', ['button', 'menu', 'coupon', 'rating', 'social']],
  ['design', ['divider', 'spacer', 'html']],
];
const ICONS: Record<BlockType, IconName> = {
  heading: 'heading',
  text: 'text',
  button: 'button',
  image: 'image',
  hero: 'hero',
  callout: 'callout',
  quote: 'quote',
  list: 'list',
  markdown: 'markdown',
  video: 'video',
  social: 'social',
  menu: 'menu',
  coupon: 'coupon',
  table: 'table',
  rating: 'rating',
  gallery: 'gallery',
  divider: 'divider',
  spacer: 'spacer',
  html: 'html',
  section: 'section',
  columns: 'columns',
  custom: 'custom',
};
export const iconOf = (type: BlockType) => <Icon name={ICONS[type]} />;

export interface MailState {
  email: Email;
  locale: Locale;
  words: Words;
  /** The application's own blocks, by their kind. */
  custom: Record<string, EditorBlock>;
  /** How each custom kind is drawn, as `renderEmail` and `problemsOf` take it. */
  renderers: Record<string, CustomBlock>;
  palette: PaletteEntry[];
  problems: Problem[];

  selected: string | null;
  select: (id: string | null) => void;
  /** The name of a block, as the palette says it. */
  labelOf: (block: Block) => string;

  dragged: Dragged | null;
  drag: (d: Dragged | null) => void;
  canDrop: (place: Place) => boolean;
  /** What is dragged, put at `index` of the list at `place`. */
  drop: (place: Place, index: number) => void;

  /** The whole email as it is now. `merge`: what was typed in the same field a moment ago is one change with this. */
  set: (email: Email, merge?: string) => void;
  setSubject: (subject: string) => void;
  setPreheader: (preheader: string) => void;
  setTheme: (patch: Partial<Theme>) => void;
  /** A block of the palette (by its id) or a block made, at a place; after the one chosen if none, or at the end. Its id. */
  add: (what: string | Block, at?: { place: Place; index: number }) => string | undefined;
  update: (id: string, patch: Partial<Block>, merge?: string) => void;
  remove: (id: string) => void;
  move: (id: string, place: Place, index: number) => void;
  duplicate: (id: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const MailContext = createContext<MailState | null>(null);

/** The editor's state and the ways to change it: inside a `MailProvider`. */
export function useMail(): MailState {
  const mail = useContext(MailContext);
  if (!mail) throw new Error('useMail is used inside a <MailProvider>.');
  return mail;
}

/** The block chosen, and the way to choose another. */
export function useSelection() {
  const { selected, select, email } = useMail();
  return { selected, block: selected ? findBlock(email.blocks, selected) : undefined, select };
}

export interface MailProviderProps {
  /** The email to write; a different one given later starts over (its undoing too). */
  email?: Email;
  onChange?: (email: Email) => void;
  locale?: Locale;
  /** The application's own blocks. */
  blocks?: EditorBlock[];
  children?: ReactNode;
}

interface History {
  present: Email;
  past: Email[];
  future: Email[];
  merge?: string;
  at: number;
}
/** How long, typing in one field, is still one change. */
const MERGE_FOR = 1500;
/** How many changes back may be undone. */
const KEPT = 200;

export function MailProvider({ email: given, onChange, locale = 'en', blocks = [], children }: MailProviderProps) {
  const [history, setHistory] = useState<History>(() => ({ present: given ?? blankEmail(), past: [], future: [], at: 0 }));
  const [selected, select] = useState<string | null>(null);
  const [dragged, drag] = useState<Dragged | null>(null);
  const emitted = useRef<Email | undefined>(given);
  const changed = useRef(onChange);
  changed.current = onChange;

  // Another email given: it, from the start.
  useEffect(() => {
    if (given && given !== emitted.current) {
      emitted.current = given;
      setHistory({ present: given, past: [], future: [], at: 0 });
      select(null);
    }
  }, [given]);

  const commit = useCallback((next: Email | ((now: Email) => Email), merge?: string) => {
    setHistory((h) => {
      const email = typeof next === 'function' ? next(h.present) : next;
      if (email === h.present) return h;
      const now = Date.now();
      const together = merge !== undefined && merge === h.merge && now - h.at < MERGE_FOR;
      emitted.current = email;
      queueMicrotask(() => changed.current?.(email));
      return { present: email, past: together ? h.past : [...h.past, h.present].slice(-KEPT), future: [], merge, at: now };
    });
  }, []);

  const email = history.present;
  const words = WORDS[locale];
  const custom = useMemo(() => Object.fromEntries(blocks.map((b) => [b.kind, b])), [blocks]);
  const renderers = useMemo(() => Object.fromEntries(blocks.map((b) => [b.kind, b.render])), [blocks]);
  const palette = useMemo<PaletteEntry[]>(
    () => [
      ...BUILT_IN.flatMap(([group, types]) => types.map((type) => ({ id: type, group: words.groups[group], label: words.blocks[type], icon: iconOf(type), type, make: () => makeBlock(type) }))),
      ...blocks.map((b) => ({
        id: `custom:${b.kind}`,
        group: b.group ?? words.groups.own,
        label: b.label,
        icon: b.icon ?? iconOf('custom'),
        type: 'custom' as const,
        make: () => makeBlock('custom', { kind: b.kind, data: b.data?.() ?? {} }),
      })),
    ],
    [blocks, words],
  );
  const problems = useMemo(() => problemsOf(email, { custom: renderers }), [email, renderers]);
  const labelOf = useCallback((b: Block) => (b.type === 'custom' ? (custom[b.kind]?.label ?? b.kind) : words.blocks[b.type]), [custom, words]);

  const state: MailState = {
    email,
    locale,
    words,
    custom,
    renderers,
    palette,
    problems,
    selected,
    select,
    labelOf,
    dragged,
    drag,
    canDrop: (place) => !!dragged && mayPut(email.blocks, 'id' in dragged ? { id: dragged.id, type: dragged.type } : { type: dragged.type }, place),
    drop: (place, index) => {
      if (!dragged) return;
      if ('id' in dragged) commit((e) => ({ ...e, blocks: moveBlock(e.blocks, dragged.id, place, index) }));
      else state.add(dragged.entry, { place, index });
      drag(null);
    },
    set: commit,
    setSubject: (subject) => commit((e) => ({ ...e, subject }), 'subject'),
    setPreheader: (preheader) => commit((e) => ({ ...e, preheader }), 'preheader'),
    setTheme: (patch) => commit((e) => ({ ...e, theme: { ...e.theme, ...patch } }), `theme:${Object.keys(patch).join()}`),
    add: (what, at) => {
      const block = typeof what === 'string' ? palette.find((p) => p.id === what)?.make() : what;
      if (!block) return;
      const after = !at && selected ? whereIs(email.blocks, selected) : undefined;
      const place = at?.place ?? (after && mayPut(email.blocks, block, after.place) ? after.place : { parent: null });
      const index = at?.index ?? (after && place === after.place ? after.index + 1 : email.blocks.length);
      const next = insertBlock(email.blocks, place, index, block);
      if (next === email.blocks) return;
      commit({ ...email, blocks: next });
      select(block.id);
      return block.id;
    },
    update: (id, patch, merge) => commit((e) => ({ ...e, blocks: updateBlock(e.blocks, id, patch) }), merge && `${id}:${merge}`),
    remove: (id) => {
      commit((e) => ({ ...e, blocks: removeBlock(e.blocks, id) }));
      if (selected && (selected === id || !findBlock(removeBlock(email.blocks, id), selected))) select(null);
    },
    move: (id, place, index) => commit((e) => ({ ...e, blocks: moveBlock(e.blocks, id, place, index) })),
    duplicate: (id) => {
      const { blocks: next, copy } = duplicateBlock(email.blocks, id);
      if (!copy) return;
      commit({ ...email, blocks: next });
      select(copy.id);
    },
    undo: () =>
      setHistory((h) => {
        const before = h.past.at(-1);
        if (!before) return h;
        emitted.current = before;
        queueMicrotask(() => changed.current?.(before));
        return { present: before, past: h.past.slice(0, -1), future: [h.present, ...h.future], at: 0 };
      }),
    redo: () =>
      setHistory((h) => {
        const [after, ...rest] = h.future;
        if (!after) return h;
        emitted.current = after;
        queueMicrotask(() => changed.current?.(after));
        return { present: after, past: [...h.past, h.present], future: rest, at: 0 };
      }),
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };

  return <MailContext.Provider value={state}>{children}</MailContext.Provider>;
}
