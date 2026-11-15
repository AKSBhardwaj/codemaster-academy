import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { ContentNotFoundError, type ContentSource } from './content-source';

/**
 * Server-side content source used during `ng build` prerendering and `ng serve` SSR.
 * Reads the compiled content straight from disk so behaviour is identical in development and production builds.
 * Only referenced from app.config.server.ts; never part of the browser bundle.
 */
export class NodeContentSource implements ContentSource {
  private readonly root = resolve(process.cwd(), '.generated', 'content');

  async load<T>(relativePath: string): Promise<T> {
    const file = resolve(this.root, relativePath);
    if (!file.startsWith(this.root + sep)) throw new ContentNotFoundError(relativePath);
    try {
      return JSON.parse(await readFile(file, 'utf8')) as T;
    } catch {
      throw new ContentNotFoundError(relativePath);
    }
  }
}
