/**
 * Post-build step for static hosting: copies the prerendered not-found page to browser/404.html,
 * which GitHub Pages, Netlify, Cloudflare Pages and most static hosts serve for unknown URLs.
 */
import { copyFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');
const BROWSER_DIR = resolve(ROOT, 'dist', 'codemaster-academy', 'browser');

async function main(): Promise<void> {
  const source = resolve(BROWSER_DIR, '404', 'index.html');
  await stat(source);
  await copyFile(source, resolve(BROWSER_DIR, '404.html'));
  console.log('[postbuild] wrote browser/404.html');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
