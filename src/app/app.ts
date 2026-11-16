import { Component, Injector, afterNextRender, inject } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { FooterComponent } from './shared/components/footer/footer';
import { SearchDialogComponent } from './shared/components/search-dialog/search-dialog';
import { SeoService } from './core/services/seo.service';
import { ThemeStore } from './core/services/theme.store';
import { PlatformService } from './core/services/platform.service';
import { SearchUiStore } from './core/services/search-ui.store';
import { MobileTabsComponent } from './shared/components/mobile-tabs/mobile-tabs';
import { PageAnchorService } from './core/services/page-anchor.service';

@Component({
  selector: 'cma-root',
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    SearchDialogComponent,
    MobileTabsComponent,
  ],
  template: `
    <a class="cma-skip-link" [href]="anchors.href('main-content')" tabindex="0"
      >Skip to main content</a
    >
    <cma-navbar />
    <main id="main-content" class="cma-main" tabindex="-1">
      <router-outlet />
    </main>
    <cma-footer />
    <cma-mobile-tabs />
    <!-- Load search on first use; the store preserves the open request while its code loads.
         Keep it after the footer so insertion does not shift visible content or its hydration order. -->
    @defer (when searchUi.isOpen()) {
      <cma-search-dialog />
    }
  `,
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class App {
  protected readonly anchors = inject(PageAnchorService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly platform = inject(PlatformService);
  private readonly viewport = inject(ViewportScroller);
  protected readonly searchUi = inject(SearchUiStore);

  constructor() {
    inject(ThemeStore);
    inject(SeoService).watchRoutes();
    if (this.platform.isBrowser) {
      // Anchor navigation must leave the heading below both visible navigation bars.
      this.viewport.setOffset(() => [
        0,
        (document.querySelector('.cma-header')?.getBoundingClientRect().height ?? 0) +
          (document.querySelector('.cma-lesson-tools')?.getBoundingClientRect().height ?? 0) +
          16,
      ]);
      this.manageFocusOnNavigation();
    }
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
