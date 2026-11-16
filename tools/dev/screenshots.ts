/**
 * Captures screenshots of key pages at the responsive breakpoints for visual review.
 * By default it serves the production build (dist/codemaster-academy/browser) on a local port;
 * pass a base URL to screenshot a running server instead.
 *   npx tsx tools/dev/screenshots.ts [baseUrl]
 * Output: tmp/screenshots/<page>-<width>[-dark].png
 */
import { createServer, type Server } from 'node:http';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from '@playwright/test';

const require = createRequire(import.meta.url);
// serve-handler is the engine behind the `serve` CLI (dev dependency).
const handler = require('serve-handler') as (
  req: import('node:http').IncomingMessage,
  res: import('node:http').ServerResponse,
  options: Record<string, unknown>,
) => Promise<void>;

const ROOT = resolve(import.meta.dirname, '..', '..');
const DIST = resolve(ROOT, 'dist', 'codemaster-academy', 'browser');
const OUT_DIR = resolve(ROOT, 'tmp', 'screenshots');

const pages = [
  { name: 'home', path: '/' },
  { name: 'start', path: '/start' },
  { name: 'tutorials', path: '/tutorials' },
  { name: 'tutorial-layout', path: '/tutorials/html' },
  { name: 'lesson', path: '/tutorials/html/introduction' },
  { name: 'learning', path: '/dashboard' },
  { name: 'settings', path: '/settings' },
  { name: 'contact', path: '/contact' },
  { name: 'not-found', path: '/does-not-exist' },
];
const viewports = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 800 },
  { width: 1440, height: 900 },
];

function startStaticServer(): Promise<{ server: Server; url: string }> {
  return new Promise((done) => {
    const server = createServer((req, res) =>
      handler(req, res, {
        public: DIST,
        cleanUrls: true,
      }),
    );
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      done({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  let baseUrl = process.argv[2];
  let server: Server | undefined;
  if (!baseUrl) {
    const started = await startStaticServer();
    server = started.server;
    baseUrl = started.url;
  }
  const browser = await chromium.launch();
  try {
    for (const viewport of viewports) {
      for (const scheme of ['light', 'dark'] as const) {
        if (scheme === 'dark' && viewport.width !== 1440 && viewport.width !== 375) continue;
        const context = await browser.newContext({ viewport, colorScheme: scheme });
        const page = await context.newPage();
        for (const target of pages) {
          await page.goto(`${baseUrl}${target.path}`, { waitUntil: 'networkidle' });
          const suffix = scheme === 'dark' ? '-dark' : '';
          await page.screenshot({
            path: resolve(OUT_DIR, `${target.name}-${viewport.width}${suffix}.png`),
            fullPage: target.name === 'home',
          });
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
    server?.close();
  }
  console.log(`[screenshots] written to ${OUT_DIR}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
