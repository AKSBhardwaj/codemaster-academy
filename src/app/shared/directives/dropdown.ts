import { Directive, ElementRef, OnDestroy, inject, signal } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

/**
 * Minimal, accessible Bootstrap dropdown behaviour without Bootstrap's JavaScript.
 * Usage:
 * <div class="dropdown" cmaDropdown>
 *   <button cmaDropdownToggle>…</button>
 *   <ul class="dropdown-menu" cmaDropdownMenu>…</ul>
 * </div>
 */
@Directive({
  selector: '[cmaDropdown]',
  exportAs: 'cmaDropdown',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscape()',
    '(keydown.arrowdown)': 'moveFocus($event, "next")',
    '(keydown.arrowup)': 'moveFocus($event, "previous")',
    '(keydown.home)': 'moveFocus($event, "first")',
    '(keydown.end)': 'moveFocus($event, "last")',
    '(focusout)': 'onFocusOut($event)',
    '[class.show]': 'isOpen()',
  },
})
export class DropdownDirective implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly open = signal(false);
  private readonly navigation: Subscription = inject(Router)
    .events.pipe(filter((event) => event instanceof NavigationStart))
    .subscribe(() => this.close());

  readonly isOpen = this.open.asReadonly();

  toggle(): void {
    this.open.update((value) => !value);
    if (this.open()) queueMicrotask(() => this.items()[0]?.focus());
  }

  close(): void {
    this.open.set(false);
  }

  onEscape(): void {
    if (!this.open()) return;
    this.close();
    this.host.nativeElement.querySelector<HTMLElement>('[cmaDropdownToggle]')?.focus();
  }

  onDocumentClick(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  onFocusOut(event: Event): void {
    const next = (event as FocusEvent).relatedTarget as Node | null;
    if (this.open() && next && !this.host.nativeElement.contains(next)) this.close();
  }

  moveFocus(event: Event, direction: 'next' | 'previous' | 'first' | 'last'): void {
    if (!this.open()) return;
    event.preventDefault();
    const items = this.items();
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    const last = items.length - 1;
    let next: number;
    switch (direction) {
      case 'first':
        next = 0;
        break;
      case 'last':
        next = last;
        break;
      case 'next':
        next = current === -1 || current === last ? 0 : current + 1;
        break;
      case 'previous':
        next = current <= 0 ? last : current - 1;
        break;
    }
    items[next]?.focus();
  }

  ngOnDestroy(): void {
    this.navigation.unsubscribe();
  }

  private items(): HTMLElement[] {
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(
        '.dropdown-item:not(.disabled):not([aria-disabled="true"])',
      ),
    );
  }
}

@Directive({
  selector: '[cmaDropdownToggle]',
  host: {
    'aria-haspopup': 'true',
    '[attr.aria-expanded]': 'dropdown.isOpen()',
    '(click)': 'dropdown.toggle()',
  },
})
export class DropdownToggleDirective {
  protected readonly dropdown = inject(DropdownDirective);
}

@Directive({
  selector: '[cmaDropdownMenu]',
  host: { '[class.show]': 'dropdown.isOpen()' },
})
export class DropdownMenuDirective {
  protected readonly dropdown = inject(DropdownDirective);
}
