import { describe, expect, it } from 'vitest';
import { type Block, blankEmail, describeProblem, problemsOf, sampleEmail } from '../src';

describe('what an email lacks', () => {
  it('says a blank one has no subject and nothing in it', () => {
    expect(problemsOf(blankEmail()).map((p) => p.code)).toEqual(['no-subject', 'no-blocks']);
  });

  it('finds empty layouts and blocks without what they need, inside layouts too', () => {
    const email = {
      ...blankEmail(),
      subject: 'Hi',
      blocks: [
        { id: 's', type: 'section' as const, look: 'gray' as const, blocks: [] },
        { id: 'c', type: 'columns' as const, widths: '1-1' as const, columns: [[{ id: 'i', type: 'image' as const, src: '', alt: '', href: '' }], []] },
      ],
    };
    expect(problemsOf(email)).toEqual([
      { code: 'empty-layout', block: 's', type: 'section' },
      { code: 'empty-layout', block: 'c', type: 'columns', column: 1 },
      { code: 'incomplete', block: 'i', type: 'image' },
    ]);
  });

  it('finds links no inbox opens, but not those with a variable in them', () => {
    const email = {
      ...blankEmail(),
      subject: 'Hi',
      blocks: [
        { id: 'b', type: 'button' as const, label: 'Go', url: 'javascript:x()', color: null },
        { id: 'c', type: 'button' as const, label: 'Go', url: 'https://x.com/{id}', color: null },
        { id: 't', type: 'text' as const, text: 'See [this](ftp://x)' },
      ],
    };
    expect(problemsOf(email).map((p) => p.code === 'bad-link' && p.block)).toEqual(['b', 't']);
  });

  it('finds variables nobody fills, only when told which are', () => {
    const email = sampleEmail();
    expect(problemsOf(email)).toEqual([]);
    expect(problemsOf(email, { variables: ['name'] })).toEqual([]);
    expect(problemsOf(email, { variables: [] })).toEqual([{ code: 'unknown-variable', name: 'name' }]);
  });

  it('asks a custom block whether it is complete', () => {
    const email = { ...blankEmail(), subject: 'Hi', blocks: [{ id: 'p', type: 'custom' as const, kind: 'product', data: {} }] };
    expect(problemsOf(email)).toEqual([]);
    expect(problemsOf(email, { custom: { product: { html: () => '', complete: (b) => !!b.data.sku } } })).toEqual([{ code: 'incomplete', block: 'p', type: 'custom' }]);
  });

  it('says each in English and Spanish', () => {
    expect(describeProblem({ code: 'empty-layout', block: 'c', type: 'columns', column: 1 })).toBe('Column 2 is empty.');
    expect(describeProblem({ code: 'incomplete', block: 'i', type: 'image' }, 'es')).toBe('Le falta algo al bloque «imagen».');
  });

  it('asks the new blocks for what they need, and takes {score} for no variable', () => {
    const blocks: Block[] = [
      { id: 'm', type: 'menu', links: [{ label: 'Shop', url: '' }] },
      { id: 'c', type: 'coupon', code: ' ', text: 'Off', note: '' },
      { id: 't', type: 'table', rows: [{ label: '', value: '' }], total: false },
      { id: 'r', type: 'rating', text: '', url: 'https://x.com/?s={score}' },
      {
        id: 'g',
        type: 'gallery',
        pictures: [
          { src: '/a.jpg', alt: '', href: 'javascript:x' },
          { src: '', alt: '', href: '' },
        ],
      },
    ];
    const found = problemsOf({ ...blankEmail(), subject: 'Hi', blocks }, { variables: [] });
    expect(found.filter((p) => p.code === 'incomplete').map((p) => 'block' in p && p.block)).toEqual(['m', 'c', 't', 'g']);
    expect(found).toContainEqual({ code: 'bad-link', block: 'g', type: 'gallery', url: 'javascript:x' });
    expect(found.some((p) => p.code === 'unknown-variable')).toBe(false);
    expect(describeProblem({ code: 'incomplete', block: 'c', type: 'coupon' }, 'es')).toBe('Le falta algo al bloque «cupón».');
  });
});
