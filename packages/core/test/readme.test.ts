// The examples of the READMEs, as they are written: if one stops working, so does this.

import { describe, expect, it } from 'vitest';
import { blankEmail, type CustomBlock, EMAIL, insertBlock, makeBlock, moveBlock, problemsOf, renderEmail, sampleEmail } from '../src';

describe('the examples of the READMEs', () => {
  it('builds an email, moves a heading into a column, and renders it', () => {
    let email = blankEmail({ name: 'Rebo Studio', accent: '#3b63fb' });
    const row = makeBlock('columns');
    const hello = { ...makeBlock('heading'), text: 'Hi {name}' };
    email = { ...email, subject: 'Hi {name}', blocks: insertBlock(insertBlock(email.blocks, EMAIL, 0, row), EMAIL, 1, hello) };
    email = { ...email, blocks: moveBlock(email.blocks, hello.id, { parent: row.id, column: 1 }, 0) };
    expect(problemsOf(email)).toEqual([{ code: 'empty-layout', block: row.id, type: 'columns', column: 0 }]);
    expect(renderEmail(email, { values: { name: 'Ana' } }).html).toContain('>Hi Ana</h2>');
  });

  it('renders the sample with the options of the quick start', () => {
    const { subject, html, text } = renderEmail(sampleEmail('en'), {
      values: { name: 'Ana' },
      base: 'https://example.com',
      link: (url) => `https://example.com/t?u=${encodeURIComponent(url)}`,
      footer: 'Rebo Studio · 1 Main St.',
      unsubscribe: 'https://example.com/unsubscribe/abc',
    });
    expect(subject).toBe("Ana, here is what's new this month");
    expect(html).toContain('href="https://example.com/t?u=https%3A%2F%2Fexample.com"');
    expect(text).toContain('Unsubscribe: https://example.com/unsubscribe/abc');
  });

  it('draws a custom block as the application says', () => {
    const product: CustomBlock = {
      html: (block, ctx) => `<p style="color:${ctx.inks.strong}">${block.data.name}</p>${ctx.button('Buy', String(block.data.url))}`,
      text: (block) => `${block.data.name}`,
      complete: (block) => !!block.data.name,
    };
    const email = { ...blankEmail(), subject: 'New', blocks: [{ id: 'p', type: 'custom' as const, kind: 'product', data: { name: 'Chair', url: 'https://x.com/chair' } }] };
    const out = renderEmail(email, { custom: { product } });
    expect(out.html).toContain('<p style="color:#18181b">Chair</p>');
    expect(out.html).toContain('>Buy</a>');
    expect(out.text).toContain('Chair');
  });
});
