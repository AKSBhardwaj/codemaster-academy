import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import postcss, { type ChildNode } from 'postcss';

export interface CriticalTheme {
  css: string;
  fonts: string[];
}

const DARK_SELECTOR = /\[\s*data-bs-theme\s*=\s*(?:"dark"|'dark'|dark)\s*(?:i\s*)?\]/i;
const STYLE_ID = 'cma-critical-theme';
const STYLESHEET_LOADER_ID = 'cma-stylesheet-loader';
// Match the built loader exactly so unrelated application scripts are never rewritten.
const BEASTIES_IMMEDIATE_LOADER =
  "<script>document.querySelectorAll('link[data-beasties-media]').forEach(function(l){l.media=l.getAttribute('data-beasties-media');l.removeAttribute('data-beasties-media')})</script>";
const STYLESHEET_LOADER =
  `<script id="${STYLESHEET_LOADER_ID}">` +
  "document.addEventListener('load',function(e){var l=e.target;if(l&&l.tagName==='LINK'&&l.hasAttribute('data-beasties-media')){var m=l.getAttribute('data-beasties-media');l.removeAttribute('data-beasties-media');l.media=m}},true)</script>";

/** Keep original rule order, declarations and ancestor conditions; do not re-minify built CSS. */
export function extractCriticalTheme(css: string): CriticalTheme {
  const source = postcss.parse(css);
  const select = (nodes: ChildNode[]): ChildNode[] =>
    nodes.flatMap((node): ChildNode[] => {
      if (
        (node.type === 'rule' && DARK_SELECTOR.test(node.selector)) ||
        (node.type === 'atrule' && node.name.toLowerCase() === 'font-face')
      ) {
        return [node.clone()];
      }
      if ((node.type === 'atrule' || node.type === 'rule') && node.nodes) {
        const children = select(node.nodes);
        if (children.length) return [node.clone({ nodes: children })];
      }
      return [];
    });
  const selected = source.clone({ nodes: select(source.nodes) });
  const fonts = new Set<string>();
  selected.walkAtRules('font-face', (face) => {
    face.walkDecls('src', (declaration) => {
      const urls = [
        ...declaration.value.matchAll(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)]+))\s*\)/gi),
      ]
        .map((match) => match[1] ?? match[2] ?? match[3])
        .filter((url) => !url.startsWith('data:'));
      // Preload one preferred source per face, not every fallback font format.
      const font = urls.find((url) => /\.woff2(?:[?#]|$)/i.test(url)) ?? urls[0];
      if (font) fonts.add(font);
    });
  });
  return { css: selected.toString(), fonts: [...fonts] };
}

function attribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return (match?.[1] ?? match?.[2] ?? match?.[3])?.replaceAll('&amp;', '&');
}

function documentBase(html: string): URL {
  const base = html.match(/<base\b[^>]*>/i)?.[0];
  return new URL(base ? (attribute(base, 'href') ?? '/') : '/', 'https://critical-theme.invalid/');
}

function escapeAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

/** Replace our tags and Beasties' immediate loader; retain original CSS, application HTML and hydration data. */
export function injectCriticalTheme(
  html: string,
  stylesheet: string,
  theme: CriticalTheme,
): string {
  if (!/<\/head\s*>/i.test(html))
    throw new Error('Cannot supplement critical CSS: HTML has no closing head.');
  if (/<\/style/i.test(theme.css))
    throw new Error('Cannot embed critical CSS containing a closing style tag.');
  let updated = html
    .replace(/<style\b([^>]*)>[\s\S]*?<\/style>/gi, (tag: string, attributes: string) =>
      attribute(' ' + attributes, 'id') === STYLE_ID ? '' : tag,
    )
    .replace(/<link\b[^>]*>/gi, (tag) =>
      /\sdata-cma-critical-font(?:[\s=>])/i.test(tag) ? '' : tag,
    )
    .replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (tag: string, attributes: string) =>
      tag === BEASTIES_IMMEDIATE_LOADER ||
      attribute(' ' + attributes, 'id') === STYLESHEET_LOADER_ID
        ? ''
        : tag,
    );
  const base = documentBase(updated);
  const cssUrl = new URL(stylesheet, base);
  const links = [...updated.matchAll(/<link\b[^>]*>/gi)];
  const stylesheetLink = links.find(
    (match) =>
      attribute(match[0], 'rel')?.split(/\s+/).includes('stylesheet') &&
      new URL(attribute(match[0], 'href') ?? '', base).href === cssUrl.href,
  );
  // Beasties puts its critical style before this link. Insert here so dark rules follow that style,
  // while the original full stylesheet and later component styles keep their normal cascade order.
  const offset = stylesheetLink?.index ?? updated.search(/<\/head\s*>/i);
  const style = `<style id="${STYLE_ID}">${theme.css}</style>`;
  updated = updated.slice(0, offset) + style + updated.slice(offset);
  const existingFonts = new Set(
    links
      .filter(
        (match) => attribute(match[0], 'rel') === 'preload' && attribute(match[0], 'as') === 'font',
      )
      .map((match) => new URL(attribute(match[0], 'href') ?? '', base).href),
  );
  const preloads = theme.fonts
    .map((font) => {
      const url = new URL(font, cssUrl);
      if (existingFonts.has(url.href)) return '';
      existingFonts.add(url.href);
      const href = url.origin === base.origin ? url.pathname + url.search + url.hash : url.href;
      const type = /\.woff2(?:[?#]|$)/i.test(url.href) ? ' type="font/woff2"' : '';
      return `<link data-cma-critical-font rel="preload" as="font"${type} href="${escapeAttribute(href)}" crossorigin="anonymous">`;
    })
    .join('');
  // Discover the font early, after the base URL is known, rather than waiting for the full CSS file.
  updated = /<base\b[^>]*>/i.test(updated)
    ? updated.replace(/<base\b[^>]*>/i, (tag) => tag + preloads)
    : updated.replace(/<head\b[^>]*>/i, (tag) => tag + preloads);
  // Install before any stylesheet is discovered. Resource load events do not bubble, so capture
  // them and activate only the finished stylesheet; switching pending CSS can block WebKit paint.
  return links.some((match) => /\sdata-beasties-media(?:[\s=>])/i.test(match[0]))
    ? updated.replace(/<head\b[^>]*>/i, (tag) => tag + STYLESHEET_LOADER)
    : updated;
}

async function htmlFiles(directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await htmlFiles(path)));
    else if (entry.isFile() && entry.name.endsWith('.html')) result.push(path);
  }
  return result;
}

export async function supplementCriticalTheme(browserDirectory: string): Promise<number> {
  const root = resolve(browserDirectory);
  const stylesheets = (await readdir(root)).filter((name) =>
    /^styles(?:-[\w-]+)?\.css$/.test(name),
  );
  if (stylesheets.length !== 1) {
    throw new Error(
      `Critical theme supplement needs one built global styles*.css in ${root}; found ${stylesheets.length}. Run a clean production build first.`,
    );
  }
  const stylesheet = stylesheets[0];
  const theme = extractCriticalTheme(await readFile(resolve(root, stylesheet), 'utf8'));
  const base = documentBase(await readFile(resolve(root, 'index.html'), 'utf8'));
  for (const font of theme.fonts) {
    const url = new URL(font, new URL(stylesheet, base));
    if (url.origin !== base.origin) continue;
    if (!url.pathname.startsWith(base.pathname)) {
      throw new Error(
        `Critical theme font is outside the deployment base ${base.pathname}: ${font}`,
      );
    }
    const file = resolve(root, decodeURIComponent(url.pathname.slice(base.pathname.length)));
    const relativePath = relative(root, file);
    if (relativePath === '..' || relativePath.startsWith('..' + sep) || isAbsolute(relativePath)) {
      throw new Error(`Critical theme font escapes the browser output directory: ${font}`);
    }
    try {
      if (!(await stat(file)).isFile()) throw new Error('Not a file');
    } catch {
      throw new Error(`Critical theme font is missing from the built output: ${file}`);
    }
  }
  const files = await htmlFiles(root);
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const supplemented = injectCriticalTheme(html, stylesheet, theme);
    if (supplemented !== html) await writeFile(file, supplemented);
  }
  return files.length;
}
