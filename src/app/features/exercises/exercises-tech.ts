import { Component, computed, effect, inject, input, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DIFFICULTY_LABEL, type Difficulty, type ExerciseSet, type ExerciseType } from '../../core/models/content';
import { breadcrumbList } from '../../core/seo/json-ld';
import { CatalogService } from '../../core/services/catalog.service';
import { ContentService } from '../../core/services/content.service';
import { ExerciseStore } from '../../core/services/exercise.store';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { ExerciseCardComponent } from './exercise-card/exercise-card';
import { EXERCISE_TYPE_LABEL } from './grading';

const TYPES: ExerciseType[] = ['multiple-choice', 'true-false', 'fill-blank', 'predict-output', 'find-error', 'coding-task'];
const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

@Component({
  selector: 'cma-exercises-tech',
  imports: [RouterLink, BreadcrumbsComponent, EmptyStateComponent, PageHeaderComponent, ExerciseCardComponent],
  templateUrl: './exercises-tech.html',
})
export class ExercisesTechPage {
  readonly tech = input.required<string>();
  protected readonly types = TYPES;
  protected readonly difficulties = DIFFICULTIES;
  protected readonly typeLabel = EXERCISE_TYPE_LABEL;
  protected readonly difficultyLabel = DIFFICULTY_LABEL;
  protected readonly typeFilter = signal<ExerciseType | 'all'>('all');
  protected readonly difficultyFilter = signal<Difficulty | 'all'>('all');
  protected readonly lessonFilter = signal<string>('all');
  protected readonly store = inject(ExerciseStore);
  private readonly content = inject(ContentService);
  private readonly catalog = inject(CatalogService);
  private readonly seo = inject(SeoService);

  protected readonly entry = computed(() => this.catalog.technology(this.tech()));
  protected readonly setResource = resource({
    params: () => this.tech(),
    loader: ({ params }) => this.content.load<ExerciseSet>(`technologies/${params}/exercises.json`),
  });
  protected readonly set = computed(() => (this.setResource.hasValue() ? this.setResource.value() : undefined));
  protected readonly missing = computed(() => this.setResource.status() === 'error');
  protected readonly lessons = computed(() => [...new Set(this.set()?.exercises.map((e) => e.lessonSlug) ?? [])]);
  protected readonly visible = computed(() => {
    const type = this.typeFilter();
    const difficulty = this.difficultyFilter();
    const lesson = this.lessonFilter();
    return (this.set()?.exercises ?? []).filter((e) => (type === 'all' || e.type === type) && (difficulty === 'all' || e.difficulty === difficulty) && (lesson === 'all' || e.lessonSlug === lesson));
  });
  protected readonly solved = computed(() => this.store.solvedCount(this.set()?.exercises.map((e) => e.id) ?? []));
  protected readonly crumbs = computed(() => [{ label: 'Exercises', path: '/exercises' }, { label: this.entry()?.name ?? this.tech() }]);

  constructor() {
    effect(() => {
      const set = this.set();
      if (set) {
        this.seo.apply({
          title: set.title,
          description: set.description,
          jsonLd: [breadcrumbList([{ name: 'Exercises', url: this.seo.absoluteUrl('/exercises') }, { name: set.title, url: this.seo.absoluteUrl(`/exercises/${this.tech()}`) }])],
        });
      } else if (this.missing()) {
        this.seo.apply({ title: `${this.entry()?.name ?? 'Technology'} exercises`, description: 'These exercises have not been published yet.', robots: 'noindex,follow' });
      }
    });
  }

  protected lessonTitle(slug: string): string {
    return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
}
