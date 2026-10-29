// The words of a block: variables in braces ({name}), filled for each one it
// goes to, and three marks of Markdown, made HTML for the email and taken
// away for its text: **bold**, *italic*, [a link](https://…).

/** What goes in HTML as text: nothing in it read as a tag or an attribute's end. */
export const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** The variables a text says, by their names, once each: `{name}` and `{ name }` alike. */
export const variablesIn = (text: string) => [...new Set([...text.matchAll(/\{\s*([\w.-]+)\s*\}/g)].map((m) => m[1]))];

/** A text with its variables filled; one not given stays as written, for it to be seen missing. */
export const fill = (text: string, values: Record<string, string> = {}) => text.replace(/\{\s*([\w.-]+)\s*\}/g, (whole, name: string) => values[name] ?? whole);

/** How a text's link goes into the HTML: through what counts the clicks, made whole. */
export type Linker = (url: string) => string;

/** Only these may be followed from an email: the web, a mail, a phone, and the email's own (`/…`, made whole). */
export const safeUrl = (url: string) => /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(url.trim());

/** A text's three marks as HTML, the rest of it as text: a line break is one, a link goes through `link`. */
export function inlineHtml(text: string, link: Linker, accent: string) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, label: string, url: string) => {
      const real = url.replace(/&amp;/g, '&');
      return safeUrl(real) ? `<a href="${escapeHtml(link(real))}" style="color:${accent};text-decoration:underline;">${label}</a>` : whole;
    })
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\s](?:[^*]*[^*\s])?)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/\n/g, '<br>');
}

/** A text's marks taken away: a link as its words and where it goes. */
export const inlineText = (text: string, link: Linker = (url) => url) =>
  text
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, url: string) => `${label} (${link(url)})`)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|[^*\w])\*([^*\s](?:[^*]*[^*\s])?)\*(?!\w)/g, '$1$2');
