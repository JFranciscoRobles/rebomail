import { describe, expect, it } from 'vitest';
import { allowed, blankEmail, DEFAULT_THEME, makeBlock, readBlocks, readEmail, readTheme } from '../src';

describe('reading blocks', () => {
  it('keeps only what each type has', () => {
    const [b] = readBlocks([{ id: 'a', type: 'button', label: 'Go', url: '/x', color: '#ABCDEF', onclick: 'evil()' }]);
    expect(b).toEqual({ id: 'a', type: 'button', label: 'Go', url: '/x', color: '#abcdef' });
  });

  it('leaves out what is not a block, and gives an id to one without', () => {
    const blocks = readBlocks([null, 'text', { type: 'nope' }, { type: 'divider' }]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('divider');
    expect(blocks[0].id).toMatch(/^[a-z0-9]+$/);
  });

  it('cuts what is too long', () => {
    const [b] = readBlocks([{ type: 'heading', text: 'x'.repeat(1000) }]);
    expect(b.type === 'heading' && b.text.length).toBe(300);
  });

  it('says a bad colour, tone or size as the default', () => {
    const [button, callout, spacer] = readBlocks([
      { type: 'button', color: 'red' },
      { type: 'callout', tone: 'pink' },
      { type: 'spacer', size: 'xl' },
    ]);
    expect(button.type === 'button' && button.color).toBeNull();
    expect(callout.type === 'callout' && callout.tone).toBe('accent');
    expect(spacer.type === 'spacer' && spacer.size).toBe('md');
  });

  it('keeps no section in a section, and no layout in a column', () => {
    const [section] = readBlocks([
      {
        type: 'section',
        blocks: [
          { type: 'section', blocks: [] },
          { type: 'columns', widths: '1-1', columns: [[{ type: 'columns' }, { type: 'section' }, { type: 'text', text: 'ok' }], []] },
        ],
      },
    ]);
    expect(section.type === 'section' && section.blocks.map((b) => b.type)).toEqual(['columns']);
    const row = section.type === 'section' ? section.blocks[0] : undefined;
    expect(row?.type === 'columns' && row.columns[0].map((b) => b.type)).toEqual(['text']);
  });

  it('gives a row as many columns as its widths say', () => {
    const [three, two] = readBlocks([
      { type: 'columns', widths: '1-1-1', columns: [[{ type: 'divider' }]] },
      { type: 'columns', widths: '1-2', columns: [[], [], [{ type: 'divider' }]] },
    ]);
    expect(three.type === 'columns' && three.columns.map((c) => c.length)).toEqual([1, 0, 0]);
    expect(two.type === 'columns' && two.columns).toHaveLength(2);
  });

  it('keeps the data of a custom block as JSON, and drops one without a kind', () => {
    const blocks = readBlocks([
      { type: 'custom', kind: 'product', data: { sku: 'A1', price: 10, tags: ['x'], when: undefined, fn: () => 1 } },
      { type: 'custom', data: {} },
    ]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type === 'custom' && blocks[0].data).toEqual({ sku: 'A1', price: 10, tags: ['x'], when: null, fn: null });
  });

  it('makes each type as it starts', () => {
    expect(makeBlock('columns')).toMatchObject({ type: 'columns', widths: '1-1', columns: [[], []] });
    expect(makeBlock('custom', { kind: 'product' })).toMatchObject({ type: 'custom', kind: 'product', data: {} });
    expect(makeBlock('text').id).not.toBe(makeBlock('text').id);
  });
});

describe('reading the new blocks', () => {
  it('keeps their lists as long as they may be, and a gallery of two at least', () => {
    const [menu, table, gallery] = readBlocks([
      { type: 'menu', links: Array.from({ length: 12 }, (_, i) => ({ label: `L${i}`, url: '/x', extra: 1 })) },
      { type: 'table', rows: [{ label: 'a', value: 2 }], total: 'yes' },
      { type: 'gallery', pictures: [{ src: '/a.jpg' }, { src: '/b.jpg' }, { src: '/c.jpg' }, { src: '/d.jpg' }] },
    ]);
    expect(menu).toMatchObject({ type: 'menu', links: expect.any(Array) });
    expect(menu.type === 'menu' && menu.links).toHaveLength(8);
    expect(menu.type === 'menu' && menu.links[0]).toEqual({ label: 'L0', url: '/x' });
    expect(table).toMatchObject({ rows: [{ label: 'a', value: '' }], total: false });
    expect(gallery.type === 'gallery' && gallery.pictures.map((p) => p.src)).toEqual(['/a.jpg', '/b.jpg', '/c.jpg']);
    const [lone] = readBlocks([{ type: 'gallery', pictures: [{ src: '/a.jpg' }] }]);
    expect(lone.type === 'gallery' && lone.pictures).toHaveLength(2);
  });
});

describe('where a block may go', () => {
  it('lets anything in the email, anything but a section in a section, no layout in a column', () => {
    expect(allowed('email', 'section')).toBe(true);
    expect(allowed('section', 'columns')).toBe(true);
    expect(allowed('section', 'section')).toBe(false);
    expect(allowed('columns', 'columns')).toBe(false);
    expect(allowed('columns', 'section')).toBe(false);
    expect(allowed('columns', 'text')).toBe(true);
  });
});

describe('reading an email and its theme', () => {
  it('fills the theme with the default, and keeps no CSS out of the font', () => {
    expect(readTheme({ accent: 'blue', width: 2000, font: 'Arial; } body { x' })).toEqual({ ...DEFAULT_THEME, font: 'Arial  body  x' });
  });

  it('reads an email whole', () => {
    const email = readEmail({ subject: 'Hi', blocks: [{ type: 'divider' }], theme: { accent: '#000000' } });
    expect(email.subject).toBe('Hi');
    expect(email.preheader).toBe('');
    expect(email.theme.accent).toBe('#000000');
    expect(email.blocks).toHaveLength(1);
    expect(readEmail(null)).toEqual(blankEmail());
  });
});
