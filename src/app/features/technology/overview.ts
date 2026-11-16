import { Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DIFFICULTY_LABEL } from '../../core/models/content';
import { SITE_CONFIG } from '../../core/config/site-config';
import { breadcrumbList, course } from '../../core/seo/json-ld';
import { CatalogService } from '../../core/services/catalog.service';
import { ProgressStore } from '../../core/services/progress.store';
import { BookmarkStore } from '../../core/services/bookmark.store';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { IconComponent } from '../../shared/components/icon/icon';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { TechIconComponent } from '../../shared/components/tech-icon/tech-icon';
import { TutorialContext } from './tutorial-context';

@Component({
  selector: 'cma-technology-overview',
  imports: [
    RouterLink,
    BreadcrumbsComponent,
    EmptyStateComponent,
    IconComponent,
    StatusBadgeComponent,
    TechIconComponent,
  ],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class TechnologyOverviewPage {
  protected readonly context = inject(TutorialContext);
  protected readonly progress = inject(ProgressStore);
  protected readonly bookmarks = inject(BookmarkStore);
  protected readonly difficultyLabel = DIFFICULTY_LABEL;
  private readonly catalog = inject(CatalogService);
  private readonly seo = inject(SeoService);
  private readonly site = inject(SITE_CONFIG);

  protected readonly entry = this.context.catalogEntry;
  protected readonly technology = this.context.technology;
  protected readonly category = this.context.category;
  protected readonly prerequisites = computed(() =>
    this.catalog.bySlugs(this.entry()?.prerequisites ?? []),
  );
  protected readonly firstLesson = computed(() => this.technology()?.lessons[0]);
  protected readonly nextLesson = computed(() => {
    const tech = this.technology();
    if (!tech) return undefined;
    const completed = this.progress.completedFor(tech.slug);
    return tech.lessons.find((lesson) => !completed.has(lesson.slug)) ?? tech.lessons[0];
  });
  protected readonly completedCount = computed(() =>
    this.progress.countFor(this.context.techSlug()),
  );
  protected readonly bookmarked = computed(() =>
    this.bookmarks.isTechnologyBookmarked(this.context.techSlug()),
  );
  protected readonly estimated = computed(() => {
    const minutes = this.technology()?.estimatedMinutes ?? 0;
    if (!minutes) return '';
    return minutes < 60
      ? `${minutes} min`
      : `${Math.floor(minutes / 60)} h ${minutes % 60 ? (minutes % 60) + ' min' : ''}`.trim();
  });
  protected readonly lessonGroups = computed(() => {
    const tech = this.technology();
    if (!tech) return [];
    const bySlug = new Map(tech.lessons.map((lesson) => [lesson.slug, lesson]));
    return tech.sidebarCategories.map((category) => ({
      ...category,
      lessons: category.lessonSlugs
        .map((slug) => bySlug.get(slug))
        .filter((l): l is NonNullable<typeof l> => !!l),
    }));
  });
  protected readonly crumbs = computed(() => {
    const entry = this.entry();
    const category = this.category();
    return [
      { label: 'Tutorials', path: '/tutorials' },
      ...(category ? [{ label: category.name, path: `/tutorials/category/${category.slug}` }] : []),
      { label: entry?.name ?? '' },
    ];
  });

  constructor() {
    effect(() => {
      const entry = this.entry();
      const tech = this.technology();
      if (!entry) {
        if (this.context.unknown())
          this.seo.apply({
            title: 'Tutorial not found',
            description: 'This tutorial does not exist.',
            robots: 'noindex,nofollow',
          });
        return;
      }
      const url = this.seo.absoluteUrl(`/tutorials/${entry.slug}`);
      const crumbs = [
        { name: 'Tutorials', url: this.seo.absoluteUrl('/tutorials') },
        { name: entry.name, url },
      ];
      if (tech) {
        this.seo.apply({
          title: tech.seo.title,
          description: tech.seo.description,
          robots: tech.status === 'planned' ? 'noindex,follow' : 'index,follow',
          jsonLd: [
            breadcrumbList(crumbs),
            ...(tech.status === 'complete'
              ? [course(tech, url, this.site.name, this.site.siteUrl)]
              : []),
          ],
        });
      } else if (!this.context.isLoading()) {
        this.seo.apply({
          title: `${entry.name} Tutorial`,
          description: entry.shortDescription,
          robots: 'noindex,follow',
          jsonLd: [breadcrumbList(crumbs)],
        });
      }
    });
  }
}
