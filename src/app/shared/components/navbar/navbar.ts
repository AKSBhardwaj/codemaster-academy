import { Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ACCOUNT_NAV_GUEST, PRIMARY_NAV } from '../../../core/config/navigation';
import { SITE_CONFIG } from '../../../core/config/site-config';
import { IconComponent } from '../icon/icon';
import { OffcanvasComponent } from '../offcanvas/offcanvas';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle';
import { DropdownDirective, DropdownMenuDirective, DropdownToggleDirective } from '../../directives/dropdown';

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
  protected readonly nav = PRIMARY_NAV;
  protected readonly accountLinks = ACCOUNT_NAV_GUEST;
  protected readonly menuOpen = signal(false);
  private readonly router = inject(Router);

  protected openSearch(): void {
    // The search dialog arrives in Phase 3; until then the search page is the entry point.
    void this.router.navigate(['/search']);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
