import { Component, computed, inject } from '@angular/core';
import { CatalogService } from '../../core/services/catalog.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { TechnologyLinkListComponent } from '../../shared/components/technology-link-list/technology-link-list';

@Component({
  selector: 'cma-exercises-index',
  imports: [PageHeaderComponent, EmptyStateComponent, TechnologyLinkListComponent],
  template: `
    <cma-page-header
      eyebrow="Practice"
      title="Exercises"
      lead="Multiple-choice, true/false, fill-in-the-blank, output prediction, find-the-error and coding tasks for every published tutorial. Your attempts are saved in this browser."
    />
    <div class="container-xxl py-4 py-lg-5">
      @if (available().length) {
        <cma-technology-link-list
          [technologies]="available()"
          basePath="/exercises"
          label="Exercises"
        />
      } @else if (!catalog.isLoading()) {
        <cma-empty-state
          icon="pencil-square"
          title="No exercise sets published yet"
          text="Check your connection and reload the page to try again."
        />
      }
    </div>
  `,
})
export class ExercisesIndexPage {
  protected readonly catalog = inject(CatalogService);
  protected readonly available = computed(() =>
    this.catalog.technologies().filter((t) => t.hasExercises),
  );
}
