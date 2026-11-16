import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DIFFICULTY_LABEL, type Exercise, type QuizQuestion } from '../../../core/models/content';
import { ExerciseStore } from '../../../core/services/exercise.store';
import { IconComponent } from '../../../shared/components/icon/icon';
import { InlineMarkupComponent } from '../../../shared/components/inline-markup/inline-markup';
import { CodingTaskComponent } from '../coding-task/coding-task';
import { EXERCISE_TYPE_LABEL, gradeAnswer, isCodingTask, type Answer } from '../grading';
import { QuestionInputComponent } from '../question-input/question-input';

/** One exercise with answer controls, grading, feedback and explanation. Attempts are saved in the browser. */
@Component({
  selector: 'cma-exercise-card',
  imports: [
    RouterLink,
    IconComponent,
    InlineMarkupComponent,
    QuestionInputComponent,
    CodingTaskComponent,
  ],
  templateUrl: './exercise-card.html',
  styleUrl: './exercise-card.scss',
})
export class ExerciseCardComponent {
  readonly exercise = input.required<Exercise>();
  readonly technologySlug = input<string | undefined>(undefined);
  readonly number = input<number | undefined>(undefined);
  readonly showLessonLink = input(true);

  protected readonly store = inject(ExerciseStore);
  protected readonly answer = signal<Answer | null>(null);
  protected readonly checked = signal(false);
  protected readonly typeLabel = computed(() => EXERCISE_TYPE_LABEL[this.exercise().type]);
  protected readonly difficultyLabel = computed(() => DIFFICULTY_LABEL[this.exercise().difficulty]);
  protected readonly coding = computed(() => isCodingTask(this.exercise()));
  protected readonly question = computed(() =>
    isCodingTask(this.exercise()) ? null : (this.exercise() as QuizQuestion),
  );
  protected readonly correct = computed(() => {
    const question = this.question();
    return question ? this.checked() && gradeAnswer(question, this.answer()) : false;
  });
  protected readonly solved = computed(() => this.store.isSolved(this.exercise().id));

  protected check(): void {
    const question = this.question();
    if (!question || !this.answer()) return;
    this.checked.set(true);
    this.store.record(this.exercise().id, gradeAnswer(question, this.answer()));
  }

  protected retry(): void {
    this.checked.set(false);
    this.answer.set(null);
  }

  protected completeCodingTask(): void {
    this.store.record(this.exercise().id, true);
  }
}
