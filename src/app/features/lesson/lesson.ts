import { Component, computed, inject, input } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { WorkInProgressComponent } from '../../shared/components/work-in-progress/work-in-progress';
import { titleFromSlug } from '../../shared/utils/slug';

@Component({
  selector: 'cma-lesson',
  imports: [WorkInProgressComponent],
  template: `
    <p class="cma-eyebrow mb-2">{{ techName() }}</p>
    <h1 class="mb-3">{{ lessonName() }}</h1>
    <cma-work-in-progress feature="The lesson rendering engine" [phase]="4" />
  `,
})
export class LessonPage {
  readonly tech = input.required<string>();
  readonly lesson = input.required<string>();
  protected readonly techName = computed(() => titleFromSlug(this.tech()));
  protected readonly lessonName = computed(() => titleFromSlug(this.lesson()));
  private readonly seo = inject(SeoService);

  constructor() {
    queueMicrotask(() =>
      this.seo.apply({
        title: `${this.lessonName()} – ${this.techName()} Tutorial`,
        description: `${this.lessonName()} lesson of the ${this.techName()} tutorial.`,
      }),
    );
  }
}
