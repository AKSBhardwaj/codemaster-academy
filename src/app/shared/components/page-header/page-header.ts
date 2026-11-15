import { Component, input } from '@angular/core';

/** Consistent page header band: optional eyebrow, h1, lead paragraph and projected extras (actions, breadcrumbs). */
@Component({
  selector: 'cma-page-header',
  template: `
    <div class="cma-page-header">
      <div class="container-xxl">
        <ng-content select="[slot=top]" />
        @if (eyebrow()) {
          <p class="cma-eyebrow mb-2">{{ eyebrow() }}</p>
        }
        <h1 class="mb-2">{{ title() }}</h1>
        @if (lead()) {
          <p class="lead cma-text-secondary mb-0 cma-prose">{{ lead() }}</p>
        }
        <ng-content />
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly lead = input('');
  readonly eyebrow = input('');
}
