import { Component, afterNextRender, computed, inject, input, signal } from '@angular/core';
import type { QuizQuestion } from '../../../core/models/content';
import { QuizStore } from '../../../core/services/quiz.store';
import { IconComponent } from '../../../shared/components/icon/icon';
import { InlineMarkupComponent } from '../../../shared/components/inline-markup/inline-markup';
import {
  correctAnswerText,
  givenAnswerText,
  gradeAnswer,
  summarise,
  type Answer,
  type ScoreSummary,
} from '../../exercises/grading';
import { QuestionInputComponent } from '../../exercises/question-input/question-input';

type Phase = 'intro' | 'question' | 'results';

/**
 * Quiz flow: intro → one question at a time → results with score, review of every answer and retry.
 * With `persist` the attempt is saved to the browser-local quiz history.
 */
@Component({
  selector: 'cma-quiz-runner',
  imports: [IconComponent, InlineMarkupComponent, QuestionInputComponent],
  templateUrl: './quiz-runner.html',
  styleUrl: './quiz-runner.scss',
})
export class QuizRunnerComponent {
  readonly quizId = input.required<string>();
  readonly questions = input.required<readonly QuizQuestion[]>();
  readonly title = input('Quiz');
  readonly passPercent = input(70);
  readonly persist = input(true);
  readonly compact = input(false);

  private readonly store = inject(QuizStore);
  protected readonly phase = signal<Phase>('intro');
  protected readonly interactive = signal(false);
  protected readonly index = signal(0);
  protected readonly answers = signal<Map<string, Answer | null>>(new Map());
  protected readonly current = computed(() => this.questions()[this.index()]);
  protected readonly currentAnswer = computed(
    () => this.answers().get(this.current()?.id ?? '') ?? null,
  );
  protected readonly total = computed(() => this.questions().length);
  protected readonly progress = computed(() =>
    Math.round((this.index() / Math.max(1, this.total())) * 100),
  );
  protected readonly results = computed(() =>
    this.questions().map((q) => gradeAnswer(q, this.answers().get(q.id) ?? null)),
  );
  protected readonly summary = computed<ScoreSummary>(() =>
    summarise(this.results(), this.passPercent()),
  );
  protected readonly history = computed(() =>
    this.persist() ? this.store.historyFor(this.quizId()) : undefined,
  );
  protected readonly reviewOpen = signal(false);

  constructor() {
    // An inline quiz can be visible before its deferred event handlers are attached.
    afterNextRender(() => this.interactive.set(true));
  }

  protected start(): void {
    this.answers.set(new Map());
    this.index.set(0);
    this.reviewOpen.set(false);
    this.phase.set('question');
  }

  protected setAnswer(answer: Answer | null): void {
    const id = this.current()?.id;
    if (!id) return;
    this.answers.update((map) => new Map(map).set(id, answer));
  }

  protected next(): void {
    if (this.index() + 1 < this.total()) {
      this.index.update((i) => i + 1);
    } else {
      this.finish();
    }
  }

  protected previous(): void {
    if (this.index() > 0) this.index.update((i) => i - 1);
  }

  protected finish(): void {
    this.phase.set('results');
    if (this.persist()) {
      const s = this.summary();
      this.store.record(
        this.quizId(),
        { total: s.total, correct: s.correct, percent: s.percent, passed: s.passed },
        this.title(),
      );
    }
  }

  protected answerFor(question: QuizQuestion): Answer | null {
    return this.answers().get(question.id) ?? null;
  }

  protected given(question: QuizQuestion): string {
    return givenAnswerText(question, this.answerFor(question));
  }

  protected expected(question: QuizQuestion): string {
    return correctAnswerText(question);
  }
}
