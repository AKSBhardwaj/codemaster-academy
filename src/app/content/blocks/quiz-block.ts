import { Component, computed, inject, input } from '@angular/core';
import type { QuizBlock } from '../../core/models/content';
import { QuizRunnerComponent } from '../../features/quizzes/quiz-runner/quiz-runner';
import { TutorialContext } from '../../features/technology/tutorial-context';

/** Inline quick-check quiz inside a lesson (not persisted; the technology quiz tracks scores). */
@Component({
  selector: 'cma-quiz-block',
  imports: [QuizRunnerComponent],
  template: `
    <cma-quiz-runner [quizId]="quizId()" [questions]="block().questions" [title]="block().title ?? 'Quick check'" [passPercent]="50" [persist]="false" [compact]="true" />
  `,
})
export class QuizBlockComponent {
  readonly block = input.required<QuizBlock>();
  private readonly context = inject(TutorialContext, { optional: true });
  protected readonly quizId = computed(() => `inline:${this.context?.activeLesson()?.id ?? 'lesson'}:${this.block().questions[0]?.id ?? ''}`);
}
