import { Component, computed, inject, input } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { WorkInProgressComponent } from '../../shared/components/work-in-progress/work-in-progress';
import { titleFromSlug } from '../../shared/utils/slug';

@Component({
  selector: 'cma-path-detail',
  imports: [PageHeaderComponent, WorkInProgressComponent],
  template: `
    <cma-page-header eyebrow="Learning path" [title]="name()" />
    <div class="container-xxl py-5"><cma-work-in-progress feature="Learning path details" [phase]="5" /></div>
  `,
})
export class PathDetailPage {
  readonly slug = input.required<string>();
  protected readonly name = computed(() => titleFromSlug(this.slug()));
  private readonly seo = inject(SeoService);

  constructor() {
    queueMicrotask(() =>
      this.seo.apply({ title: `${this.name()} learning path`, description: `${this.name()} roadmap.` }),
    );
  }
}
