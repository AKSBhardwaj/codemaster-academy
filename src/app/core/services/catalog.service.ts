import { Injectable, computed, inject, resource, type ResourceRef } from '@angular/core';
import type { Category, HomeConfig, LearningPathSummary, TechnologyCatalogEntry } from '../models/content';
import { ContentService } from './content.service';

export interface CategoryWithTechnologies {
  category: Category;
  technologies: TechnologyCatalogEntry[];
}

/** `value()` throws while a resource is in error state; this returns the value or a fallback instead. */
function valueOr<T>(ref: ResourceRef<T | undefined>, fallback: T): T {
  return ref.hasValue() ? (ref.value() as T) : fallback;
}

/** Catalog data (categories, technologies, learning path summaries, home config) as signals. */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly content = inject(ContentService);

  readonly categoriesResource = resource({
    loader: () => this.content.load<Category[]>('catalog/categories.json'),
  });
  readonly technologiesResource = resource({
    loader: () => this.content.load<TechnologyCatalogEntry[]>('catalog/technologies.json'),
  });
  readonly pathsResource = resource({
    loader: () => this.content.load<LearningPathSummary[]>('learning-paths/index.json'),
  });
  readonly homeResource = resource({
    loader: () => this.content.load<HomeConfig>('site/home.json'),
  });

  readonly categories = computed<Category[]>(() => valueOr(this.categoriesResource, []));
  readonly technologies = computed<TechnologyCatalogEntry[]>(() => valueOr(this.technologiesResource, []));
  readonly paths = computed<LearningPathSummary[]>(() => valueOr(this.pathsResource, []));
  readonly home = computed<HomeConfig | undefined>(() =>
    this.homeResource.hasValue() ? this.homeResource.value() : undefined,
  );

  readonly isLoading = computed(
    () => this.categoriesResource.isLoading() || this.technologiesResource.isLoading(),
  );
  readonly error = computed(() => this.categoriesResource.error() ?? this.technologiesResource.error());

  readonly technologyMap = computed(() => new Map(this.technologies().map((t) => [t.slug, t])));
  readonly categoryMap = computed(() => new Map(this.categories().map((c) => [c.slug, c])));

  readonly byCategory = computed<CategoryWithTechnologies[]>(() =>
    this.categories().map((category) => ({
      category,
      technologies: this.technologies().filter((t) => t.categorySlug === category.slug),
    })),
  );

  readonly featured = computed(() => this.technologies().filter((t) => t.featured));
  readonly published = computed(() => this.technologies().filter((t) => t.status !== 'planned'));
  readonly recentlyUpdated = computed(() =>
    [...this.published()]
      .filter((t) => t.updatedOn)
      .sort((a, b) => (b.updatedOn ?? '').localeCompare(a.updatedOn ?? ''))
      .slice(0, 6),
  );

  readonly statusCounts = computed(() => {
    const counts = { complete: 0, 'in-progress': 0, planned: 0 };
    for (const t of this.technologies()) counts[t.status]++;
    return counts;
  });

  technology(slug: string): TechnologyCatalogEntry | undefined {
    return this.technologyMap().get(slug);
  }

  category(slug: string): Category | undefined {
    return this.categoryMap().get(slug);
  }

  /** Resolves a list of slugs to entries, keeping the given order and skipping unknown slugs. */
  bySlugs(slugs: readonly string[]): TechnologyCatalogEntry[] {
    const map = this.technologyMap();
    return slugs.map((slug) => map.get(slug)).filter((t): t is TechnologyCatalogEntry => !!t);
  }
}
