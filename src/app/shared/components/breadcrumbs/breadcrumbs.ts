import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

@Component({
  selector: 'cma-breadcrumbs',
  imports: [RouterLink],
  template: `
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb mb-3 small">
        @for (item of items(); track $index; let last = $last) {
          <li
            class="breadcrumb-item"
            [class.active]="last"
            [attr.aria-current]="last ? 'page' : null"
          >
            @if (item.path && !last) {
              <a [routerLink]="item.path">{{ item.label }}</a>
            } @else {
              {{ item.label }}
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class BreadcrumbsComponent {
  readonly items = input.required<readonly BreadcrumbItem[]>();
}
