import { createSandboxDocument, isTrustedSandboxMessage, SANDBOX_CSP } from './sandbox-document';

describe('sandbox document', () => {
  it('injects the CSP and bootstrap into a full HTML document head', () => {
    const doc = createSandboxDocument(
      'html',
      '<!doctype html><html><head><title>t</title></head><body><p>x</p></body></html>',
      'abc',
    );
    expect(doc).toContain(`content="${SANDBOX_CSP}"`);
    expect(doc.indexOf('Content-Security-Policy')).toBeLessThan(doc.indexOf('<title>'));
    expect(doc).toContain('"abc"');
    expect(doc).toContain('<p>x</p>');
  });

  it('wraps JavaScript in a script tag and CSS around the sample page', () => {
    expect(createSandboxDocument('javascript', 'console.log(1)', 'n')).toContain(
      '<script>\nconsole.log(1)\n</script>',
    );
    const css = createSandboxDocument('css', 'h1{color:red}', 'n');
    expect(css).toContain('<style>\nh1{color:red}\n</style>');
    expect(css).toContain('Sample heading');
  });

  it('wraps bare fragments in a document', () => {
    const doc = createSandboxDocument('html', '<h1>Hi</h1>', 'n');
    expect(doc.startsWith('<!doctype html>')).toBe(true);
    expect(doc).toContain('<body><h1>Hi</h1></body>');
  });

  it('never allows navigation, forms or nested frames in the policy', () => {
    expect(SANDBOX_CSP).toContain("form-action 'none'");
    expect(SANDBOX_CSP).toContain("frame-src 'none'");
    expect(SANDBOX_CSP).toContain("base-uri 'none'");
  });

  it('accepts only messages from the frame, with opaque origin and matching nonce', () => {
    const frame = {};
    const good = {
      source: frame,
      origin: 'null',
      data: { v: 1, nonce: 'n1', type: 'console', level: 'log', text: 'hi' },
    };
    expect(isTrustedSandboxMessage(good, frame, 'n1')).toBe(true);
    expect(isTrustedSandboxMessage({ ...good, source: {} }, frame, 'n1')).toBe(false);
    expect(isTrustedSandboxMessage({ ...good, origin: 'https://evil.example' }, frame, 'n1')).toBe(
      false,
    );
    expect(
      isTrustedSandboxMessage({ ...good, data: { ...good.data, nonce: 'other' } }, frame, 'n1'),
    ).toBe(false);
    expect(isTrustedSandboxMessage({ ...good, data: 'string' }, frame, 'n1')).toBe(false);
  });
});
