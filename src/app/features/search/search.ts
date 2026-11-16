import { Component, afterNextRender, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import type { SearchDocumentKind } from '../../core/models/content';
import { SeoService } from '../../core/services/seo.service';
import { KIND_LABEL, SearchService, type SearchHit } from '../../core/services/search.service';
import { SearchUiStore } from '../../core/services/search-ui.store';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { IconComponent } from '../../shared/components/icon/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { HighlightMatchPipe } from '../../shared/pipes/highlight-match.pipe';

const ALL_KINDS: SearchDocumentKind[] = [
  'technology',
  'lesson',
  'category',
  'path',
  'example',
  'exercises',
  'quiz',
  'reference',
];

@Component({
  selector: 'cma-search',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    EmptyStateComponent,
    IconComponent,
    StatusBadgeComponent,
    HighlightMatchPipe,
  ],
  templateUrl: './search.html',
})
export class SearchPage {
  /** Bound from the `q` query parameter via withComponentInputBinding. */
  readonly q = input('');
  protected readonly control = new FormControl(
    { value: '', disabled: true },
    { nonNullable: true },
  );
  protected readonly hits = signal<SearchHit[]>([]);
  protected readonly searched = signal('');
  protected readonly loading = signal(false);
  protected readonly kindFilter = signal<SearchDocumentKind | 'all'>('all');
  protected readonly kindLabel = KIND_LABEL;
  protected readonly availableKinds = computed(() =>
    ALL_KINDS.filter((kind) => this.hits().some((hit) => hit.kind === kind)),
  );
  protected readonly visibleHits = computed(() => {
    const kind = this.kindFilter();
    return kind === 'all' ? this.hits() : this.hits().filter((hit) => hit.kind === kind);
  });
  private readonly typed = toSignal(
    this.control.valueChanges.pipe(
      map((value) => value.trim()),
      debounceTime(200),
      distinctUntilChanged(),
    ),
    { initialValue: null },
  );
  private readonly search = inject(SearchService);
  private readonly ui = inject(SearchUiStore);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private requestId = 0;

  constructor() {
    afterNextRender(() => this.control.enable({ emitEvent: false }));
    effect(() => {
      const fromUrl = (this.q() ?? '').trim();
      if (fromUrl !== this.control.value.trim())
        this.control.setValue(fromUrl, { emitEvent: false });
      void this.run(fromUrl);
      this.seo.apply({
        title: fromUrl ? `Search results for “${fromUrl}”` : 'Search',
        description: 'Search tutorials, lessons, examples, exercises, quizzes and categories.',
        robots: 'noindex,follow',
      });
    });
    effect(() => {
      const text = this.typed();
      // null = nothing typed yet; programmatic updates do not emit, so this only reacts to the learner typing.
      if (text !== null && text !== (this.q() ?? '').trim()) {
        void this.router.navigate(['/search'], {
          queryParams: text ? { q: text } : {},
          replaceUrl: true,
        });
      }
    });
  }

  protected setKind(kind: SearchDocumentKind | 'all'): void {
    this.kindFilter.set(kind);
  }

  protected countFor(kind: SearchDocumentKind): number {
    return this.hits().filter((hit) => hit.kind === kind).length;
  }

  private async run(text: string): Promise<void> {
    const id = ++this.requestId;
    this.searched.set(text);
    if (!text) {
      this.hits.set([]);
      return;
    }
    this.loading.set(true);
    try {
      const hits = await this.search.search(text, { limit: 60 });
      if (id !== this.requestId) return;
      this.hits.set(hits);
      this.kindFilter.set('all');
      this.ui.remember(text);
    } finally {
      if (id === this.requestId) this.loading.set(false);
    }
  }
}
