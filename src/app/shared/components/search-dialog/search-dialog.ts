import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { PlatformService } from '../../../core/services/platform.service';
import { KIND_LABEL, SearchService, type SearchHit } from '../../../core/services/search.service';
import { SearchUiStore } from '../../../core/services/search-ui.store';
import { IconComponent } from '../icon/icon';
import { StatusBadgeComponent } from '../status-badge/status-badge';
import { HighlightMatchPipe } from '../../pipes/highlight-match.pipe';
import type { UiIconName } from '../../icons/ui-icons.generated';
import type { SearchDocumentKind } from '../../../core/models/content';

const KIND_ICON: Record<SearchDocumentKind, UiIconName> = {
  technology: 'book',
  category: 'grid',
  path: 'compass',
  lesson: 'file-earmark-code',
  example: 'code-slash',
  exercises: 'pencil-square',
  quiz: 'patch-check',
  reference: 'journal-code',
};

type Status = 'idle' | 'loading' | 'results' | 'empty';

/** Global search dialog (Ctrl/Cmd+K): native <dialog>, keyboard navigation, recent searches, highlighted matches. */
@Component({
  selector: 'cma-search-dialog',
  imports: [ReactiveFormsModule, IconComponent, StatusBadgeComponent, HighlightMatchPipe],
  templateUrl: './search-dialog.html',
  styleUrl: './search-dialog.scss',
})
export class SearchDialogComponent {
  protected readonly ui = inject(SearchUiStore);
  private readonly search = inject(SearchService);
  private readonly router = inject(Router);
  private readonly platform = inject(PlatformService);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');

  protected readonly query = new FormControl('', { nonNullable: true });
  private readonly debouncedQuery = toSignal(
    this.query.valueChanges.pipe(
      map((value) => value.trim()),
      debounceTime(120),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );
  protected readonly hits = signal<SearchHit[]>([]);
  protected readonly status = signal<Status>('idle');
  protected readonly activeIndex = signal(0);
  protected readonly activeId = computed(() =>
    this.hits().length ? this.optionId(this.activeIndex()) : null,
  );
  protected readonly kindLabel = KIND_LABEL;
  private requestId = 0;

  constructor() {
    effect(() => {
      const open = this.ui.isOpen();
      if (!this.platform.isBrowser) return;
      const element = this.dialog()?.nativeElement;
      if (!element) return;
      if (open && !element.open) {
        if (typeof element.showModal === 'function') element.showModal();
        else element.setAttribute('open', '');
        void this.search.warmUp();
        setTimeout(() => this.input()?.nativeElement.focus(), 0);
      } else if (!open && element.open) {
        element.close();
      }
    });
    effect(() => {
      const text = this.debouncedQuery();
      void this.runSearch(text);
    });
  }

  protected close(): void {
    this.ui.close();
  }

  /** The native dialog closed itself (Escape); keep the store in sync. */
  protected onNativeClose(): void {
    this.ui.close();
  }

  protected optionId(index: number): string {
    return `cma-search-option-${index}`;
  }

  protected kindIcon(kind: SearchDocumentKind): UiIconName {
    return KIND_ICON[kind];
  }

  protected useRecent(text: string): void {
    this.query.setValue(text);
    this.input()?.nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.hits().length;
    switch (event.key) {
      case 'ArrowDown':
        if (count) {
          event.preventDefault();
          this.activeIndex.set((this.activeIndex() + 1) % count);
        }
        break;
      case 'ArrowUp':
        if (count) {
          event.preventDefault();
          this.activeIndex.set((this.activeIndex() - 1 + count) % count);
        }
        break;
      case 'Escape':
        // Handle it here: a search input otherwise spends the first Escape on clearing its own text.
        event.preventDefault();
        this.close();
        break;
      case 'Enter': {
        event.preventDefault();
        const hit = this.hits()[this.activeIndex()];
        if (hit) this.go(hit);
        else this.goToResultsPage();
        break;
      }
    }
  }

  protected go(hit: SearchHit): void {
    this.ui.remember(this.query.value);
    this.ui.close();
    void this.router.navigateByUrl(hit.url);
  }

  protected goToResultsPage(): void {
    const text = this.query.value.trim();
    if (!text) return;
    this.ui.remember(text);
    this.ui.close();
    void this.router.navigate(['/search'], { queryParams: { q: text } });
  }

  private async runSearch(text: string): Promise<void> {
    const id = ++this.requestId;
    if (!text) {
      this.hits.set([]);
      this.status.set('idle');
      return;
    }
    this.status.set('loading');
    try {
      const hits = await this.search.search(text, { limit: 10 });
      if (id !== this.requestId) return;
      this.hits.set(hits);
      this.activeIndex.set(0);
      this.status.set(hits.length ? 'results' : 'empty');
    } catch {
      if (id !== this.requestId) return;
      this.hits.set([]);
      this.status.set('empty');
    }
  }
}
