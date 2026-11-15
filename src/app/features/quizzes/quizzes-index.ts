import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { WorkInProgressComponent } from '../../shared/components/work-in-progress/work-in-progress';

@Component({
  selector: 'cma-quizzes-index',
  imports: [PageHeaderComponent, WorkInProgressComponent],
  template: `
    <cma-page-header
      eyebrow="Practice"
      title="Quizzes"
      lead="Check your understanding with scored quizzes for each tutorial."
    />
    <div class="container-xxl py-5"><cma-work-in-progress feature="Quizzes" [phase]="5" /></div>
  `,
})
export class QuizzesIndexPage {}
