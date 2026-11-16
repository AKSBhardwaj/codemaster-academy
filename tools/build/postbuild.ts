/**
 * Post-build step for static hosting: copies the prerendered not-found page to browser/404.html,
 * which GitHub Pages, Netlify, Cloudflare Pages and most static hosts serve for unknown URLs.
 */
import { copyFile, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { supplementCriticalTheme } from './critical-theme';
import {
  absoluteSiteUrl,
  SITE_BASE_PATH,
  SITE_NAME,
} from '../../src/content-schema/site-constants';

const ROOT = resolve(import.meta.dirname, '..', '..');
const BROWSER_DIR = resolve(ROOT, 'dist', 'codemaster-academy', 'browser');

async function main(): Promise<void> {
  const source = resolve(BROWSER_DIR, '404', 'index.html');
  await stat(source);
  await copyFile(source, resolve(BROWSER_DIR, '404.html'));
  await copyFile(
    resolve(BROWSER_DIR, '../3rdpartylicenses.txt'),
    resolve(BROWSER_DIR, '3rdpartylicenses.txt'),
  );
  await writeFile(resolve(BROWSER_DIR, '.nojekyll'), '');
  await writeFile(
    resolve(BROWSER_DIR, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${absoluteSiteUrl('/sitemap.xml')}\n`,
  );
  await writeFile(
    resolve(BROWSER_DIR, 'site.webmanifest'),
    JSON.stringify(
      {
        id: SITE_BASE_PATH,
        name: SITE_NAME,
        short_name: 'CodeMaster',
        description: 'Learn to code with simple lessons, examples and practice.',
        start_url: SITE_BASE_PATH,
        scope: SITE_BASE_PATH,
        display: 'standalone',
        background_color: '#f8f9fd',
        theme_color: '#6246d9',
        lang: 'en',
        icons: [
          {
            src: `${SITE_BASE_PATH}brand/app-192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${SITE_BASE_PATH}brand/app-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${SITE_BASE_PATH}brand/app-maskable.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: 'My learning', url: `${SITE_BASE_PATH}dashboard/` },
          { name: 'Code playground', url: `${SITE_BASE_PATH}playground/` },
        ],
      },
      null,
      2,
    ),
  );
  const supplemented = await supplementCriticalTheme(BROWSER_DIR);
  console.log(
    `[postbuild] wrote browser/404.html and supplemented critical theme/font CSS in ${supplemented} HTML files`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
