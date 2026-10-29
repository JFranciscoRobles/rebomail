// What an email lacks before it goes: a subject, something in it, a block
// without what it needs to show anything (a picture without its address, a
// button without words), a section or a column left empty, a link that goes
// nowhere an inbox follows, a variable nobody will fill. Each said by a code,
// for the application, and in words, in English or Spanish.

import type { Block, BlockType, Email } from './model';
import { type CustomBlock, type Locale, starUrl } from './render';
import { safeUrl, variablesIn } from './text';
import { walk } from './tree';

export type Problem =
  | { code: 'no-subject' }
  | { code: 'no-blocks' }
  | { code: 'incomplete'; block: string; type: BlockType }
  | { code: 'empty-layout'; block: string; type: 'section' | 'columns'; column?: number }
  | { code: 'bad-link'; block: string; type: BlockType; url: string }
  | { code: 'unknown-variable'; name: string };

/** Whether a block has what it needs to show something. A custom one says so itself; it is complete if it does not. */
export function isComplete(b: Block, custom: Record<string, CustomBlock> = {}): boolean {
  switch (b.type) {
    case 'heading':
    case 'text':
    case 'callout':
    case 'quote':
    case 'list':
    case 'markdown':
      return !!b.text.trim();
    case 'button':
      return !!b.label.trim() && !!b.url.trim();
    case 'image':
      return !!b.src;
    case 'hero':
      return !!b.title.trim();
    case 'video':
      return !!b.src && !!b.url;
    case 'social':
      return Object.values(b.links).some(Boolean);
    case 'html':
      return !!b.html.trim();
    case 'menu':
      return b.links.some((l) => l.label.trim() && l.url.trim());
    case 'coupon':
      return !!b.code.trim();
    case 'table':
      return b.rows.some((r) => r.label.trim() || r.value.trim());
    case 'rating':
      return !!b.url.trim();
    case 'gallery':
      return b.pictures.every((p) => p.src);
    case 'section':
    case 'columns':
    case 'divider':
    case 'spacer':
      return true;
    case 'custom':
      return custom[b.kind]?.complete?.(b) ?? true;
  }
}

/** The links a block has: where each of its parts goes. */
const linksOf = (b: Block): string[] => {
  switch (b.type) {
    case 'button':
    case 'hero':
    case 'video':
      return [b.url];
    case 'image':
      return [b.href];
    case 'social':
      return Object.values(b.links).filter((v): v is string => !!v);
    case 'menu':
      return b.links.map((l) => l.url);
    case 'rating':
      return [starUrl(b.url, 1)];
    case 'gallery':
      return b.pictures.map((p) => p.href);
    case 'coupon':
    case 'table':
      return wordsOf(b).flatMap((w) => [...w.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)].map((m) => m[1]));
    case 'text':
    case 'callout':
    case 'quote':
    case 'list':
    case 'markdown':
      return [...b.text.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)].map((m) => m[1]);
    default:
      return [];
  }
};

/** The words of a block, where its variables may be. */
const wordsOf = (b: Block): string[] => {
  switch (b.type) {
    case 'heading':
    case 'text':
    case 'callout':
    case 'list':
    case 'markdown':
      return [b.text];
    case 'quote':
      return [b.text, b.author];
    case 'button':
      return [b.label, b.url];
    case 'hero':
      return [b.title, b.text, b.label, b.url];
    case 'video':
      return [b.title, b.url];
    case 'html':
      return [b.html];
    case 'menu':
      return b.links.flatMap((l) => [l.label, l.url]);
    case 'coupon':
      return [b.code, b.text, b.note];
    case 'table':
      return b.rows.flatMap((r) => [r.label, r.value]);
    case 'rating':
      return [b.text, starUrl(b.url, 1)];
    case 'gallery':
      return b.pictures.flatMap((p) => [p.alt, p.href]);
    default:
      return [];
  }
};

/**
 * What an email lacks, in the order it is read. `variables`, the names that will be filled: any other one said in it is
 * a problem; without them, none is.
 */
export function problemsOf(email: Email, options: { custom?: Record<string, CustomBlock>; variables?: string[] } = {}): Problem[] {
  const out: Problem[] = [];
  if (!email.subject.trim()) out.push({ code: 'no-subject' });
  if (!email.blocks.length) out.push({ code: 'no-blocks' });
  for (const b of walk(email.blocks)) {
    if (b.type === 'section' && !b.blocks.length) out.push({ code: 'empty-layout', block: b.id, type: 'section' });
    if (b.type === 'columns') b.columns.forEach((c, column) => !c.length && out.push({ code: 'empty-layout', block: b.id, type: 'columns', column }));
    if (!isComplete(b, options.custom)) out.push({ code: 'incomplete', block: b.id, type: b.type });
    for (const url of linksOf(b)) if (url.trim() && !safeUrl(url.replace(/\{\s*[\w.-]+\s*\}/g, 'x'))) out.push({ code: 'bad-link', block: b.id, type: b.type, url });
  }
  if (options.variables) {
    const known = new Set(options.variables);
    const said = [email.subject, email.preheader, ...walk(email.blocks).flatMap(wordsOf)].flatMap(variablesIn);
    for (const name of new Set(said)) if (!known.has(name)) out.push({ code: 'unknown-variable', name });
  }
  return out;
}

const TYPE_NAMES: Record<Locale, Record<BlockType, string>> = {
  en: {
    heading: 'heading',
    text: 'text',
    button: 'button',
    image: 'image',
    hero: 'cover',
    callout: 'callout',
    quote: 'quote',
    list: 'list',
    markdown: 'Markdown',
    video: 'video',
    social: 'social links',
    menu: 'menu',
    coupon: 'coupon',
    table: 'table',
    rating: 'rating',
    gallery: 'gallery',
    divider: 'divider',
    spacer: 'space',
    html: 'HTML',
    section: 'section',
    columns: 'columns',
    custom: 'block',
  },
  es: {
    heading: 'título',
    text: 'texto',
    button: 'botón',
    image: 'imagen',
    hero: 'portada',
    callout: 'aviso',
    quote: 'cita',
    list: 'lista',
    markdown: 'Markdown',
    video: 'video',
    social: 'redes sociales',
    menu: 'menú',
    coupon: 'cupón',
    table: 'tabla',
    rating: 'calificación',
    gallery: 'galería',
    divider: 'separador',
    spacer: 'espacio',
    html: 'HTML',
    section: 'sección',
    columns: 'columnas',
    custom: 'bloque',
  },
};

/** A problem in words, to show whoever writes the email. */
export function describeProblem(p: Problem, locale: Locale = 'en'): string {
  const es = locale === 'es';
  const name = 'type' in p ? TYPE_NAMES[locale][p.type] : '';
  switch (p.code) {
    case 'no-subject':
      return es ? 'Falta el asunto.' : 'The subject is missing.';
    case 'no-blocks':
      return es ? 'El correo está vacío.' : 'The email is empty.';
    case 'incomplete':
      return es ? `Le falta algo al bloque «${name}».` : `The ${name} block is missing something.`;
    case 'empty-layout':
      return p.type === 'columns' ? (es ? `La columna ${(p.column ?? 0) + 1} está vacía.` : `Column ${(p.column ?? 0) + 1} is empty.`) : es ? 'Hay una sección vacía.' : 'A section is empty.';
    case 'bad-link':
      return es ? `La liga «${p.url}» no es una dirección que se pueda abrir.` : `The link “${p.url}” is not an address that can be opened.`;
    case 'unknown-variable':
      return es ? `Nadie llena la variable {${p.name}}.` : `Nothing fills the variable {${p.name}}.`;
  }
}
