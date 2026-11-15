import { Component } from '@angular/core';
import { IconComponent } from '../../shared/components/icon/icon';

/** The one honest sentence every account screen must show. */
@Component({
  selector: 'cma-demo-notice',
  imports: [IconComponent],
  template: `
    <div class="alert alert-warning d-flex gap-2 small" role="note">
      <cma-icon name="exclamation-triangle" [size]="16" />
      <span>
        <strong>Demo account.</strong> Accounts live in this browser only: there is no server, no
        email verification, no password recovery and no synchronisation between devices. Do not
        reuse a real password here.
      </span>
    </div>
  `,
})
export class DemoNoticeComponent {}
