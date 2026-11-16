import { Injectable, inject, signal } from '@angular/core';
import { PersistenceService } from './persistence.service';

const RECENT_KEY = 'search:recent';
const MAX_RECENT = 8;

/** Open/closed state of the global search dialog and the learner's recent searches. */
@Injectable({ providedIn: 'root' })
export class SearchUiStore {
  private readonly persistence = inject(PersistenceService);
  readonly isOpen = signal(false);
  readonly recent = signal<string[]>(this.persistence.read<string[]>(RECENT_KEY, []));

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.update((open) => !open);
  }

  remember(query: string): void {
    const text = query.trim();
    if (!text) return;
    this.recent.update((list) =>
      [text, ...list.filter((item) => item.toLowerCase() !== text.toLowerCase())].slice(
        0,
        MAX_RECENT,
      ),
    );
    this.persistence.write(RECENT_KEY, this.recent());
  }

  clearRecent(): void {
    this.recent.set([]);
    this.persistence.remove(RECENT_KEY);
  }
}
