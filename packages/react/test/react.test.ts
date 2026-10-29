// @vitest-environment happy-dom
import { type Block, blankEmail, type Email, findBlock, whereIs } from '@rebomail/core';
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { type EditorBlock, MailCanvas, MailEditor, MailPalette, MailPreview, MailProvider, type MailState, useMail } from '../src';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let host: HTMLElement | undefined;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
});

/** Mounts what is given, and gives the editor's state as it is after each change. */
async function mount(children: ReactNode, email?: Email, more: { onChange?: (e: Email) => void; blocks?: EditorBlock[] } = {}) {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  const seen: { mail?: MailState } = {};
  function Spy() {
    seen.mail = useMail();
    return null;
  }
  await act(async () => root!.render(createElement(MailProvider, { email, locale: 'en', ...more }, createElement(Spy), children)));
  return { mail: () => seen.mail!, host };
}

const email = (blocks: Block[]): Email => ({ ...blankEmail({ name: 'Rebo' }), subject: 'Hi', blocks });
const twoColumns = (): Block[] => [
  { id: 'h', type: 'heading', text: 'Hello' },
  { id: 'c', type: 'columns', widths: '1-1', columns: [[{ id: 't', type: 'text', text: 'left' }], []] },
];

describe('the editor’s state', () => {
  it('adds, moves, duplicates and removes blocks, telling each change', async () => {
    const changes: Email[] = [];
    const { mail } = await mount(null, email(twoColumns()), { onChange: (e) => changes.push(e) });
    await act(async () => void mail().add('divider'));
    expect(mail().email.blocks.map((b) => b.type)).toEqual(['heading', 'columns', 'divider']);
    // The one added is chosen.
    expect(mail().selected).toBe(mail().email.blocks[2].id);
    await act(async () => mail().move('t', { parent: 'c', column: 1 }, 0));
    expect(whereIs(mail().email.blocks, 't')?.place).toEqual({ parent: 'c', column: 1 });
    await act(async () => mail().duplicate('h'));
    expect(mail().email.blocks.map((b) => b.type)).toEqual(['heading', 'heading', 'columns', 'divider']);
    await act(async () => mail().remove('c'));
    expect(findBlock(mail().email.blocks, 't')).toBeUndefined();
    await act(async () => Promise.resolve());
    expect(changes).toHaveLength(4);
    expect(changes.at(-1)).toBe(mail().email);
  });

  it('puts a block after the one chosen, where it may go; at the end where it may not', async () => {
    const { mail } = await mount(null, email(twoColumns()));
    await act(async () => mail().select('t'));
    await act(async () => void mail().add('divider'));
    expect(whereIs(mail().email.blocks, mail().selected!)).toEqual({ place: { parent: 'c', column: 0 }, index: 1 });
    await act(async () => mail().select('t'));
    await act(async () => void mail().add('section'));
    expect(mail().email.blocks.at(-1)?.type).toBe('section');
  });

  it('undoes and redoes, what is typed in one field a moment apart being one change', async () => {
    const { mail } = await mount(null, email(twoColumns()));
    await act(async () => mail().update('h', { text: 'Hello A' } as Partial<Block>, 'text'));
    await act(async () => mail().update('h', { text: 'Hello AB' } as Partial<Block>, 'text'));
    await act(async () => mail().setSubject('Hi there'));
    expect(mail().canUndo).toBe(true);
    await act(async () => mail().undo());
    expect(mail().email.subject).toBe('Hi');
    expect(findBlock(mail().email.blocks, 'h')).toMatchObject({ text: 'Hello AB' });
    await act(async () => mail().undo());
    expect(findBlock(mail().email.blocks, 'h')).toMatchObject({ text: 'Hello' });
    expect(mail().canUndo).toBe(false);
    await act(async () => mail().redo());
    await act(async () => mail().redo());
    expect(mail().email.subject).toBe('Hi there');
    expect(mail().canRedo).toBe(false);
  });

  it('drops what is dragged where it may go, and nowhere else', async () => {
    const { mail } = await mount(null, email(twoColumns()));
    await act(async () => mail().drag({ entry: 'section', type: 'section' }));
    expect(mail().canDrop({ parent: null })).toBe(true);
    expect(mail().canDrop({ parent: 'c', column: 1 })).toBe(false);
    await act(async () => mail().drag({ id: 'h', type: 'heading' }));
    await act(async () => mail().drop({ parent: 'c', column: 1 }, 0));
    expect(whereIs(mail().email.blocks, 'h')?.place).toEqual({ parent: 'c', column: 1 });
    expect(mail().dragged).toBeNull();
  });

  it('says what the email lacks', async () => {
    const { mail } = await mount(null, email(twoColumns()));
    expect(mail().problems).toEqual([{ code: 'empty-layout', block: 'c', type: 'columns', column: 1 }]);
  });
});

describe('the parts of the editor', () => {
  it('draws the email on itself, and chooses a block with a click', async () => {
    const { host: h, mail } = await mount(createElement(MailCanvas), email(twoColumns()));
    expect(h.querySelector('.rm-inbox-subject')?.textContent).toBe('Hi');
    expect(h.querySelector('.rm-h2')?.textContent).toBe('Hello');
    expect(h.querySelectorAll('.rm-column')).toHaveLength(2);
    expect(h.querySelector('.rm-column:last-child .rm-empty')?.textContent).toBe('Drag blocks here');
    const heading = h.querySelector('.rm-h2')!.closest('.rm-item') as HTMLElement;
    await act(async () => heading.click());
    expect(mail().selected).toBe('h');
    expect(h.querySelector('.rm-bar-name')?.textContent).toBe('Heading');
  });

  it('writes what is typed on the email into it', async () => {
    const { host: h, mail } = await mount(createElement(MailCanvas), email(twoColumns()));
    const text = h.querySelector('.rm-column .rm-p') as HTMLElement;
    text.textContent = 'left, written';
    await act(async () => text.dispatchEvent(new Event('input', { bubbles: true })));
    expect(findBlock(mail().email.blocks, 't')).toMatchObject({ text: 'left, written' });
  });

  it('shows the marks as the email draws them, and the text as written while it is written', async () => {
    const { host: h, mail } = await mount(createElement(MailCanvas), email([{ id: 't', type: 'text', text: 'a **big** [house](https://x.com)' }]));
    const text = h.querySelector('.rm-p') as HTMLElement;
    expect(text.textContent).toBe('a big house');
    expect(text.querySelector('strong')?.textContent).toBe('big');
    expect(text.querySelector('.rm-mark-link')?.textContent).toBe('house');
    await act(async () => text.focus());
    expect(text.textContent).toBe('a **big** [house](https://x.com)');
    expect(text.childElementCount).toBe(0);
    await act(async () => text.blur());
    expect(text.querySelector('strong')?.textContent).toBe('big');
    expect(findBlock(mail().email.blocks, 't')).toMatchObject({ text: 'a **big** [house](https://x.com)' });
  });

  it('draws the new blocks, their words written on them', async () => {
    const { host: h, mail } = await mount(
      createElement(MailCanvas),
      email([
        {
          id: 'm',
          type: 'menu',
          links: [
            { label: 'Shop', url: '/shop' },
            { label: 'Blog', url: '/blog' },
          ],
        },
        { id: 'c', type: 'coupon', code: 'SAVE20', text: '', note: '' },
        {
          id: 't',
          type: 'table',
          rows: [
            { label: 'Chair', value: '$249' },
            { label: 'Total', value: '$249' },
          ],
          total: true,
        },
        { id: 'r', type: 'rating', text: 'How did we do?', url: '' },
        {
          id: 'g',
          type: 'gallery',
          pictures: [
            { src: '/a.jpg', alt: '', href: '' },
            { src: '', alt: '', href: '' },
          ],
        },
      ]),
    );
    expect([...h.querySelectorAll('.rm-menu .rm-editable')].map((e) => e.textContent)).toEqual(['Shop', 'Blog']);
    expect(h.querySelector('.rm-coupon-code')?.textContent).toBe('SAVE20');
    expect(h.querySelector('.rm-table-row[data-total]')?.textContent).toBe('Total$249');
    expect(h.querySelector('.rm-stars')?.textContent).toBe('★★★★★');
    expect(h.querySelectorAll('.rm-gallery img')).toHaveLength(1);
    const value = h.querySelector('.rm-table-value') as HTMLElement;
    value.textContent = '$199';
    await act(async () => value.dispatchEvent(new Event('input', { bubbles: true })));
    expect(findBlock(mail().email.blocks, 't')).toMatchObject({
      rows: [
        { label: 'Chair', value: '$199' },
        { label: 'Total', value: '$249' },
      ],
    });
  });

  it('puts a block of the palette with a click', async () => {
    const { host: h, mail } = await mount(createElement(MailPalette), email([]));
    const quote = [...h.querySelectorAll('.rm-palette-item')].find((b) => b.textContent === 'Quote') as HTMLElement;
    await act(async () => quote.click());
    expect(mail().email.blocks.map((b) => b.type)).toEqual(['quote']);
  });

  it('removes the block chosen with Delete, but not while its words are written', async () => {
    await mount(null);
    await act(async () => root!.render(createElement(MailEditor, { email: email(twoColumns()), locale: 'en' })));
    const item = host!.querySelector('.rm-h2')!.closest('.rm-item') as HTMLElement;
    await act(async () => item.click());
    const words = host!.querySelector('.rm-h2') as HTMLElement;
    await act(async () => words.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true })));
    expect(host!.querySelector('.rm-h2')).not.toBeNull();
    await act(async () => item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true })));
    expect(host!.querySelector('.rm-h2')).toBeNull();
    // And ⌘Z brings it back.
    await act(async () => host!.querySelector('.rm-editor')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true })));
    expect(host!.querySelector('.rm-h2')?.textContent).toBe('Hello');
  });

  it('puts the application’s own blocks in the palette, draws them on the email and in the preview', async () => {
    const product: EditorBlock = {
      kind: 'product',
      label: 'Product',
      data: () => ({ name: 'Chair' }),
      render: { html: (b) => `<p class="product">${String(b.data.name)}</p>`, complete: (b) => !!b.data.name },
      Look: ({ block, update }) => createElement('button', { type: 'button', className: 'look', onClick: () => update({ name: 'Table' }) }, String(block.data.name)),
    };
    const { host: h, mail } = await mount([createElement(MailPalette, { key: 'p' }), createElement(MailCanvas, { key: 'c' }), createElement(MailPreview, { key: 'v' })], email([]), {
      blocks: [product],
    });
    const entry = [...h.querySelectorAll('.rm-palette-item')].find((b) => b.textContent === 'Product') as HTMLElement;
    expect(entry.closest('.rm-palette-group')?.querySelector('.rm-label')?.textContent).toBe('Your blocks');
    await act(async () => entry.click());
    expect(mail().email.blocks[0]).toMatchObject({ type: 'custom', kind: 'product', data: { name: 'Chair' } });
    await act(async () => (h.querySelector('.look') as HTMLElement).click());
    expect(mail().email.blocks[0]).toMatchObject({ data: { name: 'Table' } });
    expect(h.querySelector('iframe')?.getAttribute('srcdoc')).toContain('<p class="product">Table</p>');
  });
});
