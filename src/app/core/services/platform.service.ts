import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Answers "where is this code running?" so browser-only APIs are never touched during prerendering. */
@Injectable({ providedIn: 'root' })
export class PlatformService {
  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly isServer = !this.isBrowser;
}
