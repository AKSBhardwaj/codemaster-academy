import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/config/site-config';
import { CatalogService } from '../../core/services/catalog.service';
import { CategoryCardComponent } from '../../shared/components/category-card/category-card';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { IconComponent } from '../../shared/components/icon/icon';
import { PathCardComponent } from '../../shared/components/path-card/path-card';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header';
import { TechnologyCardComponent } from '../../shared/components/technology-card/technology-card';
import type { UiIconName } from '../../shared/icons/ui-icons.generated';

@Component({
  selector: 'cma-home',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    IconComponent,
    TechnologyCardComponent,
    CategoryCardComponent,
    PathCardComponent,
    SectionHeaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage {
  protected readonly site = inject(SITE_CONFIG);
  protected readonly catalog = inject(CatalogService);
  protected readonly query = new FormControl('', { nonNullable: true });
  protected readonly openFaq = signal<number | null>(0);
  private readonly router = inject(Router);

  protected readonly home = this.catalog.home;
  protected readonly featuredPaths = computed(() => {
    const slugs = this.home()?.featuredPaths ?? [];
    const map = new Map(this.catalog.paths().map((p) => [p.slug, p]));
    return slugs.map((slug) => map.get(slug)).filter((p): p is NonNullable<typeof p> => !!p);
  });
  protected readonly popularLanguages = computed(() => this.catalog.bySlugs(this.home()?.popularLanguages ?? []));
  protected readonly popularFrameworks = computed(() => this.catalog.bySlugs(this.home()?.popularFrameworks ?? []));
  protected readonly categories = computed(() =>
    this.catalog.byCategory().map(({ category, technologies }) => ({ category, count: technologies.length })),
  );
  protected readonly featured = computed(() => this.catalog.featured().slice(0, 12));
  protected readonly recent = this.catalog.recentlyUpdated;
  protected readonly practice = computed(() => this.catalog.technologies().filter((t) => t.hasExercises || t.hasQuiz).slice(0, 8));
  protected readonly counts = this.catalog.statusCounts;
  protected readonly totalTechnologies = computed(() => this.catalog.technologies().length);

  protected submitSearch(): void {
    const q = this.query.value.trim();
    void this.router.navigate(['/search'], q ? { queryParams: { q } } : {});
  }

  protected toggleFaq(index: number): void {
    this.openFaq.update((current) => (current === index ? null : index));
  }

  protected icon(name: string): UiIconName {
    return name as UiIconName;
  }
}
