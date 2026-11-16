import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { LearningPathSummary, TechnologyCatalogEntry } from '../../core/models/content';
import { LearnerStore } from '../../core/services/learner.store';
import { BookmarkStore } from '../../core/services/bookmark.store';
import { CatalogService } from '../../core/services/catalog.service';
import { ExerciseStore } from '../../core/services/exercise.store';
import { PathStore } from '../../core/services/path.store';
import { ProgressStore } from '../../core/services/progress.store';
import { QuizStore } from '../../core/services/quiz.store';
import { RecentStore } from '../../core/services/recent.store';
import { RecommendationService } from '../../core/services/recommendation.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { IconComponent } from '../../shared/components/icon/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { TechIconComponent } from '../../shared/components/tech-icon/tech-icon';
import { CertificateComponent } from './certificate';

export interface PathProgress {
  path: LearningPathSummary;
  total: number;
  completed: number;
  percent: number;
  complete: boolean;
}

export interface TechnologyProgress {
  technology: TechnologyCatalogEntry;
  completed: number;
  percent: number;
}

@Component({
  selector: 'cma-dashboard',
  imports: [
    RouterLink,
    EmptyStateComponent,
    IconComponent,
    PageHeaderComponent,
    TechIconComponent,
    CertificateComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  protected readonly learner = inject(LearnerStore);
  protected readonly progress = inject(ProgressStore);
  protected readonly exercises = inject(ExerciseStore);
  protected readonly quizzes = inject(QuizStore);
  protected readonly bookmarks = inject(BookmarkStore);
  protected readonly recent = inject(RecentStore);
  protected readonly paths = inject(PathStore);
  protected readonly recommendations = inject(RecommendationService);
  protected readonly certificateFor = signal<PathProgress | null>(null);
  private readonly catalog = inject(CatalogService);

  protected readonly lessonsCompleted = this.progress.totalCompleted;
  protected readonly exercisesSolved = computed(() => this.exercises.solvedIds().size);
  protected readonly quizzesPassed = computed(
    () => Object.values(this.quizzes.all()).filter((h) => h.attempts.some((a) => a.passed)).length,
  );
  protected readonly quizHistory = computed(() =>
    Object.entries(this.quizzes.all()).map(([id, history]) => ({
      id,
      ...history,
      latest: history.attempts[0],
    })),
  );

  protected readonly technologiesInProgress = computed<TechnologyProgress[]>(() =>
    this.catalog
      .published()
      .map((technology) => ({ technology, completed: this.progress.countFor(technology.slug) }))
      .filter((item) => item.completed > 0)
      .map((item) => ({
        ...item,
        percent: item.technology.totalLessons
          ? Math.round((item.completed / item.technology.totalLessons) * 100)
          : 0,
      }))
      .sort((a, b) => b.percent - a.percent),
  );

  protected readonly enrolledPaths = computed<PathProgress[]>(() =>
    this.catalog
      .paths()
      .filter((path) => this.paths.isEnrolled(path.slug))
      .map((path) => {
        const techs = this.catalog.bySlugs(path.technologySlugs).filter((t) => t.totalLessons > 0);
        const total = techs.reduce((sum, t) => sum + t.totalLessons, 0);
        const completed = techs.reduce(
          (sum, t) => sum + Math.min(t.totalLessons, this.progress.countFor(t.slug)),
          0,
        );
        return {
          path,
          total,
          completed,
          percent: total ? Math.round((completed / total) * 100) : 0,
          complete: total > 0 && completed >= total,
        };
      }),
  );
  protected readonly certificates = computed(() => this.enrolledPaths().filter((p) => p.complete));
  protected readonly lastLesson = computed(() => this.recent.recent()[0]);

  protected accentFor(tech: TechnologyCatalogEntry): string | undefined {
    return this.catalog.category(tech.categorySlug)?.accent;
  }
}
