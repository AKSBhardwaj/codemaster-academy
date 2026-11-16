import { Component, afterNextRender, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime, map } from 'rxjs';
import { DIFFICULTY_LABEL, type Difficulty } from '../../../core/models/content';
import { CatalogService } from '../../../core/services/catalog.service';
import { SeoService, type PageSeo } from '../../../core/services/seo.service';
import { itemList } from '../../../core/seo/json-ld';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { IconComponent } from '../../../shared/components/icon/icon';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { TechnologyCardComponent } from '../../../shared/components/technology-card/technology-card';

const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

@Component({
  selector: 'cma-catalog',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    TechnologyCardComponent,
    EmptyStateComponent,
    IconComponent,
  ],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
})
export class CatalogPage {
  protected readonly catalog = inject(CatalogService);
  private readonly seo = inject(SeoService);
  private readonly routeSeo = inject(ActivatedRoute).snapshot.data['seo'] as PageSeo | undefined;
  protected readonly interactive = signal(false);
  protected readonly search = new FormControl({ value: '', disabled: true }, { nonNullable: true });
  protected readonly category = signal<string>('all');
  protected readonly difficulties = signal<ReadonlySet<Difficulty>>(new Set(DIFFICULTIES));
  protected readonly difficultyOptions = DIFFICULTIES;
  protected readonly difficultyLabel = DIFFICULTY_LABEL;
  private readonly query = toSignal(
    this.search.valueChanges.pipe(
      debounceTime(80),
      map((value) => value.trim().toLowerCase()),
    ),
    { initialValue: '' },
  );

  constructor() {
    // Keep prerendered controls disabled until their input handlers are attached.
    afterNextRender(() => {
      this.search.enable({ emitEvent: false });
      this.interactive.set(true);
    });
    // ItemList structured data for every published tutorial, applied once the catalog has loaded.
    effect(() => {
      const published = this.catalog.published();
      if (!published.length || !this.routeSeo) return;
      this.seo.apply({
        ...this.routeSeo,
        jsonLd: [
          itemList(
            'Published tutorials',
            published.map((t) => ({
              name: `${t.name} Tutorial`,
              url: this.seo.absoluteUrl(`/tutorials/${t.slug}`),
            })),
          ),
        ],
      });
    });
  }

  protected readonly filtered = computed(() => {
    const query = this.query();
    const category = this.category();
    const difficulties = this.difficulties();
    return this.catalog
      .technologies()
      .filter(
        (t) =>
          (category === 'all' || t.categorySlug === category) &&
          difficulties.has(t.difficulty) &&
          (!query ||
            t.name.toLowerCase().includes(query) ||
            t.tags.some((tag) => tag.includes(query))),
      );
  });

  protected readonly groups = computed(() => {
    const visible = this.filtered();
    return this.catalog
      .categories()
      .map((category) => ({
        category,
        technologies: visible.filter((t) => t.categorySlug === category.slug),
      }))
      .filter((group) => group.technologies.length > 0);
  });

  protected readonly isFiltered = computed(
    () =>
      this.query() !== '' ||
      this.category() !== 'all' ||
      this.difficulties().size !== DIFFICULTIES.length,
  );

  protected toggleDifficulty(difficulty: Difficulty): void {
    this.difficulties.update((set) => toggle(set, difficulty));
  }

  protected reset(): void {
    this.search.setValue('');
    this.category.set('all');
    this.difficulties.set(new Set(DIFFICULTIES));
  }
}

function toggle<T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}
