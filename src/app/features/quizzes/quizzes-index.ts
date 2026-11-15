import { Component, computed, inject } from '@angular/core';
import { CatalogService } from '../../core/services/catalog.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { TechnologyLinkListComponent } from '../../shared/components/technology-link-list/technology-link-list';

@Component({
  selector: 'cma-quizzes-index',
  imports: [PageHeaderComponent, EmptyStateComponent, TechnologyLinkListComponent],
  template: `
    <cma-page-header eyebrow="Practice" title="Quizzes" lead="Scored quizzes for every published tutorial, with an answer review and unlimited retries. Scores are saved in this browser." />
    <div class="container-xxl py-4 py-lg-5">
      @if (available().length) {
        <cma-technology-link-list [technologies]="available()" basePath="/quizzes" label="Quiz" />
      } @else if (!catalog.isLoading()) {
        <cma-empty-state icon="patch-check" title="No quizzes published yet" text="Quizzes appear here as tutorials reach the in-progress and complete stages." />
      }
    </div>
  `,
})
export class QuizzesIndexPage {
  protected readonly catalog = inject(CatalogService);
  protected readonly available = computed(() => this.catalog.technologies().filter((t) => t.hasQuiz));
}
