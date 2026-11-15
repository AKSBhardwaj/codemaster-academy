import { Injectable, computed, inject } from '@angular/core';
import type { TechnologyCatalogEntry } from '../models/content';
import { BookmarkStore } from './bookmark.store';
import { CatalogService } from './catalog.service';
import { PathStore } from './path.store';
import { ProgressStore } from './progress.store';
import { RecentStore } from './recent.store';

export interface Recommendation {
  kind: 'lesson' | 'technology' | 'path';
  title: string;
  reason: string;
  path: string;
  technology?: TechnologyCatalogEntry;
}

/**
 * Rule-based, explainable recommendations computed from browser-local activity. Nothing is sent anywhere;
 * every recommendation states the rule that produced it.
 */
@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly catalog = inject(CatalogService);
  private readonly progress = inject(ProgressStore);
  private readonly recent = inject(RecentStore);
  private readonly bookmarks = inject(BookmarkStore);
  private readonly paths = inject(PathStore);

  readonly recommendations = computed<Recommendation[]>(() => {
    const list: Recommendation[] = [];
    const seen = new Set<string>();
    const add = (item: Recommendation): void => {
      if (seen.has(item.path)) return;
      seen.add(item.path);
      list.push(item);
    };

    const last = this.recent.recent()[0];
    if (last && !this.progress.isCompleted(last.tech, last.slug)) {
      add({
        kind: 'lesson',
        title: last.title,
        reason: 'You opened this lesson recently and have not marked it complete.',
        path: `/tutorials/${last.tech}/${last.slug}`,
      });
    }

    for (const tech of this.catalog.published()) {
      const completed = this.progress.countFor(tech.slug);
      if (completed > 0 && completed < tech.totalLessons) {
        add({
          kind: 'technology',
          technology: tech,
          title: `Continue ${tech.name}`,
          reason: `${completed} of ${tech.totalLessons} lessons completed.`,
          path: `/tutorials/${tech.slug}`,
        });
      }
    }

    for (const slug of this.paths.enrolled()) {
      const path = this.catalog.paths().find((p) => p.slug === slug);
      if (!path) continue;
      const next = this.catalog
        .bySlugs(path.technologySlugs)
        .find((t) => t.totalLessons > 0 && this.progress.countFor(t.slug) < t.totalLessons);
      if (next)
        add({
          kind: 'technology',
          technology: next,
          title: `${next.name} (next on ${path.title})`,
          reason: `Next available stage of a path you enrolled in.`,
          path: `/tutorials/${next.slug}`,
        });
    }

    for (const slug of this.bookmarks.technologies()) {
      const tech = this.catalog.technology(slug);
      if (tech && tech.status !== 'planned' && !this.isFinished(tech))
        add({
          kind: 'technology',
          technology: tech,
          title: tech.name,
          reason: 'You bookmarked this tutorial.',
          path: `/tutorials/${tech.slug}`,
        });
    }

    for (const tech of this.catalog.published().filter((t) => t.featured && !this.isFinished(t))) {
      add({
        kind: 'technology',
        technology: tech,
        title: tech.name,
        reason: 'A complete, featured tutorial to start next.',
        path: `/tutorials/${tech.slug}`,
      });
    }

    if (list.length < 3) {
      for (const path of this.catalog
        .paths()
        .filter((p) => p.featured && !this.paths.isEnrolled(p.slug))
        .slice(0, 3)) {
        add({
          kind: 'path',
          title: `${path.title} path`,
          reason: 'A guided roadmap if you prefer structure.',
          path: `/learning-paths/${path.slug}`,
        });
      }
    }
    return list.slice(0, 6);
  });

  /** Every published lesson of the technology is marked complete. */
  private isFinished(tech: TechnologyCatalogEntry): boolean {
    return tech.totalLessons > 0 && this.progress.countFor(tech.slug) >= tech.totalLessons;
  }
}
