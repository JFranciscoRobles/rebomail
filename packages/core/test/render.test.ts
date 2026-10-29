import { describe, expect, it } from 'vitest';
import { BLOCK_TYPES, blankEmail, type Block, type CustomBlock, escapeHtml, fill, inlineHtml, inlineText, makeBlock, renderEmail, variablesIn } from '../src';

const email = (blocks: Block[], subject = 'Hi {name}') => ({ ...blankEmail({ name: 'Rebo', accent: '#3b63fb' }), subject, preheader: 'Before {name} opens', blocks });

describe('the words of a block', () => {
  it('fills variables, and leaves one not given as it was', () => {
    expect(fill('Hi {name}, from { agent } {x}', { name: 'Ana', agent: 'Carlos' })).toBe('Hi Ana, from Carlos {x}');
    expect(variablesIn('{a} {b} {a} { c }')).toEqual(['a', 'b', 'c']);
  });

  it('makes bold, italic and links HTML, escaping the rest', () => {
    const html = inlineHtml('**b** *i* [go](https://x.com/?a=1&b=2) <b>no</b>\nnext', (u) => `T(${u})`, '#000000');
    expect(html).toContain('<strong>b</strong>');
    expect(html).toContain('<em>i</em>');
    expect(html).toContain('href="T(https://x.com/?a=1&amp;b=2)"');
    expect(html).toContain('&lt;b&gt;no&lt;/b&gt;');
    expect(html).toContain('<br>next');
  });

  it('does not make a link of an address no inbox should open', () => {
    expect(inlineHtml('[x](javascript:alert(1))', (u) => u, '#000000')).not.toContain('<a');
  });

  it('takes the marks away for the text', () => {
    expect(inlineText('**b** and *i* and [go](https://x.com)')).toBe('b and i and go (https://x.com)');
  });

  it('escapes all five', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe('&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
  });
});

describe('an email as an inbox reads it', () => {
  it('fills the subject and the line after it', () => {
    const out = renderEmail(email([]), { values: { name: 'Ana' } });
    expect(out.subject).toBe('Hi Ana');
    expect(out.preheader).toBe('Before Ana opens');
    expect(out.html).toContain('<title>Hi Ana</title>');
  });

  it('sends every link through what counts the clicks, made whole, but not mail and phone ones', () => {
    const out = renderEmail(
      email([
        { id: 'a', type: 'button', label: 'Go', url: '/catalog', color: null },
        { id: 'b', type: 'text', text: 'Write to [us](mailto:a@b.c) or [call](tel:123)' },
      ]),
      { base: 'https://example.com/', link: (u) => `https://t.co/?u=${encodeURIComponent(u)}` },
    );
    expect(out.html).toContain('href="https://t.co/?u=https%3A%2F%2Fexample.com%2Fcatalog"');
    expect(out.html).toContain('href="mailto:a@b.c"');
    expect(out.html).toContain('href="tel:123"');
    expect(out.text).toContain('Go: https://t.co/?u=https%3A%2F%2Fexample.com%2Fcatalog');
  });

  it('lays columns side by side at their widths, one under another on a phone', () => {
    const out = renderEmail(
      email([
        {
          id: 'c',
          type: 'columns',
          widths: '1-2',
          columns: [[{ id: 'i', type: 'image', src: 'https://x/a.png', alt: '', href: '' }], [{ id: 't', type: 'text', text: 'right' }]],
        },
      ]),
    );
    expect(out.html).toContain('width="33%"');
    expect(out.html).toContain('width="67%"');
    // 600 wide, 32 of padding each side, 16 between: 520 of room, a third of it.
    expect(out.html).toMatch(/src="https:\/\/x\/a\.png"[^>]*width="173"/);
    expect(out.html).toContain('@media (max-width:620px)');
    expect(out.html).toContain('.rm-col{display:block!important;width:100%!important');
  });

  it('draws a section and what is inside it, its words light when it is dark', () => {
    const out = renderEmail(email([{ id: 's', type: 'section', look: 'dark', blocks: [{ id: 'h', type: 'heading', text: 'Dark' }] }]));
    expect(out.html).toContain('background:#18181b;');
    expect(out.html).toMatch(/<h2[^>]*color:#ffffff;[^>]*>Dark<\/h2>/);
  });

  it('cleans HTML written by hand of what may do harm', () => {
    const out = renderEmail(
      email([
        {
          id: 'h',
          type: 'html',
          html: '<p onclick="x()" style="color:red">Hi {name}</p><script>alert(1)</script><iframe src="x"></iframe><a href="javascript:alert(1)">a</a><a href="https://ok.com">ok</a><form action="/x"><input></form><img src="/logo.png">',
        },
      ]),
      { values: { name: 'Ana' }, base: 'https://example.com', link: (u) => `T(${u})` },
    );
    expect(out.html).toContain('<p style="color:red">Hi Ana</p>');
    expect(out.html).not.toMatch(/<script|onclick|<iframe|javascript:|<form|<input/i);
    expect(out.html).toContain('href="T(https://ok.com)"');
    expect(out.html).toContain('src="https://example.com/logo.png"');
  });

  it('writes Markdown as headings, lists and quotes', () => {
    const out = renderEmail(email([{ id: 'm', type: 'markdown', text: '## Title\n- one\n- two\n1. first\n> said\n---\nplain *it*' }]));
    expect(out.html).toMatch(/<h3[^>]*>Title<\/h3>/);
    expect(out.html).toMatch(/<ul[^>]*><li[^>]*>one<\/li><li[^>]*>two<\/li><\/ul><ol/);
    expect(out.html).toContain('<em>it</em>');
    expect(out.text).toContain('Title\n- one');
  });

  it('puts the footer, the way to unsubscribe and the pixel only when given', () => {
    const bare = renderEmail(email([]));
    expect(bare.html).not.toContain('Unsubscribe');
    const full = renderEmail(email([]), { footer: 'Rebo · Main St.', unsubscribe: 'https://x/u', pixel: 'https://x/o.gif', locale: 'es' });
    expect(full.html).toContain('Rebo · Main St.');
    expect(full.html).toContain('href="https://x/u"');
    expect(full.html).toContain('Ya no quiero recibir estos correos');
    expect(full.html).toContain('src="https://x/o.gif"');
    expect(full.text).toContain('Ya no quiero recibir estos correos: https://x/u');
  });

  it('draws custom blocks as the application says, and nothing for one it does not know', () => {
    const product: CustomBlock = {
      html: (b, ctx) => `<p class="product" data-width="${ctx.width}">${String(b.data.name)}</p>`,
      text: (b) => `Product: ${String(b.data.name)}`,
    };
    const out = renderEmail(
      email([
        { id: 'p', type: 'custom', kind: 'product', data: { name: 'Chair' } },
        { id: 'q', type: 'custom', kind: 'unknown', data: {} },
      ]),
      { custom: { product } },
    );
    expect(out.html).toContain('<p class="product" data-width="536">Chair</p>');
    expect(out.text).toContain('Product: Chair');
  });

  it('gives the text of every block, those inside layouts too', () => {
    const out = renderEmail(
      email([
        { id: 'h', type: 'heading', text: 'Hello {name}' },
        { id: 's', type: 'section', look: 'gray', blocks: [{ id: 'l', type: 'list', text: 'a\nb', ordered: true }] },
        { id: 'q', type: 'quote', text: 'Good', author: 'Ana' },
      ]),
      { values: { name: 'Ana' } },
    );
    expect(out.text).toBe('Before Ana opens\n\nHELLO ANA\n\n1. a\n2. b\n\n“Good” — Ana');
  });
});

describe('every kind of block', () => {
  it('draws each one made as it starts without failing, and each one filled with what it needs', () => {
    for (const type of BLOCK_TYPES) expect(() => renderEmail(email([makeBlock(type)]))).not.toThrow();
    const out = renderEmail(
      email([
        { id: 'h', type: 'hero', src: '/cover.jpg', title: 'Big', text: 'Lead', label: 'Open', url: '/x' },
        { id: 'a', type: 'callout', text: 'Accent', tone: 'accent' },
        { id: 'g', type: 'callout', text: 'Green', tone: 'green' },
        { id: 'v', type: 'video', src: '/v.jpg', url: 'https://youtu.be/x', title: '' },
        { id: 's', type: 'social', links: { instagram: 'https://ig.com/x', website: 'https://x.com', facebook: 'javascript:x' } },
        { id: 'i', type: 'image', src: '/i.png', alt: 'Pic', href: 'https://x.com/i' },
        { id: 'd', type: 'divider' },
        { id: 'p', type: 'spacer', size: 'lg' },
        { id: 'b', type: 'button', label: 'Green', url: 'https://x.com', color: '#25d366' },
      ]),
      { base: 'https://example.com', locale: 'es' },
    );
    expect(out.html).toMatch(/<h1[^>]*>Big<\/h1>/);
    expect(out.html).toContain('src="https://example.com/cover.jpg"');
    // The accent's light, a colour of its own: inboxes mix none.
    expect(out.html).toContain('background:#edf1ff;');
    expect(out.html).toContain('background:#ecfdf5;');
    expect(out.html).toContain('▶ Ver el video');
    expect(out.html).toContain('>Instagram</a>');
    expect(out.html).toContain('>Sitio web</a>');
    expect(out.html).not.toContain('Facebook');
    expect(out.html).toContain('<a href="https://x.com/i"><img src="https://example.com/i.png" alt="Pic"');
    expect(out.html).toContain('height:48px');
    expect(out.html).toContain('background:#25d366;');
    expect(out.html).not.toMatch(/<table[^>]*width="100%"[^>]*style="margin:8px 0 18px;/);
    expect(out.text).toContain('BIG\n\nLead\n\nOpen: https://example.com/x');
    expect(out.text).toContain('Ver el video: https://youtu.be/x');
    expect(out.text).toContain('Instagram: https://ig.com/x');
  });

  it('draws a menu, a coupon, a table, a rating and a gallery', () => {
    const out = renderEmail(
      email([
        {
          id: 'm',
          type: 'menu',
          links: [
            { label: 'Shop', url: '/shop' },
            { label: 'Blog', url: 'https://x.com/blog' },
            { label: 'Bad', url: 'javascript:x' },
            { label: '', url: '/none' },
          ],
        },
        { id: 'c', type: 'coupon', code: 'HI-{name}', text: '**20%** off', note: 'Until Friday' },
        {
          id: 't',
          type: 'table',
          rows: [
            { label: 'Chair', value: '$249' },
            { label: '', value: '' },
            { label: 'Total', value: '$249' },
          ],
          total: true,
        },
        { id: 'r', type: 'rating', text: 'How did we do?', url: 'https://x.com/survey?score={score}&u={name}' },
        {
          id: 'g',
          type: 'gallery',
          pictures: [
            { src: '/a.jpg', alt: 'A', href: '' },
            { src: '/b.jpg', alt: 'B', href: 'https://x.com/b' },
            { src: '', alt: '', href: '' },
          ],
        },
      ]),
      { base: 'https://example.com', values: { name: 'Ana' }, link: (u) => `T(${u})` },
    );
    expect(out.html).toContain('href="T(https://example.com/shop)"');
    expect(out.html).toContain('>Shop</a><span');
    expect(out.html).not.toContain('>Bad<');
    expect(out.html).toContain('>HI-Ana</p>');
    expect(out.html).toContain('<strong>20%</strong> off');
    // The total, bold under a line; the empty row left out.
    expect(out.html).toMatch(/border-top:2px solid #18181b;font-weight:bold;[^"]*">Total</);
    expect(out.html.match(/<tr><td valign="top"/g)).toHaveLength(2);
    for (const n of [1, 5]) expect(out.html).toContain(`href="T(https://x.com/survey?score=${n}&amp;u=Ana)" title="${n} star`);
    // Two pictures given, each half of the width, one under another on a phone.
    expect(out.html.match(/<td class="rm-col" width="50%"/g)).toHaveLength(2);
    expect(out.html).toContain('<a href="T(https://x.com/b)"><img src="https://example.com/b.jpg" alt="B" width="262"');
    expect(out.text).toContain('Shop: T(https://example.com/shop)\nBlog: T(https://x.com/blog)');
    expect(out.text).toContain('20% off\nHI-Ana\nUntil Friday');
    expect(out.text).toContain('Chair: $249\nTotal: $249');
    expect(out.text).toContain('How did we do?\n1 star: T(https://x.com/survey?score=1&u=Ana)');
    expect(out.text).toContain('B T(https://x.com/b)');
  });
});
