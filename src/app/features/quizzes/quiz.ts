import { Component, computed, inject, input } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { WorkInProgressComponent } from '../../shared/components/work-in-progress/work-in-progress';
import { titleFromSlug } from '../../shared/utils/slug';

@Component({
  selector: 'cma-quiz',
  imports: [PageHeaderComponent, WorkInProgressComponent],
  template: `
    <cma-page-header eyebrow="Quiz" [title]="name() + ' Quiz'" />
    <div class="container-xxl py-5"><cma-work-in-progress feature="Quizzes" [phase]="5" /></div>
  `,
})
export class QuizPage {
  readonly tech = input.required<string>();
  protected readonly name = computed(() => titleFromSlug(this.tech()));
  private readonly seo = inject(SeoService);

  constructor() {
    queueMicrotask(() =>
      this.seo.apply({ title: `${this.name()} Quiz`, description: `Test your ${this.name()} knowledge.` }),
    );
  }
}
