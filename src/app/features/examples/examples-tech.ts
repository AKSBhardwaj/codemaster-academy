import {
  Component,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  resource,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, map } from 'rxjs';
import { codeLanguageLabel } from '../../../content-schema/code-language';
import type { ExampleSet } from '../../core/models/content';
import { breadcrumbList } from '../../core/seo/json-ld';
import { CatalogService } from '../../core/services/catalog.service';
import { ContentService } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs';
import { CodeBlockComponent } from '../../shared/components/code-block/code-block';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

@Component({
  selector: 'cma-examples-tech',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    BreadcrumbsComponent,
    CodeBlockComponent,
    EmptyStateComponent,
    PageHeaderComponent,
  ],
  templateUrl: './examples-tech.html',
})
export class ExamplesTechPage {
  readonly tech = input.required<string>();
  protected readonly interactive = signal(false);
  protected readonly languageLabel = codeLanguageLabel;
  protected readonly language = linkedSignal<string>(() =>
    this.tech() === 'data-structures-algorithms' ? 'javascript' : 'all',
  );
  protected readonly filter = new FormControl({ value: '', disabled: true }, { nonNullable: true });
  private readonly content = inject(ContentService);
  private readonly catalog = inject(CatalogService);
  private readonly seo = inject(SeoService);
  private readonly query = toSignal(
    this.filter.valueChanges.pipe(
      debounceTime(80),
      map((v) => v.trim().toLowerCase()),
    ),
    { initialValue: '' },
  );

  protected readonly entry = computed(() => this.catalog.technology(this.tech()));
  protected readonly setResource = resource({
    params: () => this.tech(),
    loader: ({ params }) => this.content.load<ExampleSet>(`technologies/${params}/examples.json`),
  });
  protected readonly set = computed(() =>
    this.setResource.hasValue()
      ? this.setResource.value()
      : this.content.peek<ExampleSet>(`technologies/${this.tech()}/examples.json`),
  );
  protected readonly missing = computed(() => this.setResource.status() === 'error');
  protected readonly languages = computed(() => [
    ...new Set(this.set()?.examples.map((example) => example.language) ?? []),
  ]);
  protected readonly examples = computed(() => {
    const query = this.query();
    const language = this.language();
    const examples = (this.set()?.examples ?? []).filter(
      (example) => language === 'all' || example.language === language,
    );
    if (!query) return examples;
    return examples.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        e.tags.some((t) => t.includes(query)) ||
        e.description.toLowerCase().includes(query),
    );
  });
  protected readonly crumbs = computed(() => [
    { label: 'Examples', path: '/examples' },
    { label: this.entry()?.name ?? this.tech() },
  ]);

  constructor() {
    afterNextRender(() => {
      this.filter.enable({ emitEvent: false });
      this.interactive.set(true);
    });
    effect(() => {
      const set = this.set();
      if (set) {
        this.seo.apply({
          title: set.title,
          description: `${set.title}. ${set.description}`,
          jsonLd: [
            breadcrumbList([
              { name: 'Examples', url: this.seo.absoluteUrl('/examples') },
              { name: set.title, url: this.seo.absoluteUrl(`/examples/${this.tech()}`) },
            ]),
          ],
        });
      } else if (this.missing()) {
        this.seo.apply({
          title: `${this.entry()?.name ?? 'Technology'} examples`,
          description: 'These examples could not load. Please try again.',
          robots: 'noindex,follow',
        });
      }
    });
  }

  protected chooseLanguage(event: Event): void {
    if (this.interactive()) this.language.set((event.target as HTMLSelectElement).value);
  }
}
