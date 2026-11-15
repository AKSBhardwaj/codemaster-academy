import { Injectable, inject } from '@angular/core';
import { PlatformService } from './platform.service';

/**
 * Namespaced, versioned, failure-tolerant wrapper around localStorage.
 * Every value is JSON encoded. On the server every read returns the fallback.
 */
@Injectable({ providedIn: 'root' })
export class PersistenceService {
  private readonly platform = inject(PlatformService);
  readonly prefix = 'cma:v1:';

  read<T>(key: string, fallback: T): T {
    if (!this.platform.isBrowser) return fallback;
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  write<T>(key: string, value: T): boolean {
    if (!this.platform.isBrowser) return false;
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  remove(key: string): void {
    if (!this.platform.isBrowser) return;
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {
      /* storage unavailable */
    }
  }

  /** Removes every key written by this application. */
  clearAll(): void {
    if (!this.platform.isBrowser) return;
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) keys.push(key);
      }
      keys.forEach((key) => localStorage.removeItem(key));
    } catch {
      /* storage unavailable */
    }
  }
}
