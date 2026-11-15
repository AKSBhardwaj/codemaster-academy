import { Injectable, Injector, afterNextRender, inject, signal } from '@angular/core';
import { PersistenceService } from './persistence.service';
import { PlatformService } from './platform.service';

const KEY = 'recent:lessons';
const MAX = 12;

export interface RecentLesson {
  tech: string;
  techName: string;
  slug: string;
  title: string;
  viewedAt: string;
}

/** Recently viewed lessons (most recent first), stored in the browser. */
@Injectable({ providedIn: 'root' })
export class RecentStore {
  private readonly persistence = inject(PersistenceService);
  readonly recent = signal<RecentLesson[]>([]);
  readonly hydrated = signal(false);

  constructor() {
    const injector = inject(Injector);
    if (inject(PlatformService).isBrowser) {
      afterNextRender(
        () => {
          this.recent.set(this.persistence.read<RecentLesson[]>(KEY, []));
          this.hydrated.set(true);
        },
        { injector },
      );
    }
  }

  record(lesson: Omit<RecentLesson, 'viewedAt'>): void {
    if (!this.hydrated()) return;
    this.recent.update((list) => [
      { ...lesson, viewedAt: new Date().toISOString() },
      ...list.filter((l) => !(l.tech === lesson.tech && l.slug === lesson.slug)),
    ].slice(0, MAX));
    this.persistence.write(KEY, this.recent());
  }

  reset(): void {
    this.recent.set([]);
    this.persistence.remove(KEY);
  }
}
