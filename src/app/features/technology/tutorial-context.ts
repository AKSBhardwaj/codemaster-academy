import { Injectable, computed, inject, resource, signal } from '@angular/core';
import type { Lesson, Technology, TechnologyCatalogEntry } from '../../core/models/content';
import { CatalogService } from '../../core/services/catalog.service';
import { ContentService } from '../../core/services/content.service';

/**
 * Shared state for everything rendered inside the tutorial layout: the current technology
 * (compiled overview or planned catalog entry) and the lesson being read. Provided by TutorialLayoutComponent.
 */
@Injectable()
export class TutorialContext {
  private readonly content = inject(ContentService);
  private readonly catalog = inject(CatalogService);

  readonly techSlug = signal('');
  readonly activeLesson = signal<Lesson | undefined>(undefined);

  readonly technologyResource = resource({
    params: () => this.techSlug() || undefined,
    loader: ({ params }) => this.content.load<Technology>(`technologies/${params}/overview.json`),
  });

  /** Compiled technology (has lessons) or undefined while loading / for planned technologies. */
  readonly technology = computed<Technology | undefined>(() =>
    this.technologyResource.hasValue() ? this.technologyResource.value() : undefined,
  );
  /** Catalog entry, available for every technology including planned ones. */
  readonly catalogEntry = computed<TechnologyCatalogEntry | undefined>(() => this.catalog.technology(this.techSlug()));
  readonly category = computed(() => {
    const entry = this.catalogEntry();
    return entry ? this.catalog.category(entry.categorySlug) : undefined;
  });
  readonly name = computed(() => this.technology()?.name ?? this.catalogEntry()?.name ?? '');
  readonly isLoading = computed(() => this.technologyResource.isLoading() || this.catalog.isLoading());
  /** True once we know the slug matches nothing in the catalog. */
  readonly unknown = computed(() => !this.isLoading() && this.catalog.technologies().length > 0 && !this.catalogEntry());
  readonly lessons = computed(() => this.technology()?.lessons ?? []);
}
