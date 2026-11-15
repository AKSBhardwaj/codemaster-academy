import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { WorkInProgressComponent } from '../../shared/components/work-in-progress/work-in-progress';

@Component({
  selector: 'cma-login',
  imports: [PageHeaderComponent, WorkInProgressComponent],
  template: `
    <cma-page-header eyebrow="Account" title="Log in" />
    <div class="container-xxl py-5"><cma-work-in-progress feature="Login (browser-local demo account)" [phase]="6" /></div>
  `,
})
export class LoginPage {}
