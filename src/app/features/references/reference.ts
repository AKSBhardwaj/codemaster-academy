import {
  Component,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  resource,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { Reference } from '../../core/models/content';
import { breadcrumbList } from '../../core/seo/json-ld';
import { CatalogService } from '../../core/services/catalog.service';
import { ContentService } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs';
import { CodeBlockComponent } from '../../shared/components/code-block/code-block';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { debounceTime, map } from 'rxjs';

@Component({
  selector: 'cma-reference',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    BreadcrumbsComponent,
    CodeBlockComponent,
    EmptyStateComponent,
    PageHeaderComponent,
  ],
  templateUrl: './reference.html',
  styleUrl: './reference.scss',
})
export class ReferencePage {
  readonly tech = input.required<string>();
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
  protected readonly referenceResource = resource({
    params: () => this.tech(),
    loader: ({ params }) => this.content.load<Reference>(`technologies/${params}/reference.json`),
  });
  protected readonly reference = computed(() =>
    this.referenceResource.hasValue()
      ? this.referenceResource.value()
      : this.content.peek<Reference>(`technologies/${this.tech()}/reference.json`),
  );
  protected readonly missing = computed(() => this.referenceResource.status() === 'error');
  protected readonly groups = computed(() => {
    const query = this.query();
    const groups = this.reference()?.groups ?? [];
    if (!query) return groups;
    return groups
      .map((group) => ({
        ...group,
        entries: group.entries.filter(
          (e) => e.name.toLowerCase().includes(query) || e.summary.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.entries.length > 0);
  });
  protected readonly total = computed(
    () => this.reference()?.groups.reduce((sum, g) => sum + g.entries.length, 0) ?? 0,
  );
  protected readonly crumbs = computed(() => [
    { label: 'References', path: '/references' },
    { label: this.entry()?.name ?? this.tech() },
  ]);

  constructor() {
    afterNextRender(() => this.filter.enable({ emitEvent: false }));
    effect(() => {
      const reference = this.reference();
      const entry = this.entry();
      if (reference) {
        this.seo.apply({
          title: reference.title,
          description: `${reference.title}. ${reference.description}`,
          jsonLd: [
            breadcrumbList([
              { name: 'References', url: this.seo.absoluteUrl('/references') },
              { name: reference.title, url: this.seo.absoluteUrl(`/references/${this.tech()}`) },
            ]),
          ],
        });
      } else if (this.missing()) {
        this.seo.apply({
          title: `${entry?.name ?? 'Reference'} reference`,
          description: 'This reference could not load. Please try again.',
          robots: 'noindex,follow',
        });
      }
    });
  }
}
