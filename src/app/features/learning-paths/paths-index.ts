import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { WorkInProgressComponent } from '../../shared/components/work-in-progress/work-in-progress';

@Component({
  selector: 'cma-paths-index',
  imports: [PageHeaderComponent, WorkInProgressComponent],
  template: `
    <cma-page-header
      eyebrow="Roadmaps"
      title="Learning paths"
      lead="Ordered tutorials that take you from fundamentals to job-ready skills."
    />
    <div class="container-xxl py-5"><cma-work-in-progress feature="Learning paths" [phase]="3" /></div>
  `,
})
export class PathsIndexPage {}
