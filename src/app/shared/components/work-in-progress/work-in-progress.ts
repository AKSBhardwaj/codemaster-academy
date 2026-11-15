import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon';

/**
 * Honest placeholder for features scheduled in a later build phase.
 * Removed from a page as soon as the real implementation lands.
 */
@Component({
  selector: 'cma-work-in-progress',
  imports: [RouterLink, IconComponent],
  template: `
    <div class="alert alert-info d-flex gap-3 align-items-start" role="status">
      <cma-icon name="cone-striped" [size]="20" />
      <div>
        <strong>{{ feature() }} is being built.</strong>
        <span class="d-block">
          This part of the platform arrives in build phase {{ phase() }}. Meanwhile you can
          <a routerLink="/tutorials">browse the tutorials catalog</a>.
        </span>
      </div>
    </div>
  `,
})
export class WorkInProgressComponent {
  readonly feature = input.required<string>();
  readonly phase = input.required<number>();
}
