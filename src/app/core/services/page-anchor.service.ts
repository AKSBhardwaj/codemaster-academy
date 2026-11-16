import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Location } from '@angular/common';
import { publicPath } from '../../../content-schema/site-constants';

/** A bare #fragment resolves against <base>, so nested static pages need their current path. */
@Injectable({ providedIn: 'root' })
export class PageAnchorService {
  private readonly router = inject(Router);
  private readonly path = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: inject(Location).path(true) || this.router.url },
  );

  href(fragment = ''): string {
    return publicPath(this.path().split('#')[0] || '/') + '#' + encodeURIComponent(fragment);
  }
}
