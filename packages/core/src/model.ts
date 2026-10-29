// What an email is: a subject, the line some inboxes show after it, a theme
// (its colours, its font, its width, whose it is) and its blocks, one under
// another. Two of them hold others: a section (a box with a background) and a
// row of columns. A block of the application's own (a product, a property,
// the signature of whoever sends it) is a `custom` one: a kind and its data,
// drawn by what the application gives the renderer.
//
// The words of every block are text as written, with three marks of Markdown
// (**bold**, *italic*, [a link](https://…)) and variables in braces ({name}),
// filled for each one it goes to.

export interface Email {
  subject: string;
  /** The line some inboxes show after the subject: a second line to read before opening. */
  preheader: string;
  theme: Theme;
  blocks: Block[];
}

export interface Theme {
  /** #rrggbb of the buttons, the links and what is marked. */
  accent: string;
  /** #rrggbb around the email. */
  background: string;
  /** #rrggbb of the email itself. */
  card: string;
  /** #rrggbb of the words. */
  ink: string;
  /** The fonts, as CSS says them; those every computer has, for inboxes load none. */
  font: string;
  /** How wide the email is at most, in pixels: 600 is what every inbox shows whole. */
  width: number;
  /** How round its corners are, in pixels. */
  radius: number;
  /** Whose it is, on top: a name, and a picture's address beside it. */
  name: string;
  logo: string | null;
}

/** Of a callout: the accent, or green, amber, grey. */
export type Tone = 'accent' | 'green' | 'amber' | 'gray';
/** Of a section: grey, the accent's light, dark (its words light), or only its edge. */
export type Look = 'gray' | 'accent' | 'dark' | 'outline';
/** How wide each column is, as parts of the row: two halves, a third and two, two and a third, three thirds. */
export type Widths = '1-1' | '1-2' | '2-1' | '1-1-1';
export type Size = 'sm' | 'md' | 'lg';
export type Network = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'x' | 'website';
/** A link of a menu: its words and where it goes. */
export interface MenuLink {
  label: string;
  url: string;
}
/** A line of a table: what it is, and its value. */
export interface Row {
  label: string;
  value: string;
}
/** A picture of a gallery: its address, what it shows, where a click goes. */
export interface Picture {
  src: string;
  alt: string;
  href: string;
}

export type Block =
  | { id: string; type: 'heading'; text: string }
  | { id: string; type: 'text'; text: string }
  | { id: string; type: 'button'; label: string; url: string /** #rrggbb; the accent if none. */; color: string | null }
  | { id: string; type: 'image'; src: string; alt: string; href: string }
  | { id: string; type: 'hero'; src: string; title: string; text: string; label: string; url: string }
  | { id: string; type: 'callout'; text: string; tone: Tone }
  | { id: string; type: 'quote'; text: string; author: string }
  | { id: string; type: 'list' /** One item a line. */; text: string; ordered: boolean }
  | { id: string; type: 'markdown'; text: string }
  | { id: string; type: 'video' /** A picture of it: no inbox plays a video. */; src: string; url: string; title: string }
  | { id: string; type: 'social'; links: Partial<Record<Network, string>> }
  | { id: string; type: 'menu' /** Links in a row, as the top of a site. */; links: MenuLink[] }
  | { id: string; type: 'coupon'; code: string; text: string /** Until when, or how it is used. */; note: string }
  | { id: string; type: 'table' /** Its last row a total: bold, a line over it. */; rows: Row[]; total: boolean }
  | {
      id: string;
      type: 'rating';
      text: string;
      /** Where each star goes, `{score}` the star's number: `https://example.com/survey?score={score}`. */
      url: string;
    }
  | { id: string; type: 'gallery' /** Two or three, in a row; one under another on a phone. */; pictures: Picture[] }
  | { id: string; type: 'divider' }
  | { id: string; type: 'spacer'; size: Size }
  | { id: string; type: 'html'; html: string }
  | { id: string; type: 'section'; look: Look; blocks: Block[] }
  | { id: string; type: 'columns'; widths: Widths; columns: Block[][] }
  | { id: string; type: 'custom' /** Which of the application's own. */; kind: string; data: CustomData };

export type BlockType = Block['type'];
/** The block of a type. */
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>;
/** What a custom block keeps: anything JSON says. */
export type CustomData = { [key: string]: Json };
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export const TONES: readonly Tone[] = ['accent', 'green', 'amber', 'gray'];
export const LOOKS: readonly Look[] = ['gray', 'accent', 'dark', 'outline'];
export const WIDTHS: readonly Widths[] = ['1-1', '1-2', '2-1', '1-1-1'];
export const SIZES: readonly Size[] = ['sm', 'md', 'lg'];
export const NETWORKS: readonly Network[] = ['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'x', 'website'];
export const BLOCK_TYPES: readonly BlockType[] = [
  'heading',
  'text',
  'button',
  'image',
  'hero',
  'callout',
  'quote',
  'list',
  'markdown',
  'video',
  'social',
  'menu',
  'coupon',
  'table',
  'rating',
  'gallery',
  'divider',
  'spacer',
  'html',
  'section',
  'columns',
  'custom',
];

export const DEFAULT_THEME: Theme = {
  accent: '#3b63fb',
  background: '#f4f4f5',
  card: '#ffffff',
  ink: '#27272a',
  font: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  width: 600,
  radius: 16,
  name: '',
  logo: null,
};

/** The parts of each row of columns, as numbers: `1-2` is [1, 2]. */
export const partsOf = (widths: Widths) => widths.split('-').map(Number);
