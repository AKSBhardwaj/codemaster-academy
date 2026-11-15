import { InjectionToken, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/** Base URL (no trailing slash) of the compiled content files. */
export const CONTENT_BASE_URL = '/assets/content';

/**
 * Where compiled content JSON comes from. The browser uses HTTP; the prerender/server build reads the files
 * from disk (see NodeContentSource). A future REST API or CMS becomes another implementation of this interface.
 */
export interface ContentSource {
  load<T>(relativePath: string): Promise<T>;
}

export class HttpContentSource implements ContentSource {
  private readonly http = inject(HttpClient);

  load<T>(relativePath: string): Promise<T> {
    return firstValueFrom(this.http.get<T>(`${CONTENT_BASE_URL}/${relativePath}`));
  }
}

export const CONTENT_SOURCE = new InjectionToken<ContentSource>('CONTENT_SOURCE', {
  providedIn: 'root',
  factory: () => new HttpContentSource(),
});

/** Error thrown when a content file does not exist (404) or cannot be parsed. */
export class ContentNotFoundError extends Error {
  constructor(public readonly path: string) {
    super(`Content not found: ${path}`);
  }
}
