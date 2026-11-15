import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { WorkInProgressComponent } from '../../shared/components/work-in-progress/work-in-progress';

@Component({
  selector: 'cma-exercises-index',
  imports: [PageHeaderComponent, WorkInProgressComponent],
  template: `
    <cma-page-header
      eyebrow="Practice"
      title="Exercises"
      lead="Hands-on practice for every tutorial, from quick checks to coding tasks."
    />
    <div class="container-xxl py-5"><cma-work-in-progress feature="Exercises" [phase]="5" /></div>
  `,
})
export class ExercisesIndexPage {}
