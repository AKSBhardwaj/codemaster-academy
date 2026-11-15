import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ExerciseBlock } from '../../core/models/content';
import { ExerciseCardComponent } from '../../features/exercises/exercise-card/exercise-card';
import { TutorialContext } from '../../features/technology/tutorial-context';
import { IconComponent } from '../../shared/components/icon/icon';

/** Renders an exercise from the technology's exercise set inline in the lesson. */
@Component({
  selector: 'cma-exercise-block',
  imports: [RouterLink, IconComponent, ExerciseCardComponent],
  template: `
    @if (exercise(); as exercise) {
      <div class="my-4">
        <p class="cma-eyebrow mb-2">Practice exercise</p>
        <cma-exercise-card [exercise]="exercise" [technologySlug]="context.techSlug()" [showLessonLink]="false" />
      </div>
    } @else if (context.exerciseSetStatus() === 'loading') {
      <div class="cma-block-note" aria-busy="true">Loading exercise…</div>
    } @else {
      <aside class="cma-callout" aria-label="Practice exercise">
        <span class="cma-callout__icon"><cma-icon name="pencil-square" [size]="20" /></span>
        <div>
          <div class="cma-callout__title">Practice exercise</div>
          <p class="mb-0">
            Exercise <code>{{ block().exerciseId }}</code> could not be loaded.
            @if (context.technology(); as tech) {
              Open the <a [routerLink]="['/exercises', tech.slug]">{{ tech.name }} exercises</a> instead.
            }
          </p>
        </div>
      </aside>
    }
  `,
})
export class ExerciseBlockComponent {
  readonly block = input.required<ExerciseBlock>();
  protected readonly context = inject(TutorialContext);
  protected readonly exercise = computed(() => this.context.exerciseSet()?.exercises.find((e) => e.id === this.block().exerciseId));

  constructor() {
    this.context.ensureExercises();
  }
}
