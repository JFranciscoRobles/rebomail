import { describe, expect, it } from 'vitest';
import { type Block, duplicateBlock, EMAIL, findBlock, insertBlock, insideOf, listAt, mayPut, moveBlock, removeBlock, updateBlock, walk, whereIs } from '../src';

const tree = (): Block[] => [
  { id: 'h', type: 'heading', text: 'A' },
  {
    id: 's',
    type: 'section',
    look: 'gray',
    blocks: [
      { id: 'c', type: 'columns', widths: '1-1', columns: [[{ id: 'x', type: 'text', text: 'x' }], []] },
      { id: 'y', type: 'text', text: 'y' },
    ],
  },
  { id: 'z', type: 'divider' },
];

/** The ids, as the tree has them. */
const shape = (blocks: Block[]): unknown => blocks.map((b) => (b.type === 'section' ? { [b.id]: shape(b.blocks) } : b.type === 'columns' ? { [b.id]: b.columns.map(shape) } : b.id));

describe('finding blocks', () => {
  it('walks into sections and columns', () => {
    expect(walk(tree()).map((b) => b.id)).toEqual(['h', 's', 'c', 'x', 'y', 'z']);
    expect(findBlock(tree(), 'x')).toMatchObject({ text: 'x' });
  });

  it('says where a block is, and what each place is', () => {
    const t = tree();
    expect(whereIs(t, 'x')).toEqual({ place: { parent: 'c', column: 0 }, index: 0 });
    expect(whereIs(t, 'y')).toEqual({ place: { parent: 's' }, index: 1 });
    expect(insideOf(t, EMAIL)).toBe('email');
    expect(insideOf(t, { parent: 's' })).toBe('section');
    expect(insideOf(t, { parent: 'c', column: 1 })).toBe('columns');
    expect(listAt(t, { parent: 'c', column: 1 })).toEqual([]);
  });
});

describe('changing the tree', () => {
  it('changes a block wherever it is, and nothing else', () => {
    const t = tree();
    const next = updateBlock(t, 'x', { text: 'changed' } as Partial<Block>);
    expect(findBlock(next, 'x')).toMatchObject({ text: 'changed' });
    expect(findBlock(t, 'x')).toMatchObject({ text: 'x' });
    // What it did not touch is the same object.
    expect(next[0]).toBe(t[0]);
    expect(next[2]).toBe(t[2]);
  });

  it('never changes a block’s id or type', () => {
    const next = updateBlock(tree(), 'x', { id: 'other', type: 'heading' } as Partial<Block>);
    expect(findBlock(next, 'x')?.type).toBe('text');
  });

  it('takes a block away with what is inside it', () => {
    expect(shape(removeBlock(tree(), 's'))).toEqual(['h', 'z']);
    expect(shape(removeBlock(tree(), 'x'))).toEqual(['h', { s: [{ c: [[], []] }, 'y'] }, 'z']);
  });

  it('puts a block where it may go, and nowhere else', () => {
    const t = tree();
    const into = insertBlock(t, { parent: 'c', column: 1 }, 0, { id: 'n', type: 'divider' });
    expect(shape(into)).toEqual(['h', { s: [{ c: [['x'], ['n']] }, 'y'] }, 'z']);
    expect(insertBlock(t, { parent: 'c', column: 0 }, 0, { id: 'n', type: 'section', look: 'gray', blocks: [] })).toBe(t);
    expect(insertBlock(t, { parent: 's' }, 0, { id: 'n', type: 'section', look: 'gray', blocks: [] })).toBe(t);
    expect(insertBlock(t, { parent: 'nowhere' }, 0, { id: 'n', type: 'divider' })).toBe(t);
  });
});

describe('moving a block', () => {
  it('moves it out of a column, into another, to the email', () => {
    expect(shape(moveBlock(tree(), 'x', { parent: 'c', column: 1 }, 0))).toEqual(['h', { s: [{ c: [[], ['x']] }, 'y'] }, 'z']);
    expect(shape(moveBlock(tree(), 'y', EMAIL, 0))).toEqual(['y', 'h', { s: [{ c: [['x'], []] }] }, 'z']);
    expect(shape(moveBlock(tree(), 'h', { parent: 'c', column: 1 }, 0))).toEqual([{ s: [{ c: [['x'], ['h']] }, 'y'] }, 'z']);
  });

  it('counts the index as the list is before it leaves', () => {
    // Dropped on the line after the section (index 2): it falls right after it.
    expect(shape(moveBlock(tree(), 'h', EMAIL, 2))).toEqual([{ s: [{ c: [['x'], []] }, 'y'] }, 'h', 'z']);
    // Dropped where it is: nothing changes.
    const t = tree();
    expect(moveBlock(t, 'h', EMAIL, 0)).toBe(t);
    expect(moveBlock(t, 'h', EMAIL, 1)).toBe(t);
  });

  it('never moves a block into itself, nor a layout where it may not go', () => {
    const t = tree();
    expect(mayPut(t, { type: 'columns', id: 'c' }, { parent: 'c', column: 1 })).toBe(false);
    expect(moveBlock(t, 'c', { parent: 'c', column: 1 }, 0)).toBe(t);
    expect(moveBlock(t, 's', { parent: 'c', column: 1 }, 0)).toBe(t);
    expect(moveBlock(t, 'c', EMAIL, 0)).not.toBe(t);
  });
});

describe('duplicating a block', () => {
  it('copies it right after itself, with new ids inside too', () => {
    const { blocks, copy } = duplicateBlock(tree(), 's');
    expect(blocks).toHaveLength(4);
    expect(blocks[2]).toBe(copy);
    const ids = walk([copy!]).map((b) => b.id);
    expect(ids).toHaveLength(4);
    for (const id of ids) expect(['s', 'c', 'x', 'y']).not.toContain(id);
  });
});
