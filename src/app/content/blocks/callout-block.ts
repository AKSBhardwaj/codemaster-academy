import { Component, computed, input } from '@angular/core';
import type { CalloutBlock } from '../../core/models/content';
import { IconComponent } from '../../shared/components/icon/icon';
import { InlineMarkupComponent } from '../../shared/components/inline-markup/inline-markup';
import { UI_ICONS, type UiIconName } from '../../shared/icons/ui-icons.generated';

@Component({
  selector: 'cma-callout-block',
  imports: [IconComponent, InlineMarkupComponent],
  template: `
    <aside class="cma-callout" [attr.aria-label]="block().title">
      <span class="cma-callout__icon"><cma-icon [name]="icon()" [size]="20" /></span>
      <div>
        <div class="cma-callout__title">{{ block().title }}</div>
        <div><cma-inline [text]="block().text" /></div>
      </div>
    </aside>
  `,
})
export class CalloutBlockComponent {
  readonly block = input.required<CalloutBlock>();
  protected readonly icon = computed<UiIconName>(() => {
    const requested = this.block().icon;
    return requested && requested in UI_ICONS ? (requested as UiIconName) : 'lightbulb';
  });
}
