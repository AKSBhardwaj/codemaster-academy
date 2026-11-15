import { Injectable, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { PersistenceService } from './persistence.service';
import { PlatformService } from './platform.service';

const KEY = 'quizzes:results';
const MAX_ATTEMPTS = 10;

export interface QuizAttempt {
  at: string;
  total: number;
  correct: number;
  percent: number;
  passed: boolean;
}

export interface QuizHistory {
  best: number;
  title?: string;
  attempts: QuizAttempt[];
}

/** Quiz attempt history per quiz id, stored in the browser. */
@Injectable({ providedIn: 'root' })
export class QuizStore {
  private readonly persistence = inject(PersistenceService);
  private readonly history = signal<Record<string, QuizHistory>>({});
  readonly hydrated = signal(false);
  readonly all = computed(() => this.history());

  constructor() {
    const injector = inject(Injector);
    if (inject(PlatformService).isBrowser) {
      afterNextRender(
        () => {
          this.history.set(this.persistence.read<Record<string, QuizHistory>>(KEY, {}));
          this.hydrated.set(true);
        },
        { injector },
      );
    }
  }

  record(quizId: string, attempt: Omit<QuizAttempt, 'at'>, title?: string): void {
    this.history.update((map) => {
      const previous = map[quizId] ?? { best: 0, attempts: [] };
      const entry: QuizAttempt = { ...attempt, at: new Date().toISOString() };
      return {
        ...map,
        [quizId]: {
          best: Math.max(previous.best, attempt.percent),
          title: title ?? previous.title,
          attempts: [entry, ...previous.attempts].slice(0, MAX_ATTEMPTS),
        },
      };
    });
    this.persistence.write(KEY, this.history());
  }

  historyFor(quizId: string): QuizHistory | undefined {
    return this.history()[quizId];
  }

  reset(): void {
    this.history.set({});
    this.persistence.remove(KEY);
  }
}
