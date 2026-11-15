import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { WorkInProgressComponent } from '../../../shared/components/work-in-progress/work-in-progress';

@Component({
  selector: 'cma-catalog',
  imports: [PageHeaderComponent, WorkInProgressComponent],
  template: `
    <cma-page-header
      eyebrow="Tutorials"
      title="All tutorials"
      lead="Every technology on the platform, grouped by category, with its current status."
    />
    <div class="container-xxl py-5">
      <cma-work-in-progress feature="The technology catalog" [phase]="3" />
    </div>
  `,
})
export class CatalogPage {}
