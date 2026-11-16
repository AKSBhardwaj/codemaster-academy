import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon';

/** Heading block for a page section with optional eyebrow, description and "view all" link. */
@Component({
  selector: 'cma-section-header',
  imports: [RouterLink, IconComponent],
  template: `
    <div class="cma-section-header">
      <div>
        @if (eyebrow()) {
          <p class="cma-eyebrow mb-1">{{ eyebrow() }}</p>
        }
        <h2 class="cma-section-header__title">{{ title() }}</h2>
        @if (description()) {
          <p class="cma-section-header__description">{{ description() }}</p>
        }
      </div>
      @if (linkPath()) {
        <a
          class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
          [routerLink]="linkPath()"
        >
          {{ linkLabel() }} <cma-icon name="arrow-right" [size]="14" />
        </a>
      }
    </div>
  `,
  styles: `
    .cma-section-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .cma-section-header__title {
      font-size: clamp(1.375rem, 2.5vw, 1.75rem);
      margin: 0;
    }
    .cma-section-header__description {
      margin: 0.375rem 0 0;
      color: var(--cma-text-secondary);
      max-width: 60ch;
    }
    @media (max-width: 575.98px) {
      .cma-section-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `,
})
export class SectionHeaderComponent {
  readonly title = input.required<string>();
  readonly eyebrow = input('');
  readonly description = input('');
  readonly linkPath = input('');
  readonly linkLabel = input('View all');
}
