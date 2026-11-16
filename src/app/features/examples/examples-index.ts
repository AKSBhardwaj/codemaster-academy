import { Component, computed, inject } from '@angular/core';
import { CatalogService } from '../../core/services/catalog.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { TechnologyLinkListComponent } from '../../shared/components/technology-link-list/technology-link-list';

@Component({
  selector: 'cma-examples-index',
  imports: [PageHeaderComponent, EmptyStateComponent, TechnologyLinkListComponent],
  template: `
    <cma-page-header
      eyebrow="Examples"
      title="Code examples"
      lead="Short, focused snippets with expected output that you can copy into your own projects."
    />
    <div class="container-xxl py-4 py-lg-5">
      @if (available().length) {
        <cma-technology-link-list
          [technologies]="available()"
          basePath="/examples"
          label="Examples"
        />
      } @else if (!catalog.isLoading()) {
        <cma-empty-state
          icon="file-earmark-code"
          title="No example sets published yet"
          text="Check your connection and reload the page to try again."
        />
      }
    </div>
  `,
})
export class ExamplesIndexPage {
  protected readonly catalog = inject(CatalogService);
  protected readonly available = computed(() =>
    this.catalog.technologies().filter((t) => t.hasExamples),
  );
}
