// The marks of a text as it is written, on what is selected in it: bold and
// italic put around it or taken away, and a link made of it, its address
// selected to be typed. Each gives the text and what is selected after.

export interface Selected {
  text: string;
  start: number;
  end: number;
}

const MARKS = { bold: '**', italic: '*' } as const;

/** Bold or italic around what is selected; taken away if it is already. With nothing selected, the marks with the caret between them. */
export function toggleMark({ text, start, end }: Selected, mark: keyof typeof MARKS): Selected {
  const m = MARKS[mark];
  const before = text.slice(0, start);
  const inside = text.slice(start, end);
  const after = text.slice(end);
  // Marked around it: the marks go. Bold is not italic: `**x**` is not taken for `*x*`.
  const around = before.endsWith(m) && after.startsWith(m) && !(mark === 'italic' && before.endsWith('**') && after.startsWith('**'));
  if (around) return { text: before.slice(0, -m.length) + inside + after.slice(m.length), start: start - m.length, end: end - m.length };
  // Marked inside it, whole: the same.
  if (inside.length > m.length * 2 && inside.startsWith(m) && inside.endsWith(m) && !(mark === 'italic' && inside.startsWith('**')))
    return { text: before + inside.slice(m.length, -m.length) + after, start, end: end - m.length * 2 };
  return { text: before + m + inside + m + after, start: start + m.length, end: end + m.length };
}

/** A link of what is selected: `[words](https://)`, its address selected to be typed over. */
export function addLink({ text, start, end }: Selected, placeholder = 'https://'): Selected {
  const words = text.slice(start, end) || 'link';
  const made = `[${words}](${placeholder})`;
  const at = start + words.length + 3;
  return { text: text.slice(0, start) + made + text.slice(end), start: at, end: at + placeholder.length };
}

/** A piece of a text as it shows: its words, where they start in the text as written, and the marks on them. */
export interface Run {
  text: string;
  start: number;
  bold?: boolean;
  italic?: boolean;
  link?: string;
}

// The same marks the email reads, each tried where the text is: a link, bold, italic.
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/y;
const BOLD = /\*\*(.+?)\*\*/y;
const ITALIC = /\*([^*\s](?:[^*\n]*[^*\s])?)\*(?!\w)/y;

/** A text as it shows, its marks taken away and put on its pieces: what the email draws, read back to the text. */
export function runsOf(text: string, offset = 0, marks: Omit<Run, 'text' | 'start'> = {}): Run[] {
  const out: Run[] = [];
  let plain = 0;
  const flush = (to: number) => {
    if (to > plain) out.push({ text: text.slice(plain, to), start: offset + plain, ...marks });
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c !== '[' && c !== '*') continue;
    let inner: { words: string; at: number; end: number; mark: Omit<Run, 'text' | 'start'> } | null = null;
    LINK.lastIndex = BOLD.lastIndex = ITALIC.lastIndex = i;
    const link = c === '[' ? LINK.exec(text) : null;
    const bold = !link && text.startsWith('**', i) ? BOLD.exec(text) : null;
    // Italic opens where no word nor star is before it: `2*3*4` is not.
    const italic = !link && !bold && c === '*' && !/[*\w]/.test(text[i - 1] ?? '') ? ITALIC.exec(text) : null;
    if (link) inner = { words: link[1], at: i + 1, end: LINK.lastIndex, mark: { link: link[2] } };
    else if (bold) inner = { words: bold[1], at: i + 2, end: BOLD.lastIndex, mark: { bold: true } };
    else if (italic) inner = { words: italic[1], at: i + 1, end: ITALIC.lastIndex, mark: { italic: true } };
    if (!inner) continue;
    flush(i);
    out.push(...runsOf(inner.words, offset + inner.at, { ...marks, ...inner.mark }));
    plain = inner.end;
    i = inner.end - 1;
  }
  flush(text.length);
  return out;
}

/** Where an offset of the text as it shows is in the text as written: inside a piece, or at the end of the one before. */
export function writtenAt(runs: Run[], shown: number, length: number): number {
  let seen = 0;
  for (const r of runs) {
    if (shown <= seen + r.text.length) return r.start + (shown - seen);
    seen += r.text.length;
  }
  return length;
}
