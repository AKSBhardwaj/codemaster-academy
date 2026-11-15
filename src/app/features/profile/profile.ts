import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { WorkInProgressComponent } from '../../shared/components/work-in-progress/work-in-progress';

@Component({
  selector: 'cma-profile',
  imports: [PageHeaderComponent, WorkInProgressComponent],
  template: `
    <cma-page-header eyebrow="Account" title="Profile" />
    <div class="container-xxl py-5"><cma-work-in-progress feature="The profile page" [phase]="6" /></div>
  `,
})
export class ProfilePage {}
