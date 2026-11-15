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

  load<T>(relativePath: string): Promise<T> {
    const cached = this.cache.get(relativePath);
    if (cached) return cached as Promise<T>;
    const pending = this.loadUncached<T>(relativePath);
    this.cache.set(relativePath, pending);
    pending.catch(() => this.cache.delete(relativePath));
    return pending;
  }

  private async loadUncached<T>(relativePath: string): Promise<T> {
    const key = makeStateKey<T>(`content:${relativePath}`);
    if (this.platform.isBrowser && this.transferState.hasKey(key)) {
      const value = this.transferState.get(key, null as T);
      this.transferState.remove(key);
      return value;
    }
    const value = await this.source.load<T>(relativePath);
    if (this.platform.isServer) this.transferState.set(key, value);
    return value;
  }
}
