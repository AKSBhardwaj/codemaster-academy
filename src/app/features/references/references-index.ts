import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { WorkInProgressComponent } from '../../shared/components/work-in-progress/work-in-progress';

@Component({
  selector: 'cma-references-index',
  imports: [PageHeaderComponent, WorkInProgressComponent],
  template: `
    <cma-page-header
      eyebrow="References"
      title="References"
      lead="Compact, searchable references for the syntax you look up most often."
    />
    <div class="container-xxl py-5"><cma-work-in-progress feature="References" [phase]="4" /></div>
  `,
})
export class ReferencesIndexPage {}
