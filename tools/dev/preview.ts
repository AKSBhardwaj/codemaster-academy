/** Local preview with GitHub Pages directory routes, repository prefixes and real 404 responses. */
import {
  createServer,
  type IncomingMessage,
  type OutgoingHttpHeaders,
  type ServerResponse,
} from 'node:http';
import { createReadStream, type ReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip, type Gzip } from 'node:zlib';

function acceptsGzip(header: string | undefined): boolean {
  const encodings = new Map<string, number>();
  for (const part of header?.split(',') ?? []) {
    const [name, ...parameters] = part.trim().toLowerCase().split(';');
    const quality = parameters.find((parameter) => parameter.trim().startsWith('q='));
    const value = quality === undefined ? 1 : Number(quality.trim().slice(2));
    encodings.set(name.trim(), Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0);
  }
  // An explicit gzip;q=0 overrides a wildcard that otherwise allows compression.
  return (encodings.get('gzip') ?? encodings.get('*') ?? 0) > 0;
}

async function main(): Promise<void> {
  const root = resolve('dist/codemaster-academy/browser');
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const base = html.match(/<base href="([^"]+)"/)?.[1] ?? '/';
  const port = Number(process.env['PORT'] ?? 4173);
  const types: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.wasm': 'application/wasm',
    '.webmanifest': 'application/manifest+json',
  };

  const serve = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const cancellation = new AbortController();
    const cancel = (): void => {
      if (!res.writableFinished) cancellation.abort();
    };
    const unavailable = (): boolean =>
      cancellation.signal.aborted || req.aborted || res.destroyed || res.writableEnded;
    req.once('aborted', cancel);
    res.once('close', cancel);
    let fileStream: ReadStream | undefined;
    let compressor: Gzip | undefined;
    try {
      if (unavailable()) return;
      if (!['GET', 'HEAD'].includes(req.method ?? '')) {
        res.writeHead(405);
        res.end();
        return;
      }
      const url = new URL(req.url ?? '/', `http://localhost:${port}`);
      let pathname: string;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        res.writeHead(400);
        res.end();
        return;
      }
      if (base !== '/' && pathname === base.slice(0, -1)) {
        res.writeHead(301, { Location: base + url.search });
        res.end();
        return;
      }
      let file = resolve(root, pathname.slice(base.length));
      let status = 200;
      let fileSize: number | undefined;
      try {
        if (!pathname.startsWith(base) || (file !== root && !file.startsWith(root + sep)))
          throw new Error('Outside site');
        const info = await stat(file);
        if (unavailable()) return;
        if (info.isDirectory()) {
          if (!pathname.endsWith('/')) {
            res.writeHead(301, { Location: url.pathname + '/' + url.search });
            res.end();
            return;
          }
          file = resolve(file, 'index.html');
        }
        const fileInfo = await stat(file);
        if (!fileInfo.isFile()) throw new Error('Not a file');
        fileSize = fileInfo.size;
      } catch {
        file = resolve(root, '404.html');
        status = 404;
        fileSize = (await stat(file).catch(() => undefined))?.size;
      }
      const contentType = types[extname(file)] ?? 'application/octet-stream';
      const mediaType = contentType.split(';')[0].trim().toLowerCase();
      const compressible =
        mediaType.startsWith('text/') ||
        [
          'application/json',
          'application/xml',
          'application/manifest+json',
          'image/svg+xml',
        ].includes(mediaType);
      const gzip = compressible && acceptsGzip(req.headers['accept-encoding']);
      const headers: OutgoingHttpHeaders = {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      };
      if (compressible) headers['Vary'] = 'Accept-Encoding';
      if (gzip) headers['Content-Encoding'] = 'gzip';
      else if (fileSize !== undefined) headers['Content-Length'] = fileSize;
      // A navigation may have closed this response while file metadata was being read.
      if (unavailable()) return;
      res.writeHead(status, headers);
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      if (unavailable()) return;
      fileStream = createReadStream(file);
      // Handle errors even if pipeline setup throws before attaching its own listeners.
      fileStream.on('error', cancel);
      // Stream each response so rebuilds cannot leave stale compressed copies in memory.
      if (gzip) {
        compressor = createGzip({ level: 6 });
        compressor.on('error', cancel);
        await pipeline(fileStream, compressor, res, { signal: cancellation.signal });
      } else {
        await pipeline(fileStream, res, { signal: cancellation.signal });
      }
    } finally {
      req.off('aborted', cancel);
      res.off('close', cancel);
      // This also runs when pipeline setup throws synchronously or the browser disconnects.
      fileStream?.destroy();
      compressor?.destroy();
    }
  };

  createServer((req, res) => {
    // Request failures must not become unhandled rejections that stop every other preview tab.
    void serve(req, res).catch(() => {
      if (!res.destroyed) res.destroy();
    });
  }).listen(port, '127.0.0.1', () => console.log(`[preview] http://localhost:${port}${base}`));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
