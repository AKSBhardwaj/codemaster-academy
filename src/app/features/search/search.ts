import { Component, input } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { WorkInProgressComponent } from '../../shared/components/work-in-progress/work-in-progress';

@Component({
  selector: 'cma-search',
  imports: [PageHeaderComponent, WorkInProgressComponent],
  template: `
    <cma-page-header eyebrow="Search" [title]="q() ? 'Results for “' + q() + '”' : 'Search'" />
    <div class="container-xxl py-5"><cma-work-in-progress feature="Search" [phase]="3" /></div>
  `,
})
export class SearchPage {
  /** Bound from the `q` query parameter via withComponentInputBinding. */
  readonly q = input('');
}
