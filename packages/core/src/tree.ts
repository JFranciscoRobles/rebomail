// The blocks of an email as a tree: lists of them in the email, in each
// section, in each column; and what is done to it as it is written, wherever
// the block is: found, changed, taken away, put somewhere, moved, copied.
// Everything is immutable: each function gives new lists, and the blocks it
// did not touch are the same objects as before.

import { allowed, type Inside, newId } from './blocks';
import type { Block } from './model';

/** Where a list of blocks is: the email (no parent), a section's, or one column of a row of them. */
export interface Place {
  parent: string | null;
  column?: number;
}
export const EMAIL: Place = { parent: null };
export const samePlace = (a: Place, b: Place) => a.parent === b.parent && (a.column ?? 0) === (b.column ?? 0);

/** The blocks inside one, in their lists: a section's one, a row's one a column. */
const listsIn = (b: Block): Block[][] => (b.type === 'section' ? [b.blocks] : b.type === 'columns' ? b.columns : []);

/** Every block, those inside the layouts too, in the order they are read. */
export const walk = (blocks: Block[]): Block[] => blocks.flatMap((b) => [b, ...listsIn(b).flatMap(walk)]);

/** A block, wherever it is. */
export const findBlock = (blocks: Block[], id: string): Block | undefined => walk(blocks).find((b) => b.id === id);

/** Where a block is: the place of its list and its index in it. */
export function whereIs(blocks: Block[], id: string, here: Place = EMAIL): { place: Place; index: number } | undefined {
  const index = blocks.findIndex((b) => b.id === id);
  if (index >= 0) return { place: here, index };
  for (const b of blocks) {
    const found =
      b.type === 'section' ? whereIs(b.blocks, id, { parent: b.id }) : b.type === 'columns' ? b.columns.map((c, i) => whereIs(c, id, { parent: b.id, column: i })).find(Boolean) : undefined;
    if (found) return found;
  }
}

/** The list at a place; none if it is not there. */
export function listAt(blocks: Block[], place: Place): Block[] | undefined {
  if (place.parent === null) return blocks;
  const parent = findBlock(blocks, place.parent);
  return parent?.type === 'section' ? parent.blocks : parent?.type === 'columns' ? parent.columns[place.column ?? 0] : undefined;
}

/** What a place is: the email, a section or a column. What may go there follows (`allowed`). */
export const insideOf = (blocks: Block[], place: Place): Inside => (place.parent === null ? 'email' : findBlock(blocks, place.parent)?.type === 'columns' ? 'columns' : 'section');

/** The tree with `change` done to the list at `place`. */
export function editList(blocks: Block[], place: Place, change: (list: Block[]) => Block[], here: Place = EMAIL): Block[] {
  const list = samePlace(place, here) ? change(blocks) : blocks;
  let touched = list !== blocks;
  const next = list.map((b) => {
    const inner =
      b.type === 'section'
        ? (() => {
            const blocks2 = editList(b.blocks, place, change, { parent: b.id });
            return blocks2 === b.blocks ? b : { ...b, blocks: blocks2 };
          })()
        : b.type === 'columns'
          ? (() => {
              const columns = b.columns.map((c, i) => editList(c, place, change, { parent: b.id, column: i }));
              return columns.every((c, i) => c === b.columns[i]) ? b : { ...b, columns };
            })()
          : b;
    if (inner !== b) touched = true;
    return inner;
  });
  return touched ? next : blocks;
}

/** A block changed by `patch`, wherever it is. */
export function updateBlock(blocks: Block[], id: string, patch: Partial<Block>): Block[] {
  const at = whereIs(blocks, id);
  return at ? editList(blocks, at.place, (list) => list.map((b) => (b.id === id ? ({ ...b, ...patch, id, type: b.type } as Block) : b))) : blocks;
}

/** A block taken away, and what was inside it. */
export function removeBlock(blocks: Block[], id: string): Block[] {
  const at = whereIs(blocks, id);
  return at ? editList(blocks, at.place, (list) => list.filter((b) => b.id !== id)) : blocks;
}

/** Whether `inner` is the block `outer` or inside it. */
export const contains = (outer: Block, inner: string): boolean => outer.id === inner || walk(listsIn(outer).flat()).some((b) => b.id === inner);

/** Whether a block may go at a place: its type there, and never into itself. */
export function mayPut(blocks: Block[], block: Pick<Block, 'type'> & { id?: string }, place: Place): boolean {
  if (place.parent !== null && !listAt(blocks, place)) return false;
  if (!allowed(insideOf(blocks, place), block.type)) return false;
  if (block.id && place.parent !== null) {
    const it = findBlock(blocks, block.id);
    if (it && contains(it, place.parent)) return false;
  }
  return true;
}

/** A block put at `index` of the list at `place`; the tree as it was if it may not go there. */
export function insertBlock(blocks: Block[], place: Place, index: number, block: Block): Block[] {
  if (!mayPut(blocks, { type: block.type }, place)) return blocks;
  return editList(blocks, place, (list) => [...list.slice(0, index), block, ...list.slice(index)]);
}

/**
 * A block moved to `index` of the list at `place`, the index said as the list is before it leaves: dropped on the line
 * between two blocks, it falls there. The tree as it was if it may not go there.
 */
export function moveBlock(blocks: Block[], id: string, place: Place, index: number): Block[] {
  const from = whereIs(blocks, id);
  const block = findBlock(blocks, id);
  if (!from || !block || !mayPut(blocks, block, place)) return blocks;
  const to = samePlace(from.place, place) && from.index < index ? index - 1 : index;
  if (samePlace(from.place, place) && to === from.index) return blocks;
  return editList(removeBlock(blocks, id), place, (list) => [...list.slice(0, to), block, ...list.slice(to)]);
}

/** A block again, with ids of its own, and those inside it too. */
export function copyBlock(b: Block): Block {
  if (b.type === 'section') return { ...b, id: newId(), blocks: b.blocks.map(copyBlock) };
  if (b.type === 'columns') return { ...b, id: newId(), columns: b.columns.map((c) => c.map(copyBlock)) };
  return { ...b, id: newId() } as Block;
}

/** A block copied right after itself. */
export function duplicateBlock(blocks: Block[], id: string): { blocks: Block[]; copy?: Block } {
  const at = whereIs(blocks, id);
  const block = findBlock(blocks, id);
  if (!at || !block) return { blocks };
  const copy = copyBlock(block);
  return { blocks: editList(blocks, at.place, (list) => [...list.slice(0, at.index + 1), copy, ...list.slice(at.index + 1)]), copy };
}
