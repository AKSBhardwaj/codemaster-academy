import { Component, inject } from '@angular/core';
import { CatalogService } from '../../core/services/catalog.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { PathCardComponent } from '../../shared/components/path-card/path-card';

@Component({
  selector: 'cma-paths-index',
  imports: [PageHeaderComponent, PathCardComponent],
  template: `
    <cma-page-header
      eyebrow="Roadmaps"
      title="Learning paths"
      lead="Ordered tutorials that take you from fundamentals to job-ready skills, with time estimates for every stage. Stages that point to planned tutorials are labelled so you always know what is available today."
    />
    <div class="container-xxl py-4 py-lg-5">
      <div class="row g-3">
        @for (path of catalog.paths(); track path.slug) {
          <div class="col-12 col-sm-6 col-lg-4"><cma-path-card [path]="path" /></div>
        } @empty {
          <div class="col-12" aria-busy="true"><div class="cma-skeleton" style="height: 10rem"></div></div>
        }
      </div>
    </div>
  `,
})
export class PathsIndexPage {
  protected readonly catalog = inject(CatalogService);
}
