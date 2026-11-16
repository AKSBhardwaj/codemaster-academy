import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'cma-mobile-tabs',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  template: `
    <nav class="cma-mobile-tabs" aria-label="Quick navigation">
      <a
        routerLink="/"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        ariaCurrentWhenActive="page"
        ><cma-icon name="house" [size]="21" /><span>Home</span></a
      >
      <a routerLink="/tutorials" routerLinkActive="active" ariaCurrentWhenActive="page"
        ><cma-icon name="book" [size]="21" /><span>Learn</span></a
      >
      <a routerLink="/playground" routerLinkActive="active" ariaCurrentWhenActive="page"
        ><cma-icon name="code-slash" [size]="21" /><span>Play</span></a
      >
      <a routerLink="/dashboard" routerLinkActive="active" ariaCurrentWhenActive="page"
        ><cma-icon name="speedometer2" [size]="21" /><span>My learning</span></a
      >
    </nav>
  `,
  styles: `
    .cma-mobile-tabs {
      display: none;
    }
    @media (max-width: 991.98px) {
      .cma-mobile-tabs {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1035;
        height: calc(var(--cma-mobile-nav-height) + env(safe-area-inset-bottom));
        padding: 0.45rem max(0.6rem, env(safe-area-inset-right))
          calc(0.45rem + env(safe-area-inset-bottom)) max(0.6rem, env(safe-area-inset-left));
        background: color-mix(in srgb, var(--cma-surface) 96%, transparent);
        backdrop-filter: blur(16px);
        border-top: 1px solid var(--cma-border);
        box-shadow: 0 -4px 28px rgba(17, 18, 27, 0.04);
      }
      a {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 0.3rem;
        border-radius: 0.85rem;
        color: var(--cma-text-muted);
        font-size: 0.65rem;
        font-weight: 700;
        text-decoration: none;
      }
      a.active {
        color: var(--cma-accent);
        background: var(--cma-accent-soft);
      }
    }
    @media print {
      .cma-mobile-tabs {
        display: none;
      }
    }
  `,
})
export class MobileTabsComponent {}
