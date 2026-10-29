// The whole editor as one component: the palette, the email written on
// itself (or as an inbox shows it, on a computer or a phone), and the panel;
// a bar to switch them and to undo; and its keys: Delete removes the block
// chosen, Escape lets it go, ⌘Z undoes and ⇧⌘Z redoes, wherever the caret is.

import type { RenderOptions } from '@rebomail/core';
import { type KeyboardEvent, useState } from 'react';
import { MailCanvas } from './Canvas';
import { Icon } from './icons';
import { MailInspector } from './Inspector';
import { MailPalette } from './Palette';
import { MailPreview } from './Preview';
import { MailProvider, type MailProviderProps, type MailState, useMail } from './state';

export interface MailEditorProps extends Omit<MailProviderProps, 'children'> {
  /** What the preview's renderer is given: the values of the variables, the footer, the base of the addresses. */
  preview?: Omit<RenderOptions, 'custom' | 'locale'>;
  className?: string;
}

export function MailEditor({ preview, className, ...provider }: MailEditorProps) {
  return (
    <MailProvider {...provider}>
      <Editor preview={preview} className={className} />
    </MailProvider>
  );
}

/** What the editor's keys do: on the editor, whoever holds it. */
export function handleMailKeys(e: KeyboardEvent, mail: MailState) {
  const mod = e.metaKey || e.ctrlKey;
  const k = e.key.toLowerCase();
  if (mod && k === 'z') {
    e.preventDefault();
    if (e.shiftKey) mail.redo();
    else mail.undo();
    return;
  }
  if (mod && k === 'y') {
    e.preventDefault();
    mail.redo();
    return;
  }
  // Not while writing: there the keys are the words'.
  const target = e.target as HTMLElement;
  if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
  if (e.key === 'Escape') mail.select(null);
  else if ((e.key === 'Delete' || e.key === 'Backspace') && mail.selected) {
    e.preventDefault();
    mail.remove(mail.selected);
  }
}

function Editor({ preview, className }: { preview?: MailEditorProps['preview']; className?: string }) {
  const mail = useMail();
  const { words } = mail;
  const [view, setView] = useState<'edit' | 'desktop' | 'phone'>('edit');
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the editor's keys, for whatever in it has the focus.
    <div className={`rm-editor${className ? ` ${className}` : ''}`} onKeyDown={(e) => handleMailKeys(e, mail)}>
      <MailPalette />
      <div className="rm-middle">
        <div className="rm-toolbar">
          <span className="rm-switch">
            {(
              [
                ['edit', words.edit, 'pointer'],
                ['desktop', words.desktop, 'desktop'],
                ['phone', words.phone, 'phone'],
              ] as const
            ).map(([id, label, icon]) => (
              <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}>
                <Icon name={icon} size={14} /> {label}
              </button>
            ))}
          </span>
          <span className="rm-row">
            <button type="button" className="rm-icon-button" title={`${words.undo} (⌘Z)`} aria-label={words.undo} disabled={!mail.canUndo} onClick={mail.undo}>
              <Icon name="undo" size={15} />
            </button>
            <button type="button" className="rm-icon-button" title={`${words.redo} (⇧⌘Z)`} aria-label={words.redo} disabled={!mail.canRedo} onClick={mail.redo}>
              <Icon name="redo" size={15} />
            </button>
          </span>
        </div>
        {view === 'edit' ? <MailCanvas /> : <MailPreview device={view} options={preview} />}
      </div>
      <MailInspector />
    </div>
  );
}
