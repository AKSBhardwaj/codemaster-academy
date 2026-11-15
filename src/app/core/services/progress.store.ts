import { Injectable, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { PersistenceService } from './persistence.service';
import { PlatformService } from './platform.service';

const KEY = 'progress:completed';
type CompletedMap = Record<string, string[]>;

/**
 * Lesson completion stored in the browser (no account required). Loaded after the first render so
 * prerendered HTML and the hydrated view match; the UI updates once the data is in.
 */
@Injectable({ providedIn: 'root' })
export class ProgressStore {
  private readonly persistence = inject(PersistenceService);
  private readonly completed = signal<CompletedMap>({});
  /** True once browser storage has been read. */
  readonly hydrated = signal(false);
  readonly completedSets = computed(() => new Map(Object.entries(this.completed()).map(([tech, slugs]) => [tech, new Set(slugs)])));
  readonly totalCompleted = computed(() => Object.values(this.completed()).reduce((sum, slugs) => sum + slugs.length, 0));

  constructor() {
    const injector = inject(Injector);
    if (inject(PlatformService).isBrowser) {
      afterNextRender(
        () => {
          this.completed.set(this.persistence.read<CompletedMap>(KEY, {}));
          this.hydrated.set(true);
        },
        { injector },
      );
    }
  }

  isCompleted(tech: string, lesson: string): boolean {
    return this.completedSets().get(tech)?.has(lesson) ?? false;
  }

  completedFor(tech: string): ReadonlySet<string> {
    return this.completedSets().get(tech) ?? new Set();
  }

  countFor(tech: string): number {
    return this.completed()[tech]?.length ?? 0;
  }

  toggle(tech: string, lesson: string): void {
    this.completed.update((map) => {
      const current = new Set(map[tech] ?? []);
      if (current.has(lesson)) current.delete(lesson);
      else current.add(lesson);
      return { ...map, [tech]: [...current] };
    });
    this.persistence.write(KEY, this.completed());
  }

  reset(): void {
    this.completed.set({});
    this.persistence.remove(KEY);
  }
}
