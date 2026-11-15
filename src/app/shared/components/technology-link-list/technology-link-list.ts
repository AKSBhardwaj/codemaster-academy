import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { TechnologyCatalogEntry } from '../../../core/models/content';
import { CatalogService } from '../../../core/services/catalog.service';
import { StatusBadgeComponent } from '../status-badge/status-badge';
import { TechIconComponent } from '../tech-icon/tech-icon';

/** Grid of technology tiles linking to a per-technology page (references, examples, exercises, quizzes). */
@Component({
  selector: 'cma-technology-link-list',
  imports: [RouterLink, StatusBadgeComponent, TechIconComponent],
  template: `
    <div class="row g-3">
      @for (tech of technologies(); track tech.slug) {
        <div class="col-12 col-sm-6 col-lg-4 col-xxl-3">
          <a class="cma-card cma-card--link d-flex align-items-center gap-3 p-3 h-100" [routerLink]="basePath() + '/' + tech.slug">
            <cma-tech-icon [icon]="tech.icon" [name]="tech.name" [size]="44" [accent]="accentFor(tech)" />
            <span class="min-w-0 flex-grow-1">
              <span class="d-block fw-semibold">{{ tech.name }}</span>
              <span class="d-block small cma-text-secondary">{{ label() }}</span>
            </span>
            <cma-status-badge [status]="tech.status" />
          </a>
        </div>
      }
    </div>
  `,
})
export class TechnologyLinkListComponent {
  readonly technologies = input.required<readonly TechnologyCatalogEntry[]>();
  readonly basePath = input.required<string>();
  readonly label = input('Open');
  private readonly catalog = inject(CatalogService);
  private readonly accents = computed(() => new Map(this.catalog.categories().map((c) => [c.slug, c.accent])));

  protected accentFor(tech: TechnologyCatalogEntry): string | undefined {
    return this.accents().get(tech.categorySlug);
  }
}
