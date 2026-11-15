import { Component, computed, inject, input } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { WorkInProgressComponent } from '../../shared/components/work-in-progress/work-in-progress';
import { titleFromSlug } from '../../shared/utils/slug';

@Component({
  selector: 'cma-examples-tech',
  imports: [PageHeaderComponent, WorkInProgressComponent],
  template: `
    <cma-page-header eyebrow="Examples" [title]="name() + ' Examples'" />
    <div class="container-xxl py-5"><cma-work-in-progress feature="Technology examples" [phase]="4" /></div>
  `,
})
export class ExamplesTechPage {
  readonly tech = input.required<string>();
  protected readonly name = computed(() => titleFromSlug(this.tech()));
  private readonly seo = inject(SeoService);

  constructor() {
    queueMicrotask(() =>
      this.seo.apply({ title: `${this.name()} Examples`, description: `${this.name()} code examples.` }),
    );
  }
}
