import { Component, computed, inject, input } from '@angular/core';
import { SeoService } from '../../../core/services/seo.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { WorkInProgressComponent } from '../../../shared/components/work-in-progress/work-in-progress';
import { titleFromSlug } from '../../../shared/utils/slug';

@Component({
  selector: 'cma-category',
  imports: [PageHeaderComponent, WorkInProgressComponent],
  template: `
    <cma-page-header eyebrow="Category" [title]="name()" />
    <div class="container-xxl py-5">
      <cma-work-in-progress feature="Category pages" [phase]="3" />
    </div>
  `,
})
export class CategoryPage {
  readonly category = input.required<string>();
  protected readonly name = computed(() => titleFromSlug(this.category()));
  private readonly seo = inject(SeoService);

  constructor() {
    // Replaced by catalog-driven metadata in Phase 3.
    queueMicrotask(() =>
      this.seo.apply({ title: `${this.name()} tutorials`, description: `Tutorials in the ${this.name()} category.` }),
    );
  }
}
