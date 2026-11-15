import { Component, computed, inject } from '@angular/core';
import { ThemeStore, type ThemePreference } from '../../../core/services/theme.store';
import { IconComponent } from '../icon/icon';
import { DropdownDirective, DropdownMenuDirective, DropdownToggleDirective } from '../../directives/dropdown';
import type { UiIconName } from '../../icons/ui-icons.generated';

const ICONS: Record<ThemePreference, UiIconName> = { system: 'circle-half', light: 'sun', dark: 'moon-stars' };

@Component({
  selector: 'cma-theme-toggle',
  imports: [IconComponent, DropdownDirective, DropdownMenuDirective, DropdownToggleDirective],
  template: `
    <div class="dropdown" cmaDropdown>
      <button
        type="button"
        class="btn btn-ghost btn-icon"
        cmaDropdownToggle
        aria-label="Change theme"
        title="Change theme"
      >
        <cma-icon [name]="icon()" [size]="18" />
      </button>
      <ul class="dropdown-menu dropdown-menu-end" role="menu" cmaDropdownMenu aria-label="Theme">
        @for (option of theme.options; track option.value) {
          <li role="none">
            <button
              type="button"
              class="dropdown-item"
              role="menuitemradio"
              [class.active]="theme.preference() === option.value"
              [attr.aria-checked]="theme.preference() === option.value"
              (click)="theme.setPreference(option.value)"
            >
              <cma-icon [name]="iconFor(option.value)" />
              {{ option.label }}
            </button>
          </li>
        }
      </ul>
    </div>
  `,
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeStore);
  protected readonly icon = computed(() => ICONS[this.theme.preference()]);

  protected iconFor(preference: ThemePreference): UiIconName {
    return ICONS[preference];
  }
}
