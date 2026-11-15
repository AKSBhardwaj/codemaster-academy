import { DOCUMENT, Component, effect, inject, input, model } from '@angular/core';
import { FocusTrapDirective } from '../../directives/focus-trap';
import { PlatformService } from '../../../core/services/platform.service';

let nextId = 0;

/** Bootstrap offcanvas drawer driven by Angular state (no Bootstrap JS). */
@Component({
  selector: 'cma-offcanvas',
  imports: [FocusTrapDirective],
  template: `
    <div
      class="offcanvas"
      [class.offcanvas-start]="placement() === 'start'"
      [class.offcanvas-end]="placement() === 'end'"
      [class.show]="open()"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="titleId"
      [attr.aria-hidden]="!open()"
      [attr.inert]="open() ? null : ''"
      cmaFocusTrap
      [cmaFocusTrapActive]="open()"
      (keydown.escape)="close()"
    >
      <div class="offcanvas-header border-bottom">
        <h2 class="offcanvas-title h5 mb-0" [id]="titleId">{{ title() }}</h2>
        <button type="button" class="btn-close" aria-label="Close" (click)="close()"></button>
      </div>
      <div class="offcanvas-body">
        <ng-content />
      </div>
    </div>
    @if (open()) {
      <button
        type="button"
        class="offcanvas-backdrop fade show cma-backdrop"
        tabindex="-1"
        aria-label="Close"
        (click)="close()"
      ></button>
    }
  `,
})
export class OffcanvasComponent {
  readonly open = model(false);
  readonly title = input('');
  readonly placement = input<'start' | 'end'>('start');
  protected readonly titleId = `cma-offcanvas-${nextId++}`;
  private readonly document = inject(DOCUMENT);
  private readonly platform = inject(PlatformService);

  constructor() {
    effect(() => {
      if (!this.platform.isBrowser) return;
      this.document.body.classList.toggle('cma-scroll-lock', this.open());
    });
  }

  close(): void {
    this.open.set(false);
  }
}
