import { Component, input } from '@angular/core';
import type { QuizBlock } from '../../core/models/content';
import { IconComponent } from '../../shared/components/icon/icon';
import { InlineMarkupComponent } from '../../shared/components/inline-markup/inline-markup';

/** Inline quick-check questions. Interactive answering and grading arrive with the quiz engine (Phase 5). */
@Component({
  selector: 'cma-quiz-block',
  imports: [IconComponent, InlineMarkupComponent],
  template: `
    <aside class="cma-callout" [attr.aria-label]="block().title ?? 'Quick check'">
      <span class="cma-callout__icon"><cma-icon name="patch-check" [size]="20" /></span>
      <div>
        <div class="cma-callout__title">{{ block().title ?? 'Quick check' }}</div>
        <ol class="mb-2 ps-3">
          @for (question of block().questions; track question.id) {
            <li><cma-inline [text]="question.question" /></li>
          }
        </ol>
        <small class="cma-text-secondary">Think about your answer; interactive answering with instant feedback arrives in build phase 5.</small>
      </div>
    </aside>
  `,
})
export class QuizBlockComponent {
  readonly block = input.required<QuizBlock>();
}
