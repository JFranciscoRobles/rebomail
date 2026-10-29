// Where things are, and the pages of the documentation in the order they are read.

import type { L } from './i18n';

/** Where the code is. One place to change it. */
export const REPO = 'https://github.com/JFranciscoRobles/rebomail';
export const SITE = 'https://rebomail.com';
export const VERSION = '0.1.0';

/** The six pastel pairs, background and text, that take turns on tags and groups. */
export type Pastel = 'blue' | 'yellow' | 'green' | 'pink' | 'purple' | 'orange';
/** Whole class names, so Tailwind finds them. */
export const PASTEL_CLASS: Record<Pastel, string> = {
  blue: 'bg-pastel-blue text-pastel-blue-fg',
  yellow: 'bg-pastel-yellow text-pastel-yellow-fg',
  green: 'bg-pastel-green text-pastel-green-fg',
  pink: 'bg-pastel-pink text-pastel-pink-fg',
  purple: 'bg-pastel-purple text-pastel-purple-fg',
  orange: 'bg-pastel-orange text-pastel-orange-fg',
};

export interface NavItem {
  title: L;
  /** The file in `content/docs`, without `.md`; `index` is `/docs/`. */
  slug: string;
}

/** The pages of the documentation, in the order they are read; each group has its colour in the sidebar. */
export const NAV: { title: L; color: Pastel; items: NavItem[] }[] = [
  {
    title: { en: 'Start', es: 'Empezar' },
    color: 'blue',
    items: [
      { title: { en: 'What is Rebomail', es: 'Qué es Rebomail' }, slug: 'index' },
      { title: { en: 'Getting started', es: 'Primeros pasos' }, slug: 'getting-started' },
    ],
  },
  {
    title: { en: 'Put it in your app', es: 'Ponlo en tu aplicación' },
    color: 'purple',
    items: [
      { title: { en: 'The editor', es: 'El editor' }, slug: 'editor' },
      { title: { en: 'Headless: your own UI', es: 'Headless: tu propia interfaz' }, slug: 'headless' },
      { title: { en: 'Blocks of your own', es: 'Bloques propios' }, slug: 'custom-blocks' },
      { title: { en: 'Styling', es: 'Estilos' }, slug: 'styling' },
    ],
  },
  {
    title: { en: 'Emails', es: 'Correos' },
    color: 'yellow',
    items: [
      { title: { en: 'Blocks and layouts', es: 'Bloques y diseños' }, slug: 'blocks' },
      { title: { en: 'HTML for every inbox', es: 'HTML para toda bandeja' }, slug: 'rendering' },
      { title: { en: 'Before it goes', es: 'Antes de enviarlo' }, slug: 'checks' },
    ],
  },
  {
    title: { en: 'Sending', es: 'Envío' },
    color: 'pink',
    items: [
      { title: { en: 'Sending', es: 'Enviar' }, slug: 'sending' },
      { title: { en: 'Opens, clicks and unsubscribing', es: 'Aperturas, clics y bajas' }, slug: 'tracking' },
    ],
  },
  {
    title: { en: 'Reference', es: 'Referencia' },
    color: 'green',
    items: [
      { title: { en: 'Packages', es: 'Paquetes' }, slug: 'packages' },
      { title: { en: 'API', es: 'API' }, slug: 'api' },
      { title: { en: 'Status and roadmap', es: 'Estado y hoja de ruta' }, slug: 'status' },
    ],
  },
];

export const PAGES = NAV.flatMap((group) => group.items);
/** The group a page is in, for the line above its title. */
export const groupOf = (slug: string) => NAV.find((group) => group.items.some((item) => item.slug === slug));
export const hrefOf = (slug: string) => (slug === 'index' ? '/docs/' : `/docs/${slug}/`);
