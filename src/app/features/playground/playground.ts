import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { WorkInProgressComponent } from '../../shared/components/work-in-progress/work-in-progress';

@Component({
  selector: 'cma-playground',
  imports: [PageHeaderComponent, WorkInProgressComponent],
  template: `
    <cma-page-header
      eyebrow="Playground"
      title="Code playground"
      lead="Run HTML, CSS, JavaScript and SQL safely in your browser."
    />
    <div class="container-xxl py-5"><cma-work-in-progress feature="The code playground" [phase]="5" /></div>
  `,
})
export class PlaygroundPage {}
