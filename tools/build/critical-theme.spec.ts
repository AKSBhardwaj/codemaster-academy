import { strict as assert } from 'node:assert';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import {
  extractCriticalTheme,
  injectCriticalTheme,
  supplementCriticalTheme,
} from './critical-theme';

const css =
  ':root{--bg:white}[data-bs-theme=dark]{--bg:#11121b}.unused{color:red}@media(min-width:10px){.light{color:red}@supports(display:grid){[data-bs-theme="dark"] .btn{color:white}}}@font-face{font-family:Manrope;src:url(media/manrope.woff2) format("woff2");font-display:swap}';
// This is the exact loader emitted by the current Beasties production build.
const immediateLoader =
  "<script>document.querySelectorAll('link[data-beasties-media]').forEach(function(l){l.media=l.getAttribute('data-beasties-media');l.removeAttribute('data-beasties-media')})</script>";
const noscript = '<noscript><link rel="stylesheet" href="styles-ABC.css"></noscript>';
const page = (base = '/') =>
  `<html><head><base href="${base}"><style>:root{--bg:white}</style><link rel="stylesheet" href="styles-ABC.css" media="print" data-beasties-media="all">${noscript}<style>.component{color:blue}</style></head><body><main>Readable content</main><script id="ng-state" type="application/json">{"kept":true}</script>${immediateLoader}</body></html>`;

test('extracts dark rules and font faces in original order with nested conditions intact', () => {
  const theme = extractCriticalTheme(css);
  assert.equal(
    theme.css,
    '[data-bs-theme=dark]{--bg:#11121b}@media(min-width:10px){@supports(display:grid){[data-bs-theme="dark"] .btn{color:white}}}@font-face{font-family:Manrope;src:url(media/manrope.woff2) format("woff2");font-display:swap}',
  );
  assert.deepEqual(theme.fonts, ['media/manrope.woff2']);
});

test('preserves nesting parents and chooses one WOFF2 source without duplicate preloads', () => {
  const theme = extractCriticalTheme(
    '.panel{padding:1rem;@media(print){[data-bs-theme=dark] &{color:white}}}@font-face{src:url(a.woff),url(a.woff2)}@font-face{src:url(a.woff2)}',
  );
  assert.match(theme.css, /^\.panel\{@media\(print\)\{\[data-bs-theme=dark\] &\{color:white\}\}\}/);
  assert.deepEqual(theme.fonts, ['a.woff2']);
});

test('adds early prefixed preload and keeps supplemental CSS between critical and full CSS', () => {
  const original = page('/school/');
  const output = injectCriticalTheme(original, 'styles-ABC.css', extractCriticalTheme(css));
  assert.match(output, /<base href="\/school\/">\s*<link data-cma-critical-font/);
  assert.match(output, /href="\/school\/media\/manrope\.woff2" crossorigin="anonymous"/);
  assert(output.indexOf('--bg:white') < output.indexOf('id="cma-critical-theme"'));
  assert(output.indexOf('id="cma-critical-theme"') < output.indexOf('rel="stylesheet"'));
  assert(output.indexOf('rel="stylesheet"') < output.indexOf('.component{'));
  assert(output.includes('<main>Readable content</main>'));
  assert(output.includes('<script id="ng-state" type="application/json">{"kept":true}</script>'));
  assert.equal(injectCriticalTheme(output, 'styles-ABC.css', extractCriticalTheme(css)), output);
});

test('uses root paths, respects existing font preloads and replaces stale own CSS', () => {
  const html = page().replace(
    '</head>',
    '<link rel="preload" as="font" href="media/manrope.woff2" crossorigin></head>',
  );
  const first = injectCriticalTheme(html, 'styles-ABC.css', extractCriticalTheme(css));
  assert.equal((first.match(/as="font"/g) ?? []).length, 1);
  const second = injectCriticalTheme(first, 'styles-ABC.css', {
    css: '[data-bs-theme=dark]{--bg:black}',
    fonts: ['media/new.woff2'],
  });
  assert.equal((second.match(/id="cma-critical-theme"/g) ?? []).length, 1);
  assert(!second.includes('--bg:#11121b'));
  assert(second.includes('href="/media/new.woff2"'));
});

test('replaces the exact built loader before all stylesheets and preserves fallback and scripts', () => {
  const themeScript = '<script>document.documentElement.dataset.bsTheme="dark"</script>';
  const replayScript = '<script>window.__jsaction_bootstrap(document.body,"ng",["click"])</script>';
  const moduleScript = '<script src="main-ABC.js" type="module"></script>';
  const unrelatedScript =
    "<script>document.querySelectorAll('link[data-beasties-media]').forEach(function(l){console.log(l)})</script>";
  const original = page('/school/')
    .replace('<style>', themeScript + '<style>')
    .replace(
      '<link rel="stylesheet"',
      '<link rel="stylesheet" href="other.css" media="print" data-beasties-media="screen"><link rel="stylesheet"',
    )
    .replace('</body>', replayScript + moduleScript + unrelatedScript + '</body>');
  const theme = extractCriticalTheme(css);
  const output = injectCriticalTheme(original, 'styles-ABC.css', theme);
  assert(!output.includes(immediateLoader));
  assert(output.indexOf('id="cma-stylesheet-loader"') < output.indexOf('rel="stylesheet"'));
  assert(output.indexOf(themeScript) < output.indexOf('id="cma-critical-theme"'));
  for (const unchanged of [noscript, themeScript, replayScript, moduleScript, unrelatedScript]) {
    assert(output.includes(unchanged));
  }
  assert.match(output, /href="other.css" media="print" data-beasties-media="screen"/);
  assert.match(output, /href="styles-ABC.css" media="print" data-beasties-media="all"/);
  assert(!/\sonload\s*=/.test(output));
  assert.equal(injectCriticalTheme(output, 'styles-ABC.css', theme), output);
  assert.equal((output.match(/id="cma-stylesheet-loader"/g) ?? []).length, 1);
});

test('captures load events and activates only the stylesheet that finished loading', () => {
  const output = injectCriticalTheme(page(), 'styles-ABC.css', extractCriticalTheme(css));
  const script = output.match(/<script id="cma-stylesheet-loader">([\s\S]*?)<\/script>/)?.[1];
  assert(script);
  let onLoad: ((event: { target: unknown }) => void) | undefined;
  runInNewContext(script, {
    document: {
      addEventListener(type: string, handler: typeof onLoad, capture: boolean) {
        assert.equal(type, 'load');
        assert.equal(capture, true);
        assert.equal(onLoad, undefined);
        onLoad = handler;
      },
    },
  });
  assert(onLoad);
  const link = (originalMedia?: string) => {
    const attributes = new Map<string, string>();
    if (originalMedia !== undefined) attributes.set('data-beasties-media', originalMedia);
    return {
      tagName: 'LINK',
      media: 'print',
      hasAttribute: (name: string) => attributes.has(name),
      getAttribute: (name: string) => attributes.get(name) ?? null,
      removeAttribute: (name: string) => attributes.delete(name),
    };
  };
  const first = link('all');
  const pending = link('screen and (min-width: 40em)');
  const unmarked = link();
  const image = { ...link('all'), tagName: 'IMG' };
  for (const target of [null, {}, { tagName: 'SCRIPT' }, image, unmarked]) onLoad({ target });
  assert.equal(first.media, 'print');
  assert.equal(pending.media, 'print');
  assert.equal(image.media, 'print');
  assert.equal(unmarked.media, 'print');
  onLoad({ target: first });
  assert.equal(first.media, 'all');
  assert(!first.hasAttribute('data-beasties-media'));
  assert.equal(pending.media, 'print');
  assert(pending.hasAttribute('data-beasties-media'));
  first.media = 'speech';
  onLoad({ target: first });
  assert.equal(first.media, 'speech');
  onLoad({ target: pending });
  assert.equal(pending.media, 'screen and (min-width: 40em)');
  assert(!pending.hasAttribute('data-beasties-media'));
});

test('does not add a loader when the HTML has no deferred stylesheet', () => {
  const html = page().replace(' data-beasties-media="all"', '').replace(immediateLoader, '');
  const output = injectCriticalTheme(html, 'styles-ABC.css', extractCriticalTheme(css));
  assert(!output.includes('id="cma-stylesheet-loader"'));
  assert(output.includes(noscript));
});

test('processes prerendered and CSR HTML and fails on missing required output', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cma-critical-theme-'));
  try {
    await writeFile(join(root, 'index.html'), page('/school/'));
    await assert.rejects(supplementCriticalTheme(root), /needs one built global/);
    assert.equal(await readFile(join(root, 'index.html'), 'utf8'), page('/school/'));
    await writeFile(join(root, 'styles-ABC.css'), css);
    await assert.rejects(supplementCriticalTheme(root), /font is missing/);
    await mkdir(join(root, 'media'));
    await writeFile(join(root, 'media/manrope.woff2'), 'test fixture');
    await mkdir(join(root, 'lesson'));
    await writeFile(join(root, 'lesson/index.html'), page('/school/'));
    await writeFile(join(root, 'index.csr.html'), page('/school/'));
    assert.equal(await supplementCriticalTheme(root), 3);
    for (const file of ['index.html', 'index.csr.html', 'lesson/index.html']) {
      assert.match(await readFile(join(root, file), 'utf8'), /id="cma-critical-theme"/);
    }
    const before = await readFile(join(root, 'index.html'), 'utf8');
    await supplementCriticalTheme(root);
    assert.equal(await readFile(join(root, 'index.html'), 'utf8'), before);
  } finally {
    assert(root.startsWith(join(resolve(tmpdir()), 'cma-critical-theme-')));
    await rm(root, { recursive: true, force: true });
  }
});
