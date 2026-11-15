import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { WorkInProgressComponent } from '../../shared/components/work-in-progress/work-in-progress';

@Component({
  selector: 'cma-bookmarks',
  imports: [PageHeaderComponent, WorkInProgressComponent],
  template: `
    <cma-page-header eyebrow="Account" title="Bookmarks" />
    <div class="container-xxl py-5"><cma-work-in-progress feature="Bookmarks" [phase]="5" /></div>
  `,
})
export class BookmarksPage {}
