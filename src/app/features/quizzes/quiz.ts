import { Component, computed, effect, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Quiz } from '../../core/models/content';
import { breadcrumbList } from '../../core/seo/json-ld';
import { CatalogService } from '../../core/services/catalog.service';
import { ContentService } from '../../core/services/content.service';
import { QuizStore } from '../../core/services/quiz.store';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { QuizRunnerComponent } from './quiz-runner/quiz-runner';

@Component({
  selector: 'cma-quiz',
  imports: [RouterLink, BreadcrumbsComponent, EmptyStateComponent, PageHeaderComponent, QuizRunnerComponent],
  templateUrl: './quiz.html',
})
export class QuizPage {
  readonly tech = input.required<string>();
  protected readonly store = inject(QuizStore);
  private readonly content = inject(ContentService);
  private readonly catalog = inject(CatalogService);
  private readonly seo = inject(SeoService);

  protected readonly entry = computed(() => this.catalog.technology(this.tech()));
  protected readonly quizResource = resource({
    params: () => this.tech(),
    loader: ({ params }) => this.content.load<Quiz>(`technologies/${params}/quiz.json`),
  });
  protected readonly quiz = computed(() => (this.quizResource.hasValue() ? this.quizResource.value() : undefined));
  protected readonly missing = computed(() => this.quizResource.status() === 'error');
  protected readonly history = computed(() => {
    const quiz = this.quiz();
    return quiz ? this.store.historyFor(quiz.id) : undefined;
  });
  protected readonly crumbs = computed(() => [{ label: 'Quizzes', path: '/quizzes' }, { label: this.entry()?.name ?? this.tech() }]);

  constructor() {
    effect(() => {
      const quiz = this.quiz();
      if (quiz) {
        this.seo.apply({
          title: quiz.title,
          description: quiz.description,
          jsonLd: [breadcrumbList([{ name: 'Quizzes', url: this.seo.absoluteUrl('/quizzes') }, { name: quiz.title, url: this.seo.absoluteUrl(`/quizzes/${this.tech()}`) }])],
        });
      } else if (this.missing()) {
        this.seo.apply({ title: `${this.entry()?.name ?? 'Technology'} quiz`, description: 'This quiz has not been published yet.', robots: 'noindex,follow' });
      }
    });
  }
}
