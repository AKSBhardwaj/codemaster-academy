/** Audits the actual HTML uploaded to Pages, including pages that need no JavaScript to be indexed. */
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import {
  absoluteSiteUrl,
  publicPath,
  SITE_BASE_PATH,
  SITE_URL,
} from '../../src/content-schema/site-constants';

const root = resolve(import.meta.dirname, '../../dist/codemaster-academy/browser');
const errors: string[] = [];
const titles = new Map<string, string>();
const descriptions = new Map<string, string>();
const indexed = new Set<string>();
const rendered = new Set<string>();
const internalLinks = new Map<string, string>();
let pages = 0;

function decode(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
function attribute(tag: string, name: string): string {
  return decode(tag.match(new RegExp(`\\b${name}=(["'])([\\s\\S]*?)\\1`, 'i'))?.[2] ?? '');
}
async function* files(folder: string): AsyncGenerator<string> {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (entry.isDirectory()) yield* files(join(folder, entry.name));
    else if (entry.name === 'index.html') yield join(folder, entry.name);
  }
}
function check(ok: unknown, label: string, issue: string): void {
  if (!ok) errors.push(`${label}: ${issue}`);
}

async function main(): Promise<void> {
  if (process.env['CI'])
    check(
      SITE_URL.startsWith('https://') && !/\.example\b/.test(SITE_URL),
      'site',
      'A real HTTPS deployment URL is required.',
    );
  const catalog = JSON.parse(
    await readFile(join(root, 'assets/content/catalog/technologies.json'), 'utf8'),
  ) as { slug: string; status: string; totalLessons: number }[];
  check(
    catalog.length > 0 && catalog.every((t) => t.status === 'complete' && t.totalLessons >= 12),
    'content',
    'Every catalog topic must have a complete tutorial.',
  );
  for await (const file of files(root)) {
    pages++;
    const html = await readFile(file, 'utf8');
    const route = '/' + relative(root, dirname(file)).replace(/\\/g, '/');
    const label = route || '/';
    rendered.add(publicPath(route).replace(/\/$/, '') || '/');
    const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
    const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
    const meta = (name: string): string =>
      attribute(
        metas.find(
          (tag) => attribute(tag, 'name') === name || attribute(tag, 'property') === name,
        ) ?? '',
        'content',
      );
    const canonicalTags = [...head.matchAll(/<link\b[^>]*>/gi)]
      .map((m) => m[0])
      .filter((tag) => attribute(tag, 'rel') === 'canonical');
    const canonical = attribute(canonicalTags[0] ?? '', 'href');
    const title = decode(head.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim();
    const robots = meta('robots');
    // Angular emits a meta refresh file for legacy redirects; it is deliberately outside the sitemap.
    if (metas.some((tag) => attribute(tag, 'http-equiv').toLowerCase() === 'refresh')) continue;
    check(title.length >= 5 && title.length <= 100, label, 'Missing or overlong page title.');
    check(meta('description').length >= 20, label, 'Missing description.');
    check(
      canonicalTags.length === 1 && canonical === absoluteSiteUrl(route),
      label,
      `Canonical mismatch: ${canonical}`,
    );
    check(
      !!meta('viewport') && !meta('viewport').includes('user-scalable=no'),
      label,
      'Missing accessible viewport.',
    );
    check(
      attribute(head.match(/<base\b[^>]*>/i)?.[0] ?? '', 'href') === SITE_BASE_PATH,
      label,
      'Base path does not match the deployment.',
    );
    check(
      meta('og:url') === canonical && meta('og:title') === title,
      label,
      'Social URL/title mismatch.',
    );
    check(
      meta('og:image') === absoluteSiteUrl('/brand/og-default.png'),
      label,
      'Missing social image.',
    );
    check(meta('twitter:card') === 'summary_large_image', label, 'Missing social card.');
    check(
      robots.includes('index') && robots.includes('follow'),
      label,
      'Missing robots directive.',
    );
    const content = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    for (const match of content.matchAll(/<a\b[^>]*>/gi)) {
      const href = attribute(match[0], 'href');
      if (!href || /^(?:mailto:|tel:|blob:|data:)/i.test(href)) continue;
      try {
        const target = new URL(href, new URL(SITE_BASE_PATH, SITE_URL));
        if (target.origin === new URL(SITE_URL).origin) {
          internalLinks.set(target.pathname.replace(/\/$/, '') || '/', label);
        }
      } catch {
        errors.push(`${label}: Invalid link ${href}`);
      }
    }
    check(
      (content.match(/<h1\b/gi) ?? []).length === 1,
      label,
      'Each page needs one main heading.',
    );
    for (const match of head.matchAll(
      /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
    )) {
      try {
        JSON.parse(match[1]);
      } catch {
        errors.push(`${label}: Invalid structured data.`);
      }
    }
    if (!robots.includes('noindex')) {
      indexed.add(canonical);
      check(!titles.has(title), label, `Duplicate title (also ${titles.get(title)}).`);
      check(
        !descriptions.has(meta('description')),
        label,
        `Duplicate description (also ${descriptions.get(meta('description'))}).`,
      );
      titles.set(title, label);
      descriptions.set(meta('description'), label);
    }
  }
  const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
  for (const [target, source] of internalLinks) {
    if (rendered.has(target)) continue;
    const prefix = SITE_BASE_PATH.replace(/\/$/, '');
    if (!target.startsWith(prefix + '/')) {
      errors.push(`${source}: Link escapes the deployment path: ${target}`);
      continue;
    }
    try {
      const file = await stat(join(root, target.slice(prefix.length)));
      check(file.isFile(), source, `Link has no static page: ${target}`);
    } catch {
      errors.push(`${source}: Broken internal link: ${target}`);
    }
  }
  const listed = new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => decode(m[1])));
  for (const url of indexed) check(listed.has(url), url, 'Indexable page missing from sitemap.');
  for (const url of listed) check(indexed.has(url), url, 'Sitemap URL has no indexable HTML page.');
  check(
    (await readFile(join(root, 'robots.txt'), 'utf8')).includes(absoluteSiteUrl('/sitemap.xml')),
    'robots',
    'Sitemap URL mismatch.',
  );
  for (const asset of [
    '404.html',
    '.nojekyll',
    '3rdpartylicenses.txt',
    'site.webmanifest',
    'llms.txt',
    '.well-known/ard.json',
    'brand/og-default.png',
    'brand/app-192.png',
    'brand/app-512.png',
    'assets/sql.js/sql-wasm.wasm',
  ]) {
    try {
      await stat(join(root, asset));
    } catch {
      errors.push(`Missing deployment asset: ${asset}`);
    }
  }
  const report = {
    siteUrl: SITE_URL,
    baseHref: SITE_BASE_PATH,
    pages,
    indexable: indexed.size,
    sitemapUrls: listed.size,
    tutorials: catalog.length,
    internalLinks: internalLinks.size,
    errors,
  };
  await writeFile(resolve(root, '../seo-report.json'), JSON.stringify(report, null, 2));
  if (errors.length)
    throw new Error(`[seo] ${errors.length} errors:\n${errors.slice(0, 40).join('\n')}`);
  console.log(
    `[seo] PASS: ${pages} HTML pages, ${indexed.size} indexable URLs, ${catalog.length} complete tutorials; canonical, metadata, sitemap and static assets verified.`,
  );
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
