// The words of the editor, in English and Spanish.

import type { BlockType, Locale, Look, Network, Size, Tone } from '@rebomail/core';

export interface Words {
  groups: Record<'text' | 'media' | 'actions' | 'layout' | 'design' | 'own', string>;
  blocks: Record<Exclude<BlockType, 'custom'>, string>;
  tones: Record<Tone, string>;
  looks: Record<Look, string>;
  sizes: Record<Size, string>;
  networks: Record<Network, string>;
  edit: string;
  desktop: string;
  phone: string;
  undo: string;
  redo: string;
  from: string;
  subject: string;
  preheader: string;
  dropHere: string;
  dragHere: string;
  dragFromPalette: string;
  paletteHelp: string;
  move: string;
  up: string;
  down: string;
  duplicate: string;
  remove: string;
  help: string[];
  email: string;
  accent: string;
  background: string;
  name: string;
  logo: string;
  width: string;
  widths: string;
  look: string;
  tone: string;
  size: string;
  numbered: string;
  column: (n: number) => string;
  phoneStacks: string;
  dragInto: string;
  missing: Partial<Record<BlockType, string>>;
  fields: {
    url: string;
    label: string;
    picture: string;
    alt: string;
    href: string;
    title: string;
    text: string;
    author: string;
    video: string;
    cover: string;
    color: string;
    html: string;
    htmlHelp: string;
    markdown: string;
    list: string;
    link: string;
    addLink: string;
    code: string;
    offer: string;
    note: string;
    row: string;
    value: string;
    addRow: string;
    total: string;
    question: string;
    stars: string;
    starsHelp: string;
    pictures: string;
    nth: (n: number) => string;
    removeOne: string;
  };
  problems: string;
  noProblems: string;
}

const en: Words = {
  groups: { text: 'Text', media: 'Media', actions: 'Actions', layout: 'Layout', design: 'Design', own: 'Your blocks' },
  blocks: {
    heading: 'Heading',
    text: 'Text',
    button: 'Button',
    image: 'Image',
    hero: 'Cover',
    callout: 'Callout',
    quote: 'Quote',
    list: 'List',
    markdown: 'Markdown',
    video: 'Video',
    social: 'Social links',
    menu: 'Menu',
    coupon: 'Coupon',
    table: 'Table',
    rating: 'Rating',
    gallery: 'Gallery',
    divider: 'Divider',
    spacer: 'Space',
    html: 'HTML',
    section: 'Section',
    columns: 'Columns',
  },
  tones: { accent: 'Accent', green: 'Green', amber: 'Amber', gray: 'Grey' },
  looks: { gray: 'Grey', accent: 'Accent', dark: 'Dark', outline: 'Outline' },
  sizes: { sm: 'Small', md: 'Medium', lg: 'Large' },
  networks: { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', linkedin: 'LinkedIn', x: 'X', website: 'Website' },
  edit: 'Edit',
  desktop: 'Desktop',
  phone: 'Phone',
  undo: 'Undo',
  redo: 'Redo',
  from: 'From',
  subject: 'Write the subject',
  preheader: 'The line read after the subject',
  dropHere: 'Drop it here',
  dragHere: 'Drag blocks here',
  dragFromPalette: 'Drag blocks from the left',
  paletteHelp: 'Drag a block onto the email, or click it to put it after the one chosen.',
  move: 'Drag to move',
  up: 'Move up',
  down: 'Move down',
  duplicate: 'Duplicate',
  remove: 'Remove',
  help: [
    'Click a block to choose it: its words are written right there, the rest (links, pictures, colours) here.',
    'Drag it by its handle to move it, into a section or a column too.',
    '⌘B bold, ⌘I italic, ⌘K a link. {name} is filled for each one it goes to.',
    'Delete removes the block chosen, Esc lets it go, ⌘Z undoes.',
  ],
  email: 'Email',
  accent: 'Accent',
  background: 'Background',
  name: 'Name on top',
  logo: 'Logo (address)',
  width: 'Width',
  widths: 'Widths',
  look: 'Background',
  tone: 'Tone',
  size: 'Size',
  numbered: 'Numbered',
  column: (n) => `Column ${n}`,
  phoneStacks: 'On a phone, the columns go one under another.',
  dragInto: 'Drag blocks into it on the email.',
  missing: {
    image: 'Image: give its address in the panel',
    hero: 'Cover picture: give its address in the panel',
    video: 'Video: give its link and its picture in the panel',
    social: 'Social links: give them in the panel',
    menu: 'Menu: give its links in the panel',
    gallery: 'Picture: give its address in the panel',
  },
  fields: {
    url: 'Link (https://… or /…)',
    label: 'Words of the button',
    picture: 'Picture (https://…)',
    alt: 'What it shows, for who sees no pictures',
    href: 'Link when clicked (optional)',
    title: 'Title',
    text: 'Text',
    author: 'Who said it',
    video: 'Link of the video',
    cover: 'Picture of the video (https://…)',
    color: 'Colour',
    html: 'Your HTML',
    htmlHelp: 'Use tables and style="…" on each element: many inboxes read no <style>. Scripts, frames and forms are taken out; links count clicks.',
    markdown: '## A heading, **bold**, - lists, > quotes',
    list: 'One item a line',
    link: 'Words of the link',
    addLink: 'Add a link',
    code: 'Code',
    offer: 'What it gives',
    note: 'Until when, or how it is used',
    row: 'What it is',
    value: 'Its value',
    addRow: 'Add a row',
    total: 'The last row is a total',
    question: 'The question',
    stars: 'Where each star goes',
    starsHelp: '{score} is the star’s number, 1 to 5: https://example.com/survey?score={score}. Each click is counted as any link.',
    pictures: 'Pictures',
    nth: (n) => `Picture ${n}`,
    removeOne: 'Remove',
  },
  problems: 'Before it goes',
  noProblems: 'Nothing missing.',
};

const es: Words = {
  groups: { text: 'Texto', media: 'Medios', actions: 'Acciones', layout: 'Layout', design: 'Diseño', own: 'Tus bloques' },
  blocks: {
    heading: 'Título',
    text: 'Texto',
    button: 'Botón',
    image: 'Imagen',
    hero: 'Portada',
    callout: 'Aviso',
    quote: 'Cita',
    list: 'Lista',
    markdown: 'Markdown',
    video: 'Video',
    social: 'Redes sociales',
    menu: 'Menú',
    coupon: 'Cupón',
    table: 'Tabla',
    rating: 'Calificación',
    gallery: 'Galería',
    divider: 'Separador',
    spacer: 'Espacio',
    html: 'HTML',
    section: 'Sección',
    columns: 'Columnas',
  },
  tones: { accent: 'Color de acento', green: 'Verde', amber: 'Ámbar', gray: 'Gris' },
  looks: { gray: 'Gris', accent: 'Color de acento', dark: 'Oscuro', outline: 'Solo borde' },
  sizes: { sm: 'Chico', md: 'Mediano', lg: 'Grande' },
  networks: { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', linkedin: 'LinkedIn', x: 'X', website: 'Sitio web' },
  edit: 'Editar',
  desktop: 'Computadora',
  phone: 'Celular',
  undo: 'Deshacer',
  redo: 'Rehacer',
  from: 'De',
  subject: 'Escribe el asunto',
  preheader: 'El texto que se lee después del asunto',
  dropHere: 'Suéltalo aquí',
  dragHere: 'Arrastra bloques aquí',
  dragFromPalette: 'Arrastra bloques de la izquierda',
  paletteHelp: 'Arrastra un bloque al correo, o dale clic para ponerlo después del que elegiste.',
  move: 'Arrastra para mover',
  up: 'Subir',
  down: 'Bajar',
  duplicate: 'Duplicar',
  remove: 'Quitar',
  help: [
    'Da clic en un bloque para elegirlo: sus textos se escriben ahí mismo y lo demás (ligas, imágenes, colores) aquí.',
    'Arrástralo de su agarradera para moverlo, también dentro de una sección o una columna.',
    '⌘B negritas, ⌘I cursivas, ⌘K una liga. {name} se llena para cada quien.',
    'Supr quita el bloque elegido, Esc lo deja de elegir, ⌘Z deshace.',
  ],
  email: 'Correo',
  accent: 'Color de acento',
  background: 'Fondo',
  name: 'Nombre arriba',
  logo: 'Logo (dirección)',
  width: 'Ancho',
  widths: 'Anchos',
  look: 'Fondo',
  tone: 'Tono',
  size: 'Tamaño',
  numbered: 'Numerada',
  column: (n) => `Columna ${n}`,
  phoneStacks: 'En el celular las columnas se acomodan una debajo de otra.',
  dragInto: 'Arrastra bloques dentro, en el correo.',
  missing: {
    image: 'Imagen: pon su dirección en el panel',
    hero: 'Imagen de portada: pon su dirección en el panel',
    video: 'Video: pon su liga y su imagen en el panel',
    social: 'Redes sociales: pon sus ligas en el panel',
    menu: 'Menú: pon sus ligas en el panel',
    gallery: 'Imagen: pon su dirección en el panel',
  },
  fields: {
    url: 'Liga (https://… o /…)',
    label: 'Texto del botón',
    picture: 'Imagen (https://…)',
    alt: 'Qué muestra, para quien no ve imágenes',
    href: 'Liga al darle clic (opcional)',
    title: 'Título',
    text: 'Texto',
    author: 'Quién lo dijo',
    video: 'Liga del video',
    cover: 'Imagen del video (https://…)',
    color: 'Color',
    html: 'Tu HTML',
    htmlHelp: 'Usa tablas y style="…" en cada elemento: muchas bandejas no leen <style>. Se quitan scripts, iframes y formularios; las ligas cuentan clics.',
    markdown: '## Un subtítulo, **negritas**, - listas, > citas',
    list: 'Un punto por renglón',
    link: 'Texto de la liga',
    addLink: 'Agregar una liga',
    code: 'Código',
    offer: 'Qué da',
    note: 'Hasta cuándo, o cómo se usa',
    row: 'Qué es',
    value: 'Su valor',
    addRow: 'Agregar un renglón',
    total: 'El último renglón es un total',
    question: 'La pregunta',
    stars: 'A dónde va cada estrella',
    starsHelp: '{score} es el número de la estrella, del 1 al 5: https://example.com/encuesta?score={score}. Cada clic se cuenta como cualquier liga.',
    pictures: 'Imágenes',
    nth: (n) => `Imagen ${n}`,
    removeOne: 'Quitar',
  },
  problems: 'Antes de enviar',
  noProblems: 'No falta nada.',
};

export const WORDS: Record<Locale, Words> = { en, es };
