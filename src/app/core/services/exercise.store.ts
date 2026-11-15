import { Injectable, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { PersistenceService } from './persistence.service';
import { PlatformService } from './platform.service';

const KEY = 'exercises:attempts';

export interface ExerciseRecord {
  attempts: number;
  solved: boolean;
  lastAt: string;
}

/** Exercise attempts and solved state, stored in the browser (hydration-safe like ProgressStore). */
@Injectable({ providedIn: 'root' })
export class ExerciseStore {
  private readonly persistence = inject(PersistenceService);
  private readonly records = signal<Record<string, ExerciseRecord>>({});
  readonly hydrated = signal(false);
  readonly solvedIds = computed(() => new Set(Object.entries(this.records()).filter(([, r]) => r.solved).map(([id]) => id)));

  constructor() {
    const injector = inject(Injector);
    if (inject(PlatformService).isBrowser) {
      afterNextRender(
        () => {
          this.records.set(this.persistence.read<Record<string, ExerciseRecord>>(KEY, {}));
          this.hydrated.set(true);
        },
        { injector },
      );
    }
  }

  record(id: string, correct: boolean): void {
    this.records.update((map) => {
      const previous = map[id];
      return { ...map, [id]: { attempts: (previous?.attempts ?? 0) + 1, solved: previous?.solved || correct, lastAt: new Date().toISOString() } };
    });
    this.persistence.write(KEY, this.records());
  }

  isSolved(id: string): boolean {
    return this.solvedIds().has(id);
  }

  attemptsFor(id: string): number {
    return this.records()[id]?.attempts ?? 0;
  }

  solvedCount(ids: readonly string[]): number {
    const solved = this.solvedIds();
    return ids.filter((id) => solved.has(id)).length;
  }

  reset(): void {
    this.records.set({});
    this.persistence.remove(KEY);
  }
}
