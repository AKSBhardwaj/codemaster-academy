import { Component, computed, effect, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DIFFICULTY_LABEL,
  type LearningPath,
  type PathStage,
  type Technology,
  type TechnologyCatalogEntry,
} from '../../core/models/content';
import { breadcrumbList } from '../../core/seo/json-ld';
import { CatalogService } from '../../core/services/catalog.service';
import { ContentService } from '../../core/services/content.service';
import { PathStore } from '../../core/services/path.store';
import { ProgressStore } from '../../core/services/progress.store';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { IconComponent } from '../../shared/components/icon/icon';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { TechIconComponent } from '../../shared/components/tech-icon/tech-icon';
import type { UiIconName } from '../../shared/icons/ui-icons.generated';

export interface StageView {
  stage: PathStage;
  index: number;
  technology?: TechnologyCatalogEntry;
  alternatives: TechnologyCatalogEntry[];
  completed: number;
  total: number;
  percent: number;
  done: boolean;
}

@Component({
  selector: 'cma-path-detail',
  imports: [
    RouterLink,
    BreadcrumbsComponent,
    EmptyStateComponent,
    IconComponent,
    StatusBadgeComponent,
    TechIconComponent,
  ],
  templateUrl: './path-detail.html',
  styleUrl: './path-detail.scss',
})
export class PathDetailPage {
  readonly slug = input.required<string>();
  protected readonly difficultyLabel = DIFFICULTY_LABEL;
  protected readonly paths = inject(PathStore);
  private readonly content = inject(ContentService);
  private readonly catalog = inject(CatalogService);
  private readonly progress = inject(ProgressStore);
  private readonly seo = inject(SeoService);

  protected readonly pathResource = resource({
    params: () => this.slug(),
    loader: ({ params }) => this.content.load<LearningPath>(`learning-paths/${params}.json`),
  });
  protected readonly path = computed(() =>
    this.pathResource.hasValue()
      ? this.pathResource.value()
      : this.content.peek<LearningPath>(`learning-paths/${this.slug()}.json`),
  );
  protected readonly missing = computed(() => this.pathResource.status() === 'error');
  protected readonly enrolled = computed(() => this.paths.isEnrolled(this.slug()));

  protected readonly stages = computed<StageView[]>(() => {
    const path = this.path();
    if (!path) return [];
    return path.stages.map((stage, index) => {
      const technology = stage.technologySlug
        ? this.catalog.technology(stage.technologySlug)
        : undefined;
      const total = technology?.totalLessons ?? 0;
      const completed = technology ? Math.min(total, this.progress.countFor(technology.slug)) : 0;
      return {
        stage,
        index,
        technology,
        alternatives: this.catalog.bySlugs(stage.alternativeSlugs ?? []),
        completed,
        total,
        percent: total ? Math.round((completed / total) * 100) : 0,
        done: total > 0 && completed >= total,
      };
    });
  });
  protected readonly totals = computed(() => {
    const withLessons = this.stages().filter((s) => s.total > 0);
    const total = withLessons.reduce((sum, s) => sum + s.total, 0);
    const completed = withLessons.reduce((sum, s) => sum + s.completed, 0);
    return {
      total,
      completed,
      percent: total ? Math.round((completed / total) * 100) : 0,
      availableStages: withLessons.length,
    };
  });
  /** First stage with published lessons that is not finished yet. */
  protected readonly nextStage = computed(() => this.stages().find((s) => s.total > 0 && !s.done));
  private readonly nextOverview = resource({
    params: () => this.nextStage()?.technology?.slug,
    loader: ({ params }) => this.content.load<Technology>(`technologies/${params}/overview.json`),
  });
  protected readonly nextLesson = computed(() => {
    const slug = this.nextStage()?.technology?.slug;
    const overview = this.nextOverview.hasValue()
      ? this.nextOverview.value()
      : slug
        ? this.content.peek<Technology>(`technologies/${slug}/overview.json`)
        : undefined;
    if (!overview) return undefined;
    const completed = this.progress.completedFor(overview.slug);
    const lesson = overview.lessons.find((l) => !completed.has(l.slug));
    return lesson ? { tech: overview.slug, techName: overview.name, ...lesson } : undefined;
  });
  protected readonly crumbs = computed(() => [
    { label: 'Learning paths', path: '/learning-paths' },
    { label: this.path()?.title ?? '' },
  ]);

  constructor() {
    effect(() => {
      const path = this.path();
      if (path) {
        this.seo.apply({
          title: path.seo.title,
          description: path.seo.description,
          jsonLd: [
            breadcrumbList([
              { name: 'Learning paths', url: this.seo.absoluteUrl('/learning-paths') },
              { name: path.title, url: this.seo.absoluteUrl(`/learning-paths/${path.slug}`) },
            ]),
          ],
        });
      } else if (this.missing()) {
        this.seo.apply({
          title: 'Learning path not found',
          description: 'This learning path does not exist.',
          robots: 'noindex,nofollow',
        });
      }
    });
  }

  protected icon(name: string): UiIconName {
    return name as UiIconName;
  }

  protected accentFor(entry: TechnologyCatalogEntry): string | undefined {
    return this.catalog.category(entry.categorySlug)?.accent;
  }

  protected toggleEnrol(): void {
    this.paths.toggle(this.slug());
  }
}
