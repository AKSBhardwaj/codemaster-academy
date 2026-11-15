import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { WorkInProgressComponent } from '../../shared/components/work-in-progress/work-in-progress';

@Component({
  selector: 'cma-examples-index',
  imports: [PageHeaderComponent, WorkInProgressComponent],
  template: `
    <cma-page-header
      eyebrow="Examples"
      title="Code examples"
      lead="Short, focused snippets you can copy or open in the playground."
    />
    <div class="container-xxl py-5"><cma-work-in-progress feature="Examples" [phase]="4" /></div>
  `,
})
export class ExamplesIndexPage {}
