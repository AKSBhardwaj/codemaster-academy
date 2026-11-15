import { Injectable, TransferState, inject, makeStateKey } from '@angular/core';
import { CONTENT_SOURCE } from '../../content/loader/content-source';
import { PlatformService } from './platform.service';

/**
 * Loads compiled content JSON with three layers of caching:
 * 1. in-memory per session (repeat navigations never refetch),
 * 2. TransferState: data loaded while prerendering is embedded in the HTML and reused on hydration,
 * 3. the CONTENT_SOURCE implementation (HTTP in the browser, disk on the server).
 */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly source = inject(CONTENT_SOURCE);
  private readonly transferState = inject(TransferState);
  private readonly platform = inject(PlatformService);
  private readonly cache = new Map<string, Promise<unknown>>();
  /** Values that have already arrived (finished loads or prerender transfer), readable synchronously. */
  private readonly settled = new Map<string, unknown>();

  load<T>(relativePath: string): Promise<T> {
    const cached = this.cache.get(relativePath);
    if (cached) return cached as Promise<T>;
    // Transferred data is settled synchronously so a `peek` in the same change detection pass already sees it.
    const transferred = this.takeTransferred<T>(relativePath);
    if (transferred !== undefined) this.settled.set(relativePath, transferred);
    const pending =
      transferred !== undefined
        ? Promise.resolve(transferred)
        : this.loadFromSource<T>(relativePath);
    this.cache.set(relativePath, pending);
    pending
      .then((value) => this.settled.set(relativePath, value))
      .catch(() => this.cache.delete(relativePath));
    return pending;
  }

  /**
   * Synchronous read of content that is already in memory: a finished load or data transferred from prerendering.
   * Resource-driven views use it as their fallback so the prerendered DOM survives hydration instead of flashing
   * a loading state while the (always asynchronous) resource loader resolves.
   */
  peek<T>(relativePath: string): T | undefined {
    if (this.settled.has(relativePath)) return this.settled.get(relativePath) as T;
    const transferred = this.takeTransferred<T>(relativePath);
    if (transferred !== undefined) {
      this.settled.set(relativePath, transferred);
      this.cache.set(relativePath, Promise.resolve(transferred));
    }
    return transferred;
  }

  private takeTransferred<T>(relativePath: string): T | undefined {
    const key = makeStateKey<T>(`content:${relativePath}`);
    if (!this.platform.isBrowser || !this.transferState.hasKey(key)) return undefined;
    const value = this.transferState.get(key, null as T);
    this.transferState.remove(key);
    return value;
  }

  private async loadFromSource<T>(relativePath: string): Promise<T> {
    const value = await this.source.load<T>(relativePath);
    if (this.platform.isServer)
      this.transferState.set(makeStateKey<T>(`content:${relativePath}`), value);
    return value;
  }
}
