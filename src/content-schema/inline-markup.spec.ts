import { collectInlineLinks, parseInlineMarkup, stripInlineMarkup } from './inline-markup';

describe('inline markup', () => {
  it('parses plain text', () => {
    expect(parseInlineMarkup('hello')).toEqual([{ kind: 'text', text: 'hello' }]);
  });

  it('parses bold, italic, code and links', () => {
    expect(parseInlineMarkup('a **b** *c* `d` [e](/f)')).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'strong', children: [{ kind: 'text', text: 'b' }] },
      { kind: 'text', text: ' ' },
      { kind: 'em', children: [{ kind: 'text', text: 'c' }] },
      { kind: 'text', text: ' ' },
      { kind: 'code', text: 'd' },
      { kind: 'text', text: ' ' },
      { kind: 'link', href: '/f', children: [{ kind: 'text', text: 'e' }] },
    ]);
  });

  it('keeps unmatched delimiters as text and does not parse markup inside code', () => {
    expect(parseInlineMarkup('2 * 3 and `**raw**`')).toEqual([
      { kind: 'text', text: '2 * 3 and ' },
      { kind: 'code', text: '**raw**' },
    ]);
  });

  it('supports nesting inside links and bold', () => {
    expect(parseInlineMarkup('[**bold link**](https://example.com)')).toEqual([
      {
        kind: 'link',
        href: 'https://example.com',
        children: [{ kind: 'strong', children: [{ kind: 'text', text: 'bold link' }] }],
      },
    ]);
  });

  it('collects links and strips markup', () => {
    const text =
      'See [HTML](/tutorials/html) and [MDN](https://developer.mozilla.org) for **more**.';
    expect(collectInlineLinks(text)).toEqual(['/tutorials/html', 'https://developer.mozilla.org']);
    expect(stripInlineMarkup(text)).toBe('See HTML and MDN for more.');
  });
});
