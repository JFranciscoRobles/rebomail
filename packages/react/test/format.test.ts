import { describe, expect, it } from 'vitest';
import { addLink, runsOf, toggleMark, writtenAt } from '../src/format';

describe('the marks of what is selected', () => {
  it('puts bold around it, the selection still on the words', () => {
    expect(toggleMark({ text: 'a big house', start: 2, end: 5 }, 'bold')).toEqual({ text: 'a **big** house', start: 4, end: 7 });
  });

  it('takes bold away when it is already there, around it or inside it', () => {
    expect(toggleMark({ text: 'a **big** house', start: 4, end: 7 }, 'bold')).toEqual({ text: 'a big house', start: 2, end: 5 });
    expect(toggleMark({ text: 'a **big** house', start: 2, end: 9 }, 'bold')).toEqual({ text: 'a big house', start: 2, end: 5 });
  });

  it('does not take bold for italic', () => {
    expect(toggleMark({ text: 'a **big** house', start: 4, end: 7 }, 'italic')).toEqual({ text: 'a ***big*** house', start: 5, end: 8 });
    expect(toggleMark({ text: 'a *big* house', start: 3, end: 6 }, 'italic')).toEqual({ text: 'a big house', start: 2, end: 5 });
  });

  it('with nothing selected, puts the marks with the caret between them', () => {
    expect(toggleMark({ text: 'ab', start: 1, end: 1 }, 'bold')).toEqual({ text: 'a****b', start: 3, end: 3 });
  });

  it('makes a link of it, its address selected to be typed', () => {
    const made = addLink({ text: 'see this now', start: 4, end: 8 });
    expect(made.text).toBe('see [this](https://) now');
    expect(made.text.slice(made.start, made.end)).toBe('https://');
    expect(addLink({ text: '', start: 0, end: 0 }).text).toBe('[link](https://)');
  });
});

describe('a text as it shows', () => {
  it('takes its marks away and puts them on its pieces, each where it starts as written', () => {
    expect(runsOf('a **big** *new* [house](https://x.com)')).toEqual([
      { text: 'a ', start: 0 },
      { text: 'big', start: 4, bold: true },
      { text: ' ', start: 9 },
      { text: 'new', start: 11, italic: true },
      { text: ' ', start: 15 },
      { text: 'house', start: 17, link: 'https://x.com' },
    ]);
  });

  it('puts marks inside marks, and leaves stars that mark nothing', () => {
    expect(runsOf('[**go**](/x)')).toEqual([{ text: 'go', start: 3, bold: true, link: '/x' }]);
    expect(runsOf('2*3*4 and * alone')).toEqual([{ text: '2*3*4 and * alone', start: 0 }]);
  });

  it('finds where a click on it falls in the text as written', () => {
    const text = 'a **big** house';
    const runs = runsOf(text);
    // After "a b", shown, is after "a **b", written.
    expect(writtenAt(runs, 3, text.length)).toBe(5);
    expect(writtenAt(runs, 'a big house'.length, text.length)).toBe(text.length);
  });
});
