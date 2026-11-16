import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Category } from '../../../core/models/content';
import { IconComponent } from '../icon/icon';
import type { UiIconName } from '../../icons/ui-icons.generated';

@Component({
  selector: 'cma-category-card',
  imports: [RouterLink, IconComponent],
  template: `
    <a
      class="cma-category-card cma-card cma-card--link"
      [routerLink]="['/tutorials/category', category().slug]"
    >
      <span class="cma-category-card__icon" [style.--accent]="category().accent">
        <cma-icon [name]="icon()" [size]="22" />
      </span>
      <span class="min-w-0">
        <span class="cma-category-card__name">{{ category().name }}</span>
        <span class="cma-category-card__count"
          >{{ count() }} {{ count() === 1 ? 'technology' : 'technologies' }}</span
        >
      </span>
    </a>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .cma-category-card {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 1rem;
      height: 100%;
    }
    .cma-category-card__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 0.75rem;
      flex-shrink: 0;
      color: var(--accent);
      background: color-mix(in srgb, var(--accent) 12%, var(--cma-surface));
    }
    .cma-category-card__name {
      display: block;
      font-weight: 600;
      color: var(--cma-text);
    }
    .cma-category-card__count {
      display: block;
      font-size: 0.8125rem;
      color: var(--cma-text-secondary);
    }
  `,
})
export class CategoryCardComponent {
  readonly category = input.required<Category>();
  readonly count = input(0);
  protected icon(): UiIconName {
    return this.category().icon as UiIconName;
  }
}
