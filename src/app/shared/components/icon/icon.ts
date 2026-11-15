import { Component, computed, input } from '@angular/core';
import { UI_ICONS, type UiIconName } from '../../icons/ui-icons.generated';

/** Renders a Bootstrap icon from generated path data (no icon font, no innerHTML). */
@Component({
  selector: 'cma-icon',
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      focusable="false"
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.aria-hidden]="label() ? null : 'true'"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label() || null"
    >
      @for (path of paths(); track path.d) {
        <path
          [attr.d]="path.d"
          [attr.fill-rule]="path.fillRule ?? null"
          [attr.clip-rule]="path.clipRule ?? null"
        />
      }
    </svg>
  `,
  host: { class: 'cma-icon' },
})
export class IconComponent {
  readonly name = input.required<UiIconName>();
  readonly size = input<number | string>(16);
  /** Accessible label; leave empty for purely decorative icons. */
  readonly label = input('');
  protected readonly paths = computed(() => UI_ICONS[this.name()] ?? []);
}
