import { Component, computed, input } from '@angular/core';
import type { AlertBlock } from '../../core/models/content';
import { IconComponent } from '../../shared/components/icon/icon';
import { InlineMarkupComponent } from '../../shared/components/inline-markup/inline-markup';
import type { UiIconName } from '../../shared/icons/ui-icons.generated';

const ICONS: Record<AlertBlock['variant'], UiIconName> = {
  info: 'info-circle',
  warning: 'exclamation-triangle',
  success: 'check-circle',
  danger: 'x-circle',
};

const DEFAULT_TITLES: Record<AlertBlock['variant'], string> = {
  info: 'Note',
  warning: 'Common mistake',
  success: 'Good practice',
  danger: 'Warning',
};

@Component({
  selector: 'cma-alert-block',
  imports: [IconComponent, InlineMarkupComponent],
  template: `
    <div class="alert alert-{{ block().variant }}" role="note">
      <span class="alert__icon"><cma-icon [name]="icon()" [size]="18" /></span>
      <div>
        <span class="alert__title">{{ block().title ?? defaultTitle() }}</span>
        <cma-inline [text]="block().text" />
      </div>
    </div>
  `,
})
export class AlertBlockComponent {
  readonly block = input.required<AlertBlock>();
  protected readonly icon = computed(() => ICONS[this.block().variant]);
  protected readonly defaultTitle = computed(() => DEFAULT_TITLES[this.block().variant]);
}
