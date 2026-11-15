import { Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ACCOUNT_NAV_GUEST, PRIMARY_NAV, type NavItem } from '../../../core/config/navigation';
import { SITE_CONFIG } from '../../../core/config/site-config';
import { CatalogService } from '../../../core/services/catalog.service';
import { SearchUiStore } from '../../../core/services/search-ui.store';
import { IconComponent } from '../icon/icon';
import { OffcanvasComponent } from '../offcanvas/offcanvas';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle';
import { DropdownDirective, DropdownMenuDirective, DropdownToggleDirective } from '../../directives/dropdown';
import type { UiIconName } from '../../icons/ui-icons.generated';

@Component({
  selector: 'cma-navbar',
  imports: [
    NgOptimizedImage,
    RouterLink,
    RouterLinkActive,
    IconComponent,
    OffcanvasComponent,
    ThemeToggleComponent,
    DropdownDirective,
    DropdownMenuDirective,
    DropdownToggleDirective,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  protected readonly site = inject(SITE_CONFIG);
  protected readonly accountLinks = ACCOUNT_NAV_GUEST;
  protected readonly menuOpen = signal(false);
  private readonly catalog = inject(CatalogService);
  private readonly searchUi = inject(SearchUiStore);

  /** Primary navigation with the technology categories appended to the Tutorials group. */
  protected readonly nav = computed<NavItem[]>(() =>
    PRIMARY_NAV.map((item) =>
      item.kind === 'group' && item.label === 'Tutorials'
        ? {
            ...item,
            links: [
              ...item.links,
              ...this.catalog.categories().map((category) => ({
                kind: 'link' as const,
                label: category.name,
                path: `/tutorials/category/${category.slug}`,
                icon: category.icon as UiIconName,
              })),
            ],
          }
        : item,
    ),
  );

  protected openSearch(): void {
    this.searchUi.open();
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
