// An email made into what an inbox reads: HTML in tables, each element with
// its style on it (many inboxes read no <style>), at most as wide as its theme
// says, its columns one under another on a phone; and its text, for those that
// show no HTML. What is the sender's is given to it: the values of the
// variables, what each link goes through (to count the clicks), the address
// to stop receiving them, a picture that counts the opening, the words at the
// foot, and how to draw the blocks of the application's own.

import { partsOf, type Block, type BlockOf, type Email, type Network, NETWORKS, type Theme } from './model';
import { escapeHtml as esc, fill, inlineHtml, inlineText, type Linker, safeUrl } from './text';

export type Locale = 'en' | 'es';

/** How a custom block is drawn: its HTML at a width, its text, and whether it has what it needs. */
export interface CustomBlock {
  html(block: BlockOf<'custom'>, ctx: RenderContext): string;
  text?(block: BlockOf<'custom'>, ctx: RenderContext): string;
  complete?(block: BlockOf<'custom'>): boolean;
}

export interface RenderOptions {
  /** The values of the variables: `{ name: 'Ana' }` for `{name}`. */
  values?: Record<string, string>;
  /** What each link goes through: to count its clicks. As it is, if not given. */
  link?: Linker;
  /** Where an address that starts with `/` is: `https://example.com`. */
  base?: string;
  /** Words under the email, as text with its marks: who sends it, why it comes. */
  footer?: string;
  /** Where to stop receiving them: linked under the footer. */
  unsubscribe?: string;
  /** A picture's address that counts the opening when it is loaded. */
  pixel?: string;
  locale?: Locale;
  /** How to draw the custom blocks, by their kind. */
  custom?: Record<string, CustomBlock>;
}

/** The inks of the words: on the email, and inside a dark section. */
export interface Inks {
  text: string;
  strong: string;
  soft: string;
  faint: string;
}
const DARK: Inks = { text: '#e4e4e7', strong: '#ffffff', soft: '#d4d4d8', faint: '#a1a1aa' };

/** What a block is drawn with: how wide it may be, the theme, its inks, and the ways to its words and links. */
export interface RenderContext {
  width: number;
  theme: Theme;
  inks: Inks;
  locale: Locale;
  /** A text with its variables filled. */
  fill(text: string): string;
  /** A link as it goes in the email: whole, and through what counts the clicks. */
  link(url: string): string;
  /** An address made whole: `/…` on the base. */
  absolute(url: string): string;
  /** A text with its variables filled and its marks as HTML. */
  inline(text: string): string;
  /** A button: its words, where it goes, its colour (the accent if none). */
  button(label: string, url: string, color?: string | null): string;
}

const WORDS: Record<Locale, { unsubscribe: string; video: string; website: string; stars: (n: number) => string }> = {
  en: { unsubscribe: 'Unsubscribe', video: 'Watch the video', website: 'Website', stars: (n) => `${n} ${n === 1 ? 'star' : 'stars'}` },
  es: { unsubscribe: 'Ya no quiero recibir estos correos', video: 'Ver el video', website: 'Sitio web', stars: (n) => `${n} ${n === 1 ? 'estrella' : 'estrellas'}` },
};
/** Where a star of a rating goes: its address, `{score}` its number. */
export const starUrl = (url: string, score: number) => url.replace(/\{\s*score\s*\}/g, String(score));
const NETWORK_NAMES: Record<Exclude<Network, 'website'>, string> = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', linkedin: 'LinkedIn', x: 'X' };

const TONES: Record<'green' | 'amber' | 'gray', [string, string]> = { green: ['#ecfdf5', '#047857'], amber: ['#fffbeb', '#b45309'], gray: ['#f4f4f5', '#3f3f46'] };
const SPACES = { sm: 12, md: 28, lg: 48 };
/** The light of a colour, as a colour of its own: inboxes do not mix colours. */
const light = (hex: string, amount = 0.09) => {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  const mix = (c: number) =>
    Math.round(c * amount + 255 * (1 - amount))
      .toString(16)
      .padStart(2, '0');
  return `#${mix(r)}${mix(g)}${mix(b)}`;
};

const table = (inner: string, style = '') => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;${style}">${inner}</table>`;

/**
 * HTML written by hand, as it may go in an email: without what no inbox runs and only does harm (scripts, frames,
 * forms, objects, handlers of events, `javascript:` addresses), its variables filled, its links through `link`.
 */
export function cleanHtml(html: string, ctx: Pick<RenderContext, 'fill' | 'link' | 'absolute'>) {
  return ctx
    .fill(html)
    .replace(/<(script|style|iframe|frame|frameset|object|embed|applet|form|base|meta|link|svg|math)\b[\s\S]*?(<\/\1\s*>|\/?>)/gi, '')
    .replace(/<\/?(input|button|select|textarea|frame)\b[^>]*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+srcdoc\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src|background|action|formaction)\s*=\s*(["'])\s*(javascript|vbscript|data:text):[^"']*\2/gi, '$1="#"')
    .replace(/href\s*=\s*(["'])((?:https?:\/\/|\/)[^"']*)\1/gi, (_w, _q: string, url: string) => `href="${esc(ctx.link(url.replace(/&amp;/g, '&')))}"`)
    .replace(/src\s*=\s*(["'])(\/(?!\/)[^"']*)\1/gi, (_w, _q: string, url: string) => `src="${esc(ctx.absolute(url))}"`);
}

/** A text written as Markdown, as an email reads it: headings, lists, quotes, rules, and the marks of each line. */
function markdown(text: string, ctx: RenderContext) {
  const out: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const p = `margin:0 0 14px;font-size:16px;line-height:1.6;color:${ctx.inks.text};`;
  const close = () => {
    if (!list) return;
    const tag = list.ordered ? 'ol' : 'ul';
    out.push(`<${tag} style="${p}padding-left:22px;">${list.items.map((i) => `<li style="margin:0 0 4px;">${i}</li>`).join('')}</${tag}>`);
    list = null;
  };
  for (const raw of ctx.fill(text).split('\n')) {
    const line = raw.trimEnd();
    const item = line.match(/^\s*(?:([-*])|(\d+)[.)])\s+(.*)$/);
    if (item) {
      const ordered = !!item[2];
      if (list && list.ordered !== ordered) close();
      list ??= { ordered, items: [] };
      list.items.push(inlineHtml(item[3], ctx.link, ctx.theme.accent));
      continue;
    }
    close();
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(
        `<h${level + 1} style="margin:14px 0 8px;font-size:${[22, 19, 17][level - 1]}px;line-height:1.3;color:${ctx.inks.strong};">${inlineHtml(heading[2], ctx.link, ctx.theme.accent)}</h${level + 1}>`,
      );
    } else if (line.startsWith('> '))
      out.push(`<p style="${p}padding-left:14px;border-left:3px solid ${ctx.theme.accent};color:${ctx.inks.soft};">${inlineHtml(line.slice(2), ctx.link, ctx.theme.accent)}</p>`);
    else if (/^-{3,}$/.test(line.trim())) out.push(`<hr style="border:0;border-top:1px solid #e4e4e7;margin:18px 0;">`);
    else if (line.trim()) out.push(`<p style="${p}">${inlineHtml(line, ctx.link, ctx.theme.accent)}</p>`);
  }
  close();
  return out.join('');
}

/** The paragraphs of a text: a blank line between two, a line break within one. */
const paragraphs = (text: string, ctx: RenderContext, size = 16) =>
  ctx
    .fill(text)
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .map((p) => `<p style="margin:0 0 14px;font-size:${size}px;line-height:1.6;color:${ctx.inks.text};">${inlineHtml(p, ctx.link, ctx.theme.accent)}</p>`)
    .join('');

const picture = (src: string, alt: string, width: number, ctx: RenderContext, extra = '') =>
  `<img src="${esc(ctx.absolute(src))}" alt="${esc(alt)}" width="${width}" style="display:block;width:100%;max-width:${width}px;height:auto;border:0;border-radius:12px;${extra}">`;

/** A block as it goes in the email, at most `ctx.width` pixels wide. */
export function blockHtml(b: Block, ctx: RenderContext, custom: Record<string, CustomBlock> = {}): string {
  const { inks, width } = ctx;
  switch (b.type) {
    case 'heading':
      return b.text ? `<h2 style="margin:6px 0 12px;font-size:24px;line-height:1.3;color:${inks.strong};">${ctx.inline(b.text)}</h2>` : '';
    case 'text':
      return paragraphs(b.text, ctx);
    case 'button':
      return b.label ? ctx.button(b.label, b.url, b.color) : '';
    case 'image': {
      if (!b.src) return '';
      const img = picture(b.src, b.alt, width, ctx, 'margin:4px 0 16px;');
      return b.href && safeUrl(b.href) ? `<a href="${esc(ctx.link(b.href))}">${img}</a>` : img;
    }
    case 'hero': {
      const href = b.url && safeUrl(b.url) ? ctx.link(b.url) : '';
      const img = b.src ? picture(b.src, b.title, width, ctx) : '';
      return `<div style="margin:0 0 20px;">${img && href ? `<a href="${esc(href)}">${img}</a>` : img}${
        b.title ? `<h1 style="margin:18px 0 10px;font-size:28px;line-height:1.2;color:${inks.strong};">${ctx.inline(b.title)}</h1>` : ''
      }${paragraphs(b.text, ctx)}${b.label && b.url ? ctx.button(b.label, b.url) : ''}</div>`;
    }
    case 'callout': {
      if (!b.text.trim()) return '';
      const [bg, fg] = b.tone === 'accent' ? [light(ctx.theme.accent), ctx.theme.accent] : TONES[b.tone];
      const inner = { ...ctx, inks: { ...inks, text: fg } };
      return table(`<tr><td style="background:${bg};border-radius:12px;padding:16px 18px 2px;">${paragraphs(b.text, inner, 15)}</td></tr>`, 'margin:6px 0 18px;');
    }
    case 'quote':
      return b.text.trim()
        ? table(
            `<tr><td style="border-left:4px solid ${ctx.theme.accent};padding:4px 0 4px 18px;"><p style="margin:0 0 8px;font-size:18px;font-style:italic;line-height:1.5;color:${inks.text};">“${ctx.inline(b.text)}”</p>${
              b.author ? `<p style="margin:0;font-size:14px;font-weight:bold;color:${inks.faint};">— ${esc(ctx.fill(b.author))}</p>` : ''
            }</td></tr>`,
            'margin:8px 0 20px;',
          )
        : '';
    case 'list': {
      const items = b.text
        .split('\n')
        .map((l) => l.replace(/^\s*([-*•]|\d+[.)])\s*/, '').trim())
        .filter(Boolean);
      const tag = b.ordered ? 'ol' : 'ul';
      return items.length
        ? `<${tag} style="margin:0 0 16px;padding-left:22px;font-size:16px;line-height:1.6;color:${inks.text};">${items.map((i) => `<li style="margin:0 0 6px;">${ctx.inline(i)}</li>`).join('')}</${tag}>`
        : '';
    }
    case 'markdown':
      return markdown(b.text, ctx);
    case 'video': {
      if (!b.src || !b.url || !safeUrl(b.url)) return '';
      const href = esc(ctx.link(b.url));
      // A picture of it, with the way to play it under: no inbox plays a video.
      return `<a href="${href}" style="display:block;margin:4px 0 6px;text-decoration:none;">${picture(b.src, b.title || WORDS[ctx.locale].video, width, ctx)}</a><p style="margin:0 0 18px;font-size:15px;"><a href="${href}" style="color:${ctx.theme.accent};font-weight:bold;text-decoration:none;">▶ ${esc(ctx.fill(b.title) || WORDS[ctx.locale].video)}</a></p>`;
    }
    case 'social': {
      const given = NETWORKS.filter((n) => b.links[n] && safeUrl(b.links[n]!));
      return given.length
        ? `<p style="margin:10px 0 18px;font-size:14px;text-align:center;">${given
            .map(
              (n) =>
                `<a href="${esc(ctx.link(b.links[n]!))}" style="display:inline-block;margin:0 4px 6px;padding:7px 14px;border-radius:999px;background:#f4f4f5;color:#27272a;font-weight:bold;text-decoration:none;">${n === 'website' ? WORDS[ctx.locale].website : NETWORK_NAMES[n]}</a>`,
            )
            .join('')}</p>`
        : '';
    }
    case 'menu': {
      const links = b.links.filter((l) => l.label.trim() && safeUrl(l.url));
      return links.length
        ? `<p style="margin:0 0 18px;font-size:14px;line-height:1.8;text-align:center;">${links
            .map((l) => `<a href="${esc(ctx.link(l.url))}" style="color:${inks.strong};font-weight:bold;text-decoration:none;">${esc(ctx.fill(l.label))}</a>`)
            .join(`<span style="color:${inks.faint};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>`)}</p>`
        : '';
    }
    case 'coupon':
      return b.code.trim()
        ? table(
            `<tr><td align="center" style="border:2px dashed ${ctx.theme.accent};border-radius:14px;padding:20px 18px;text-align:center;">${
              b.text.trim() ? `<p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:${inks.text};">${ctx.inline(b.text)}</p>` : ''
            }<p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:bold;letter-spacing:3px;color:${ctx.theme.accent};">${esc(ctx.fill(b.code))}</p>${
              b.note.trim() ? `<p style="margin:10px 0 0;font-size:13px;line-height:1.5;color:${inks.faint};">${ctx.inline(b.note)}</p>` : ''
            }</td></tr>`,
            'margin:6px 0 20px;',
          )
        : '';
    case 'table': {
      const rows = b.rows.filter((r) => r.label.trim() || r.value.trim());
      const cells = rows.map((r, i) => {
        const total = b.total && rows.length > 1 && i === rows.length - 1;
        const line = total ? `border-top:2px solid ${inks.strong};font-weight:bold;color:${inks.strong};` : `${i ? 'border-top:1px solid #e4e4e7;' : ''}color:${inks.text};`;
        const td = `padding:9px 0;font-size:15px;line-height:1.5;${line}`;
        return `<tr><td valign="top" style="${td}">${ctx.inline(r.label)}</td><td align="right" valign="top" style="${td}padding-left:12px;text-align:right;">${ctx.inline(r.value)}</td></tr>`;
      });
      return cells.length ? table(cells.join(''), 'margin:4px 0 18px;') : '';
    }
    case 'rating': {
      if (!safeUrl(starUrl(b.url, 1))) return '';
      const stars = [1, 2, 3, 4, 5].map(
        (n) =>
          `<a href="${esc(ctx.link(starUrl(b.url, n)))}" title="${WORDS[ctx.locale].stars(n)}" style="display:inline-block;margin:0 3px;font-size:32px;line-height:1;color:${ctx.theme.accent};text-decoration:none;">★</a>`,
      );
      return `<div style="margin:6px 0 20px;text-align:center;">${
        b.text.trim() ? `<p style="margin:0 0 10px;font-size:17px;font-weight:bold;line-height:1.4;color:${inks.strong};">${ctx.inline(b.text)}</p>` : ''
      }<p style="margin:0;">${stars.join('')}</p></div>`;
    }
    case 'gallery': {
      const given = b.pictures.filter((p) => p.src);
      if (!given.length) return '';
      const gutter = 12;
      const each = Math.floor((width - gutter * (given.length - 1)) / given.length);
      const cells = given.map((p, i) => {
        const img = picture(p.src, p.alt, each, ctx);
        const pad = `padding:0 ${i < given.length - 1 ? gutter / 2 : 0}px 0 ${i > 0 ? gutter / 2 : 0}px;`;
        return `<td class="rm-col" width="${Math.round(100 / given.length)}%" valign="top" style="${pad}">${p.href && safeUrl(p.href) ? `<a href="${esc(ctx.link(p.href))}">${img}</a>` : img}</td>`;
      });
      return table(`<tr>${cells.join('')}</tr>`, 'margin:4px 0 16px;');
    }
    case 'divider':
      return '<hr style="border:0;border-top:1px solid #e4e4e7;margin:18px 0;">';
    case 'spacer':
      return `<div style="height:${SPACES[b.size]}px;line-height:1px;font-size:1px;">&nbsp;</div>`;
    case 'html':
      return b.html.trim() ? `<div style="font-size:16px;line-height:1.6;color:${inks.text};">${cleanHtml(b.html, ctx)}</div>` : '';
    case 'section': {
      const inner = { ...ctx, width: width - 48, inks: b.look === 'dark' ? DARK : inks };
      const look =
        b.look === 'dark' ? 'background:#18181b;' : b.look === 'accent' ? `background:${light(ctx.theme.accent)};` : b.look === 'outline' ? 'border:1px solid #e4e4e7;' : 'background:#f4f4f5;';
      return table(`<tr><td style="${look}border-radius:14px;padding:24px;">${b.blocks.map((x) => blockHtml(x, inner, custom)).join('\n')}</td></tr>`, 'margin:6px 0 20px;');
    }
    case 'columns': {
      const parts = partsOf(b.widths);
      const total = parts.reduce((a, n) => a + n, 0);
      const gutter = 16;
      const room = width - gutter * (parts.length - 1);
      const cells = parts.map((part, i) => {
        const inner = { ...ctx, width: Math.floor((room * part) / total) };
        const pad = `padding:0 ${i < parts.length - 1 ? gutter / 2 : 0}px 0 ${i > 0 ? gutter / 2 : 0}px;`;
        return `<td class="rm-col" width="${Math.round((100 * part) / total)}%" valign="top" style="${pad}">${(b.columns[i] ?? []).map((x) => blockHtml(x, inner, custom)).join('\n')}</td>`;
      });
      return table(`<tr>${cells.join('')}</tr>`, 'margin:4px 0 6px;');
    }
    case 'custom':
      return custom[b.kind]?.html(b, ctx) ?? '';
  }
}

/** A block in the email's text: its words, and where its links go. */
export function blockText(b: Block, ctx: RenderContext, custom: Record<string, CustomBlock> = {}): string {
  const words = (t: string) => inlineText(ctx.fill(t), ctx.link);
  switch (b.type) {
    case 'heading':
      return words(b.text).toUpperCase();
    case 'text':
    case 'callout':
      return words(b.text);
    case 'button':
      return b.label && b.url ? `${words(b.label)}: ${ctx.link(b.url)}` : '';
    case 'image':
      return b.href ? `${b.alt || ''} ${ctx.link(b.href)}`.trim() : '';
    case 'hero':
      return [words(b.title).toUpperCase(), words(b.text), b.label && b.url ? `${words(b.label)}: ${ctx.link(b.url)}` : ''].filter(Boolean).join('\n\n');
    case 'quote':
      return b.text ? `“${words(b.text)}”${b.author ? ` — ${ctx.fill(b.author)}` : ''}` : '';
    case 'list':
      return b.text
        .split('\n')
        .map((l) => l.replace(/^\s*([-*•]|\d+[.)])\s*/, '').trim())
        .filter(Boolean)
        .map((l, i) => `${b.ordered ? `${i + 1}.` : '•'} ${words(l)}`)
        .join('\n');
    case 'markdown':
      return ctx
        .fill(b.text)
        .split('\n')
        .map((l) => inlineText(l.replace(/^#{1,3}\s+/, '').replace(/^>\s+/, ''), ctx.link))
        .join('\n')
        .trim();
    case 'video':
      return b.url ? `${ctx.fill(b.title) || WORDS[ctx.locale].video}: ${ctx.link(b.url)}` : '';
    case 'social':
      return NETWORKS.filter((n) => b.links[n])
        .map((n) => `${n === 'website' ? WORDS[ctx.locale].website : NETWORK_NAMES[n]}: ${ctx.link(b.links[n]!)}`)
        .join('\n');
    case 'menu':
      return b.links
        .filter((l) => l.label.trim() && l.url)
        .map((l) => `${ctx.fill(l.label)}: ${ctx.link(l.url)}`)
        .join('\n');
    case 'coupon':
      return b.code ? [words(b.text), ctx.fill(b.code), words(b.note)].filter(Boolean).join('\n') : '';
    case 'table':
      return b.rows
        .filter((r) => r.label.trim() || r.value.trim())
        .map((r) => `${words(r.label)}: ${words(r.value)}`)
        .join('\n');
    case 'rating':
      return b.url ? [words(b.text), ...[1, 2, 3, 4, 5].map((n) => `${WORDS[ctx.locale].stars(n)}: ${ctx.link(starUrl(b.url, n))}`)].filter(Boolean).join('\n') : '';
    case 'gallery':
      return b.pictures
        .filter((p) => p.src && p.href)
        .map((p) => `${p.alt || ''} ${ctx.link(p.href)}`.trim())
        .join('\n');
    case 'divider':
      return '———';
    case 'spacer':
      return '';
    case 'html':
      return ctx
        .fill(b.html)
        .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '')
        .replace(/<br\s*\/?>|<\/(p|div|tr|h[1-6]|li)>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    case 'section':
      return b.blocks
        .map((x) => blockText(x, ctx, custom))
        .filter(Boolean)
        .join('\n\n');
    case 'columns':
      return b.columns
        .flatMap((c) => c.map((x) => blockText(x, ctx, custom)))
        .filter(Boolean)
        .join('\n\n');
    case 'custom':
      return custom[b.kind]?.text?.(b, ctx) ?? '';
  }
}

/** What the blocks of an email are drawn with, as the options say. */
export function contextOf(email: Email, options: RenderOptions = {}): RenderContext {
  const { theme } = email;
  const base = options.base?.replace(/\/$/, '') ?? '';
  const absolute = (url: string) => (url.startsWith('/') && !url.startsWith('//') ? `${base}${url}` : url);
  const values = options.values ?? {};
  const ctx: RenderContext = {
    width: theme.width - 64,
    theme,
    inks: { text: theme.ink, strong: '#18181b', soft: '#52525b', faint: '#71717a' },
    locale: options.locale ?? 'en',
    fill: (text) => fill(text, values),
    link: (url) => {
      const whole = absolute(fill(url.trim(), values));
      return options.link && /^https?:/i.test(whole) ? options.link(whole) : whole;
    },
    absolute,
    inline: (text) => inlineHtml(fill(text, values), ctx.link, theme.accent),
    // Its own table, as wide as its words: one of the whole width, Outlook would stretch.
    button: (label, url, color) =>
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 18px;"><tr><td style="border-radius:999px;background:${color ?? theme.accent};"><a href="${esc(safeUrl(url) ? ctx.link(url) : '#')}" style="display:inline-block;padding:13px 28px;font-family:${esc(theme.font)};font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">${esc(fill(label, values))}</a></td></tr></table>`,
  };
  return ctx;
}

/** An email whole, as an inbox reads it: its subject, its HTML and its text, filled for the one it goes to. */
export function renderEmail(email: Email, options: RenderOptions = {}) {
  const { theme } = email;
  const ctx = contextOf(email, options);
  const custom = options.custom ?? {};
  const words = WORDS[ctx.locale];
  const subject = ctx.fill(email.subject);
  const preheader = ctx.fill(email.preheader);
  const font = esc(theme.font);
  const head =
    theme.name || theme.logo
      ? `<tr><td style="padding:0 8px 16px;font-family:${font};font-size:18px;font-weight:bold;color:#18181b;">${
          theme.logo ? `<img src="${esc(ctx.absolute(theme.logo))}" alt="" height="36" style="height:36px;width:auto;border:0;vertical-align:middle;margin-right:10px;">` : ''
        }${esc(theme.name)}</td></tr>`
      : '';
  const foot =
    options.footer || options.unsubscribe
      ? `<tr><td style="padding:20px 8px;font-family:${font};font-size:12px;line-height:1.6;color:#71717a;text-align:center;">${
          options.footer ? inlineHtml(ctx.fill(options.footer), ctx.link, '#71717a') : ''
        }${options.unsubscribe ? `${options.footer ? '<br>' : ''}<a href="${esc(options.unsubscribe)}" style="color:#71717a;text-decoration:underline;">${words.unsubscribe}</a>` : ''}</td></tr>`
      : '';
  const pixel = options.pixel ? `<img src="${esc(options.pixel)}" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px;">` : '';
  const html = `<!doctype html>
<html lang="${ctx.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(subject)}</title>
<style>@media (max-width:${theme.width + 20}px){.rm-card{padding:24px 18px!important}.rm-col{display:block!important;width:100%!important;padding:0 0 12px!important}}</style></head>
<body style="margin:0;padding:0;background:${theme.background};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}${'&nbsp;&zwnj;'.repeat(40)}</div>
${table(
  `<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="${theme.width}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${theme.width}px;">
${head}<tr><td class="rm-card" style="background:${theme.card};border-radius:${theme.radius}px;padding:32px;border-top:4px solid ${theme.accent};font-family:${font};">${email.blocks.map((b) => blockHtml(b, ctx, custom)).join('\n')}</td></tr>
${foot}</table>${pixel}
</td></tr>`,
  `background:${theme.background};`,
)}</body></html>`;
  const text = [
    preheader,
    ...email.blocks.map((b) => blockText(b, ctx, custom)),
    [options.footer && inlineText(ctx.fill(options.footer)), options.unsubscribe && `${words.unsubscribe}: ${options.unsubscribe}`].filter(Boolean).join('\n'),
  ]
    .filter(Boolean)
    .join('\n\n');
  return { subject, preheader, html, text };
}
