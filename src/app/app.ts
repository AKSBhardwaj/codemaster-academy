import { Component, Injector, afterNextRender, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { FooterComponent } from './shared/components/footer/footer';
import { SeoService } from './core/services/seo.service';
import { ThemeStore } from './core/services/theme.store';
import { PlatformService } from './core/services/platform.service';

@Component({
  selector: 'cma-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <a class="cma-skip-link" href="#main-content">Skip to main content</a>
    <cma-navbar />
    <main id="main-content" class="cma-main" tabindex="-1">
      <router-outlet />
    </main>
    <cma-footer />
  `,
})
export class App {
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly platform = inject(PlatformService);

  constructor() {
    inject(ThemeStore);
    inject(SeoService).watchRoutes();
    if (this.platform.isBrowser) this.manageFocusOnNavigation();
  }

  /** Moves keyboard focus to the main landmark after client-side navigations (not on initial load or anchor jumps). */
  private manageFocusOnNavigation(): void {
    let first = true;
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      if (first) {
        first = false;
        return;
      }
      if (event.urlAfterRedirects.includes('#')) return;
      afterNextRender(() => document.getElementById('main-content')?.focus({ preventScroll: true }), {
        injector: this.injector,
      });
    });
  }
}
