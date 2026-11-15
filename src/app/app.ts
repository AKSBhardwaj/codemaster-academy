import { Component, Injector, afterNextRender, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { FooterComponent } from './shared/components/footer/footer';
import { SearchDialogComponent } from './shared/components/search-dialog/search-dialog';
import { SeoService } from './core/services/seo.service';
import { ThemeStore } from './core/services/theme.store';
import { PlatformService } from './core/services/platform.service';
import { SearchUiStore } from './core/services/search-ui.store';

@Component({
  selector: 'cma-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, SearchDialogComponent],
  template: `
    <a class="cma-skip-link" href="#main-content">Skip to main content</a>
    <cma-navbar />
    <main id="main-content" class="cma-main" tabindex="-1">
      <router-outlet />
    </main>
    <cma-footer />
    <!-- Deferred until idle so the search UI and forms stay out of the initial bundle; opening earlier is queued by the store. Placed after the footer so the late insertion never shifts layout or hydration order of visible content. -->
    @defer (on idle) {
      <cma-search-dialog />
    }
  `,
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class App {
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly platform = inject(PlatformService);
  private readonly searchUi = inject(SearchUiStore);

  constructor() {
    inject(ThemeStore);
    inject(SeoService).watchRoutes();
    if (this.platform.isBrowser) this.manageFocusOnNavigation();
  }

  /** Ctrl+K / Cmd+K toggles the global search dialog. */
  protected onKeydown(event: Event): void {
    const key = event as KeyboardEvent;
    if ((key.ctrlKey || key.metaKey) && key.key.toLowerCase() === 'k') {
      key.preventDefault();
      this.searchUi.toggle();
    }
  }

  /** Moves keyboard focus to the main landmark after client-side navigations (not on initial load or anchor jumps). */
  private manageFocusOnNavigation(): void {
    let first = true;
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (first) {
          first = false;
          return;
        }
        if (event.urlAfterRedirects.includes('#')) return;
        afterNextRender(
          () => document.getElementById('main-content')?.focus({ preventScroll: true }),
          {
            injector: this.injector,
          },
        );
      });
  }
}
