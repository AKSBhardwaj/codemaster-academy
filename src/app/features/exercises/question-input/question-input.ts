import { Component, afterNextRender, computed, input, model, signal } from '@angular/core';
import type { QuizQuestion } from '../../../core/models/content';
import { CodeBlockComponent } from '../../../shared/components/code-block/code-block';
import { InlineMarkupComponent } from '../../../shared/components/inline-markup/inline-markup';
import type { Answer } from '../grading';

let instance = 0;

/** Renders one question (text, optional code) with its answer controls. Used by exercise cards and the quiz runner. */
@Component({
  selector: 'cma-question-input',
  imports: [CodeBlockComponent, InlineMarkupComponent],
  templateUrl: './question-input.html',
  styleUrl: './question-input.scss',
})
export class QuestionInputComponent {
  readonly question = input.required<QuizQuestion>();
  readonly answer = model<Answer | null>(null);
  readonly disabled = input(false);
  /** After grading: highlight the correct option and the learner's wrong one. */
  readonly reveal = input(false);
  readonly headingLevel = input<'h2' | 'h3' | 'p'>('p');
  protected readonly interactive = signal(false);

  protected readonly name = `cma-q-${instance++}`;
  protected readonly options = computed(() => {
    const q = this.question();
    return q.type === 'multiple-choice' || q.type === 'predict-output' || q.type === 'find-error'
      ? q.options
      : [];
  });
  protected readonly code = computed(() => {
    const q = this.question();
    return q.type === 'predict-output' || q.type === 'find-error'
      ? { code: q.code, language: q.language }
      : null;
  });
  protected readonly displayQuestion = computed(() =>
    this.question().question.replace(/___/g, '______'),
  );
  protected readonly correctIndex = computed(() => {
    const q = this.question();
    return q.type === 'multiple-choice' || q.type === 'predict-output' || q.type === 'find-error'
      ? q.correctIndex
      : -1;
  });
  protected readonly correctBoolean = computed(() =>
    this.question().type === 'true-false'
      ? (this.question() as { correct: boolean }).correct
      : null,
  );

  constructor() {
    // Prerendered and deferred questions become editable once their handlers are attached.
    afterNextRender(() => this.interactive.set(true));
  }

  protected choose(index: number): void {
    if (!this.disabled()) this.answer.set({ kind: 'choice', index });
  }

  protected chooseBoolean(value: boolean): void {
    if (!this.disabled()) this.answer.set({ kind: 'boolean', value });
  }

  protected onText(event: Event): void {
    this.answer.set({ kind: 'text', value: (event.target as HTMLInputElement).value });
  }

  protected selectedIndex(): number {
    const a = this.answer();
    return a?.kind === 'choice' ? a.index : -1;
  }

  protected selectedBoolean(): boolean | null {
    const a = this.answer();
    return a?.kind === 'boolean' ? a.value : null;
  }

  protected textValue(): string {
    const a = this.answer();
    return a?.kind === 'text' ? a.value : '';
  }
}
