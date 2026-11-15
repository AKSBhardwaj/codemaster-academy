import { Component, computed, inject, input } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { WorkInProgressComponent } from '../../shared/components/work-in-progress/work-in-progress';
import { titleFromSlug } from '../../shared/utils/slug';

@Component({
  selector: 'cma-technology-overview',
  imports: [WorkInProgressComponent],
  template: `
    <p class="cma-eyebrow mb-2">Tutorial</p>
    <h1 class="mb-3">{{ name() }} Tutorial</h1>
    <cma-work-in-progress feature="Technology overview pages" [phase]="4" />
  `,
})
export class TechnologyOverviewPage {
  readonly tech = input.required<string>();
  protected readonly name = computed(() => titleFromSlug(this.tech()));
  private readonly seo = inject(SeoService);

  constructor() {
    queueMicrotask(() =>
      this.seo.apply({ title: `${this.name()} Tutorial`, description: `Learn ${this.name()} step by step.` }),
    );
  }
}
