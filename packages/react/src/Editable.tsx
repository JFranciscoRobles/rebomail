// Words written where they show, as plain text: the marks of Markdown typed
// or put with ⌘B, ⌘I and ⌘K, a new line with Enter where there may be more
// than one. While they are not being written, the marks show as the email
// draws them (bold, italic, a link); written, they are text again, the caret
// where the click was. What is written goes out as it is typed; what comes
// in is written into the element only when it differs, so the caret stays
// where it is.

import { type CSSProperties, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { addLink, type Run, runsOf, type Selected, toggleMark, writtenAt } from './format';

/** Where the caret and the selection are in an element's text, as offsets. */
function selectionIn(el: HTMLElement): { start: number; end: number } | null {
  const sel = el.ownerDocument.getSelection();
  if (!sel?.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer)) return null;
  const before = el.ownerDocument.createRange();
  before.selectNodeContents(el);
  before.setEnd(range.startContainer, range.startOffset);
  const start = before.toString().length;
  return { start, end: start + range.toString().length };
}

/** The caret and the selection put back at these offsets of the element's text. */
function selectIn(el: HTMLElement, start: number, end: number) {
  const doc = el.ownerDocument;
  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = doc.createRange();
  let seen = 0;
  let placedStart = false;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const length = node.textContent?.length ?? 0;
    if (!placedStart && start <= seen + length) {
      range.setStart(node, start - seen);
      placedStart = true;
    }
    if (placedStart && end <= seen + length) {
      range.setEnd(node, end - seen);
      const sel = doc.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      return;
    }
    seen += length;
  }
}

/** A piece of the text with its marks, as the element shows it. */
function shown(doc: Document, r: Run): Node {
  let node: Node = doc.createTextNode(r.text);
  const wrap = (tag: string, className?: string) => {
    const el = doc.createElement(tag);
    if (className) el.className = className;
    el.append(node);
    node = el;
  };
  if (r.italic) wrap('em');
  if (r.bold) wrap('strong');
  if (r.link) wrap('span', 'rm-mark-link');
  return node;
}

export interface EditableProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Whether the marks may be put with the keys: not where they would show as they are (a name, an address). */
  marks?: boolean;
}

export function Editable({ value, onChange, placeholder, multiline, className, style, marks = true }: EditableProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Whether it is being written: the text as it is, not as it shows. A click starts it when the pointer is up, where it fell.
  const [writing, setWriting] = useState(false);
  const pressed = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (writing || !marks) {
      if (el.textContent !== value || el.childElementCount) el.textContent = value;
    } else el.replaceChildren(...runsOf(value).map((r) => shown(el.ownerDocument, r)));
  }, [value, writing, marks]);

  /** The text as it is put in the element, what was selected of it as it showed selected of it as it is. */
  const write = () => {
    const el = ref.current;
    if (!el || writing || !marks) return;
    const at = selectionIn(el);
    const runs = runsOf(value);
    el.textContent = value;
    setWriting(true);
    selectIn(el, at ? writtenAt(runs, at.start, value.length) : value.length, at ? writtenAt(runs, at.end, value.length) : value.length);
  };

  const apply = (change: (s: Selected) => Selected) => {
    const el = ref.current;
    const at = el && selectionIn(el);
    if (!el || !at) return;
    const next = change({ text: el.textContent ?? '', ...at });
    el.textContent = next.text;
    onChange(next.text);
    selectIn(el, next.start, next.end);
  };

  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    // A key before the pointer was up (it was let go outside): the text as it is first.
    write();
    const mod = e.metaKey || e.ctrlKey;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (multiline && !mod) e.currentTarget.ownerDocument.execCommand('insertText', false, '\n');
      return;
    }
    if (!mod || !marks) return;
    const k = e.key.toLowerCase();
    if (k === 'b' || k === 'i' || k === 'k') {
      e.preventDefault();
      apply((s) => (k === 'k' ? addLink(s) : toggleMark(s, k === 'b' ? 'bold' : 'italic')));
    }
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: words written in place, in the look of the email: no field looks like that.
    <div
      ref={ref}
      role="textbox"
      tabIndex={0}
      aria-multiline={multiline}
      aria-label={placeholder}
      aria-placeholder={placeholder}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      data-placeholder={placeholder}
      data-empty={value ? undefined : ''}
      spellCheck
      onInput={(e) => onChange(e.currentTarget.textContent ?? '')}
      onKeyDown={key}
      onPointerDown={() => {
        pressed.current = true;
      }}
      onPointerUp={() => {
        pressed.current = false;
        write();
      }}
      onFocus={() => pressed.current || write()}
      onBlur={() => {
        pressed.current = false;
        setWriting(false);
      }}
      className={`rm-editable${className ? ` ${className}` : ''}`}
      style={style}
    />
  );
}
