// The icons of the editor: lines of the same weight on a grid of 20, in the
// colour of the text they stand beside, so that they follow the theme.

const PATHS = {
  heading: 'M4.75 4.25v11.5M13.25 4.25v11.5M4.75 10h8.5',
  text: 'M4.5 5.25h11M10 5.25v10.5',
  button: 'M3.25 6.75h13.5v6.5H3.25zM7 10h6',
  image: 'M3.25 4.25h13.5v11.5H3.25zM3.25 13l4-4 3.5 3.5 2-2 4 4M12.75 7.75h.01',
  hero: 'M3.25 3.75h13.5v6.5H3.25zM3.25 13h9M3.25 16h6',
  callout: 'M3.75 4.25h12.5v9.5H9l-3.5 2.5v-2.5H3.75zM7 8h6.25M7 10.75h4',
  quote: 'M4.5 4.5v11M8.5 6.5h7.25M8.5 10h7.25M8.5 13.5h5',
  list: 'M7.75 5.5h8.75M7.75 10h8.75M7.75 14.5h8.75M3.75 5.5h.01M3.75 10h.01M3.75 14.5h.01',
  markdown: 'M2.75 5.25h14.5v9.5H2.75zM5.25 12.25v-4.5l2 2.5 2-2.5v4.5M13.25 7.75v4.5M11.5 10.75l1.75 1.5 1.75-1.5',
  video: 'M3.25 4.25h13.5v11.5H3.25zM8.5 7.5v5l4-2.5z',
  social: 'M14.5 6.75a2 2 0 1 0 0-.01M5.5 10a2 2 0 1 0 0-.01M14.5 13.25a2 2 0 1 0 0-.01M7.3 9.1l5.4-2.2M7.3 10.9l5.4 2.2',
  menu: 'M3.25 6h13.5M3.25 10h13.5M3.25 14h13.5',
  coupon: 'M3.25 5.75h13.5v2.5a1.75 1.75 0 0 0 0 3.5v2.5H3.25v-2.5a1.75 1.75 0 0 0 0-3.5zM12.25 5.75v8.5',
  table: 'M3.25 4.25h13.5v11.5H3.25zM3.25 8.25h13.5M3.25 12h13.5M10 4.25v11.5',
  rating: 'M10 3.5l1.9 4 4.35.5-3.2 3 .85 4.3L10 13.2l-3.9 2.1.85-4.3-3.2-3 4.35-.5z',
  gallery: 'M2.75 5.25h6.5v9.5h-6.5zM10.75 5.25h6.5v9.5h-6.5z',
  divider: 'M3.25 10h13.5',
  spacer: 'M10 3.5v13M7.5 6 10 3.5 12.5 6M7.5 14 10 16.5 12.5 14',
  html: 'M7.25 6 3.25 10l4 4M12.75 6l4 4-4 4',
  section: 'M3.25 3.25h13.5v13.5H3.25z M6 7h8M6 10h8M6 13h5',
  columns: 'M3.25 4.25h13.5v11.5H3.25zM10 4.25v11.5',
  custom: 'M10 3.25l6.25 3.5v6.5L10 16.75l-6.25-3.5v-6.5zM3.75 6.75 10 10.25l6.25-3.5M10 10.25v6.5',
  grip: 'M7.5 5h.01M12.5 5h.01M7.5 10h.01M12.5 10h.01M7.5 15h.01M12.5 15h.01',
  up: 'M10 15.5v-11M5.5 9 10 4.5 14.5 9',
  down: 'M10 4.5v11M5.5 11 10 15.5 14.5 11',
  duplicate: 'M7 7h8.75v8.75H7zM4.25 13V4.25H13',
  trash: 'M4.25 6h11.5M8 6V4h4v2M6 6l.75 10.25h6.5L14 6',
  undo: 'M7.5 5.5 4 9l3.5 3.5M4 9h8a4 4 0 0 1 0 8h-2',
  redo: 'M12.5 5.5 16 9l-3.5 3.5M16 9H8a4 4 0 0 0 0 8h2',
  pointer: 'M5 3.5l10 5.5-4.5 1.25L8.75 15z',
  desktop: 'M2.75 4.25h14.5v9H2.75zM7.5 16.25h5M10 13.25v3',
  phone: 'M6.25 2.75h7.5v14.5h-7.5zM9.25 14.75h1.5',
  play: 'M7 5.5v9l7-4.5z',
  check: 'M4.5 10.5 8 14l7.5-8',
  plus: 'M10 4.5v11M4.5 10h11',
  close: 'M5.5 5.5l9 9M14.5 5.5l-9 9',
  alert: 'M10 3.5 17 16H3zM10 8.5v3.5M10 14h.01',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
