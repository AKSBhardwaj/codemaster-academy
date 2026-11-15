import { Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon';
import type { UiIconName } from '../../icons/ui-icons.generated';

/** Consistent empty/zero-results presentation with projected actions. */
@Component({
  selector: 'cma-empty-state',
  imports: [IconComponent],
  template: `
    <div class="cma-empty-state" role="status">
      <span class="cma-empty-state__icon"><cma-icon [name]="icon()" [size]="24" /></span>
      <p class="cma-empty-state__title">{{ title() }}</p>
      @if (text()) {
        <p class="cma-empty-state__text">{{ text() }}</p>
      }
      <div class="d-flex flex-wrap justify-content-center gap-2"><ng-content /></div>
    </div>
  `,
  styles: `
    .cma-empty-state {
      text-align: center;
      padding: 2rem 1rem;
      border: 1px dashed var(--cma-border-strong);
      border-radius: var(--cma-radius-lg);
      background: var(--cma-bg-secondary);
    }
    .cma-empty-state__icon {
      display: inline-flex;
      padding: 0.75rem;
      border-radius: 50%;
      color: var(--cma-text-secondary);
      background: var(--cma-surface);
      border: 1px solid var(--cma-border);
      margin-bottom: 0.75rem;
    }
    .cma-empty-state__title {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .cma-empty-state__text {
      color: var(--cma-text-secondary);
      max-width: 48ch;
      margin: 0 auto 1rem;
    }
  `,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly text = input('');
  readonly icon = input<UiIconName>('info-circle');
}
