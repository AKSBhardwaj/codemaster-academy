import { DOCUMENT, Directive, ElementRef, effect, inject, input } from '@angular/core';
import { PlatformService } from '../../core/services/platform.service';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keeps keyboard focus inside the host while active and restores the previously focused element afterwards. */
@Directive({
  selector: '[cmaFocusTrap]',
  host: { '(keydown.tab)': 'onTab($event)', '(keydown.shift.tab)': 'onTab($event)' },
})
export class FocusTrapDirective {
  readonly active = input(false, { alias: 'cmaFocusTrapActive' });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly platform = inject(PlatformService);
  private previouslyFocused: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (!this.platform.isBrowser) return;
      if (this.active()) {
        this.previouslyFocused = this.document.activeElement as HTMLElement | null;
        // Defer so the element is visible (offcanvas transitions) before focusing.
        setTimeout(() => this.focusables()[0]?.focus(), 30);
      } else if (this.previouslyFocused) {
        this.previouslyFocused.focus();
        this.previouslyFocused = null;
      }
    });
  }

  onTab(raw: Event): void {
    if (!this.active()) return;
    const event = raw as KeyboardEvent;
    const items = this.focusables();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = this.document.activeElement;
    if (event.shiftKey && (active === first || !this.host.nativeElement.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusables(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (element) => element.offsetParent !== null || element === this.document.activeElement,
    );
  }
}
