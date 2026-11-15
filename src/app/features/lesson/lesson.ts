import { Component, DestroyRef, computed, effect, inject, input, resource } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/config/site-config';
import type { Lesson } from '../../core/models/content';
import { breadcrumbList, techArticle } from '../../core/seo/json-ld';
import { ContentService } from '../../core/services/content.service';
import { ProgressStore } from '../../core/services/progress.store';
import { BookmarkStore } from '../../core/services/bookmark.store';
import { RecentStore } from '../../core/services/recent.store';
import { SeoService } from '../../core/services/seo.service';
import { ContentRendererComponent } from '../../content/renderer/content-renderer';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { IconComponent } from '../../shared/components/icon/icon';
import { TutorialContext } from '../technology/tutorial-context';
import { LessonNavigationComponent } from './lesson-navigation';

const lessonPath = (tech: string, lesson: string): string =>
  `technologies/${tech}/lessons/${lesson}.json`;

@Component({
  selector: 'cma-lesson',
  imports: [
    DatePipe,
    RouterLink,
    ContentRendererComponent,
    BreadcrumbsComponent,
    EmptyStateComponent,
    IconComponent,
    LessonNavigationComponent,
  ],
  templateUrl: './lesson.html',
})
export class LessonPage {
  readonly tech = input.required<string>();
  readonly lesson = input.required<string>();

  protected readonly context = inject(TutorialContext);
  protected readonly progress = inject(ProgressStore);
  protected readonly bookmarks = inject(BookmarkStore);
  private readonly recent = inject(RecentStore);
  private readonly content = inject(ContentService);
  private readonly seo = inject(SeoService);
  private readonly site = inject(SITE_CONFIG);

  protected readonly lessonResource = resource({
    params: () => ({ tech: this.tech(), lesson: this.lesson() }),
    loader: ({ params }) => this.content.load<Lesson>(lessonPath(params.tech, params.lesson)),
  });
  /** Resource value, or the prerendered/transferred lesson while the loader resolves (keeps hydration stable). */
  protected readonly data = computed<Lesson | undefined>(() =>
    this.lessonResource.hasValue()
      ? this.lessonResource.value()
      : this.content.peek<Lesson>(lessonPath(this.tech(), this.lesson())),
  );
  protected readonly notFound = computed(() => this.lessonResource.status() === 'error');
  protected readonly completed = computed(() =>
    this.progress.isCompleted(this.tech(), this.lesson()),
  );
  protected readonly bookmarked = computed(() =>
    this.bookmarks.isLessonBookmarked(this.tech(), this.lesson()),
  );
  protected readonly total = computed(() => this.context.lessons().length);
  protected readonly crumbs = computed(() => {
    const lesson = this.data();
    const category = this.context.category();
    return [
      { label: 'Tutorials', path: '/tutorials' },
      ...(category ? [{ label: category.name, path: `/tutorials/category/${category.slug}` }] : []),
      { label: this.context.name() || this.tech(), path: `/tutorials/${this.tech()}` },
      { label: lesson?.title ?? '' },
    ];
  });

  constructor() {
    effect(() => this.context.activeLesson.set(this.data()));
    effect(() => {
      const lesson = this.data();
      if (lesson && this.recent.hydrated()) {
        this.recent.record({
          tech: lesson.technologySlug,
          techName: lesson.technologyName,
          slug: lesson.slug,
          title: lesson.title,
        });
      }
    });
    inject(DestroyRef).onDestroy(() => this.context.activeLesson.set(undefined));
    effect(() => {
      const lesson = this.data();
      if (lesson) {
        const url = this.seo.absoluteUrl(`/tutorials/${lesson.technologySlug}/${lesson.slug}`);
        this.seo.apply({
          title: lesson.seo.title,
          description: lesson.seo.description,
          type: 'article',
          jsonLd: [
            breadcrumbList([
              { name: 'Tutorials', url: this.seo.absoluteUrl('/tutorials') },
              {
                name: `${lesson.technologyName} Tutorial`,
                url: this.seo.absoluteUrl(`/tutorials/${lesson.technologySlug}`),
              },
              { name: lesson.title, url },
            ]),
            techArticle(lesson, url, this.site.name, this.site.siteUrl),
          ],
        });
      } else if (this.notFound()) {
        this.seo.apply({
          title: 'Lesson not found',
          description: 'This lesson does not exist.',
          robots: 'noindex,nofollow',
        });
      }
    });
  }

  protected toggleComplete(): void {
    this.progress.toggle(this.tech(), this.lesson());
  }

  protected toggleBookmark(): void {
    const lesson = this.data();
    if (lesson)
      this.bookmarks.toggleLesson({
        tech: lesson.technologySlug,
        slug: lesson.slug,
        title: lesson.title,
        techName: lesson.technologyName,
      });
  }
}
