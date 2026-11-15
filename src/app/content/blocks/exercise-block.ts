import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ExerciseBlock } from '../../core/models/content';
import { IconComponent } from '../../shared/components/icon/icon';
import { TutorialContext } from '../../features/technology/tutorial-context';

/** Reference to an exercise from the technology's exercise set (rendered inline by the exercise engine in Phase 5). */
@Component({
  selector: 'cma-exercise-block',
  imports: [RouterLink, IconComponent],
  template: `
    <aside class="cma-callout" aria-label="Practice exercise">
      <span class="cma-callout__icon"><cma-icon name="pencil-square" [size]="20" /></span>
      <div>
        <div class="cma-callout__title">Practice exercise</div>
        <p class="mb-1">
          Exercise <code>{{ block().exerciseId }}</code> belongs to this lesson.
          @if (context.technology(); as tech) {
            Open the <a [routerLink]="['/exercises', tech.slug]">{{ tech.name }} exercises</a> to work on it.
          }
        </p>
        <small class="cma-text-secondary">Inline, graded exercises arrive in build phase 5.</small>
      </div>
    </aside>
  `,
})
export class ExerciseBlockComponent {
  readonly block = input.required<ExerciseBlock>();
  protected readonly context = inject(TutorialContext);
}
