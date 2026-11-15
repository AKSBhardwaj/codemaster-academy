import { Component, computed, input } from '@angular/core';
import { STATUS_LABEL, type TechnologyStatus } from '../../../core/models/content';
import { IconComponent } from '../icon/icon';
import type { UiIconName } from '../../icons/ui-icons.generated';

const ICONS: Record<TechnologyStatus, UiIconName> = {
  complete: 'check-circle-fill',
  'in-progress': 'hourglass-split',
  planned: 'cone-striped',
};

/** Honest completion status of a tutorial: Complete, In progress or Planned. */
@Component({
  selector: 'cma-status-badge',
  imports: [IconComponent],
  template: `
    <span class="cma-status-badge cma-status-badge--{{ status() }}" [attr.title]="title()">
      <cma-icon [name]="icon()" [size]="12" />
      {{ label() }}@if (lessons() > 0 && status() === 'in-progress') { · {{ lessons() }} lessons }
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<TechnologyStatus>();
  readonly lessons = input(0);
  protected readonly label = computed(() => STATUS_LABEL[this.status()]);
  protected readonly icon = computed(() => ICONS[this.status()]);
  protected readonly title = computed(() => {
    switch (this.status()) {
      case 'complete':
        return 'Full lesson set that passed the content checklist';
      case 'in-progress':
        return 'Lessons are being published one by one';
      default:
        return 'Catalog entry with description and prerequisites; lessons not yet published';
    }
  });
}
