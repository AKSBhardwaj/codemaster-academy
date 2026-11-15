import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, map } from 'rxjs';
import { DIFFICULTY_LABEL, STATUS_LABEL, type Difficulty, type TechnologyStatus } from '../../../core/models/content';
import { CatalogService } from '../../../core/services/catalog.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { IconComponent } from '../../../shared/components/icon/icon';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { TechnologyCardComponent } from '../../../shared/components/technology-card/technology-card';

const STATUSES: TechnologyStatus[] = ['complete', 'in-progress', 'planned'];
const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

@Component({
  selector: 'cma-catalog',
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent, TechnologyCardComponent, EmptyStateComponent, IconComponent],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
})
export class CatalogPage {
  protected readonly catalog = inject(CatalogService);
  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly category = signal<string>('all');
  protected readonly statuses = signal<ReadonlySet<TechnologyStatus>>(new Set(STATUSES));
  protected readonly difficulties = signal<ReadonlySet<Difficulty>>(new Set(DIFFICULTIES));
  protected readonly statusOptions = STATUSES;
  protected readonly difficultyOptions = DIFFICULTIES;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly difficultyLabel = DIFFICULTY_LABEL;
  private readonly query = toSignal(
    this.search.valueChanges.pipe(
      debounceTime(80),
      map((value) => value.trim().toLowerCase()),
    ),
    { initialValue: '' },
  );

  protected readonly filtered = computed(() => {
    const query = this.query();
    const category = this.category();
    const statuses = this.statuses();
    const difficulties = this.difficulties();
    return this.catalog.technologies().filter(
      (t) =>
        (category === 'all' || t.categorySlug === category) &&
        statuses.has(t.status) &&
        difficulties.has(t.difficulty) &&
        (!query || t.name.toLowerCase().includes(query) || t.tags.some((tag) => tag.includes(query))),
    );
  });

  protected readonly groups = computed(() => {
    const visible = this.filtered();
    return this.catalog
      .categories()
      .map((category) => ({ category, technologies: visible.filter((t) => t.categorySlug === category.slug) }))
      .filter((group) => group.technologies.length > 0);
  });

  protected readonly isFiltered = computed(
    () =>
      this.query() !== '' ||
      this.category() !== 'all' ||
      this.statuses().size !== STATUSES.length ||
      this.difficulties().size !== DIFFICULTIES.length,
  );

  protected toggleStatus(status: TechnologyStatus): void {
    this.statuses.update((set) => toggle(set, status));
  }

  protected toggleDifficulty(difficulty: Difficulty): void {
    this.difficulties.update((set) => toggle(set, difficulty));
  }

  protected reset(): void {
    this.search.setValue('');
    this.category.set('all');
    this.statuses.set(new Set(STATUSES));
    this.difficulties.set(new Set(DIFFICULTIES));
  }
}

function toggle<T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}
