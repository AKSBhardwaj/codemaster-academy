import { effect, inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../services/auth.store';
import { PlatformService } from '../services/platform.service';

/**
 * Protects account pages. On the server and before the session has been restored the route is allowed to
 * render its neutral shell; the page itself redirects once it knows there is no user. After hydration,
 * client-side navigations are blocked immediately.
 */
/**
 * For account pages that were allowed through the guard before the session was restored (initial page load):
 * once hydrated, sends guests to the login page exactly once. It deliberately does not react to a later
 * logout, so an explicit "log out" can navigate wherever it wants without a race.
 */
export function redirectGuestAfterHydration(returnUrl: string): void {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const ref = effect(() => {
    if (!auth.hydrated()) return;
    if (!auth.isAuthenticated()) void router.navigate(['/login'], { queryParams: { returnUrl } });
    ref.destroy();
  });
}

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthStore);
  const platform = inject(PlatformService);
  const router = inject(Router);
  if (!platform.isBrowser || !auth.hydrated()) return true;
  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
