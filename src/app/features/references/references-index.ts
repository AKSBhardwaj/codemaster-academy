import { Component, computed, inject } from '@angular/core';
import { CatalogService } from '../../core/services/catalog.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { TechnologyLinkListComponent } from '../../shared/components/technology-link-list/technology-link-list';

@Component({
  selector: 'cma-references-index',
  imports: [PageHeaderComponent, EmptyStateComponent, TechnologyLinkListComponent],
  template: `
    <cma-page-header eyebrow="References" title="References" lead="Compact, searchable references for the syntax you look up most often. Each reference is published together with its tutorial." />
    <div class="container-xxl py-4 py-lg-5">
      @if (available().length) {
        <cma-technology-link-list [technologies]="available()" basePath="/references" />
      } @else if (!catalog.isLoading()) {
        <cma-empty-state icon="journal-code" title="No references published yet" text="References appear here as tutorials reach the in-progress and complete stages." />
      }
    </div>
  `,
})
export class ReferencesIndexPage {
  protected readonly catalog = inject(CatalogService);
  protected readonly available = computed(() => this.catalog.technologies().filter((t) => t.hasReference));
}
