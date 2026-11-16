import { Injectable, afterNextRender, computed, inject, signal } from '@angular/core';
import { PersistenceService } from './persistence.service';

const KEY = 'learner:nickname';

/** An optional local nickname, with no identity, credentials or account. */
@Injectable({ providedIn: 'root' })
export class LearnerStore {
  private readonly persistence = inject(PersistenceService);
  readonly nickname = signal('');
  /** True once the browser's saved nickname has been read. */
  readonly hydrated = signal(false);
  readonly displayName = computed(() => this.nickname() || 'Curious learner');

  constructor() {
    afterNextRender(() => {
      const stored = this.persistence.read<unknown>(KEY, '');
      this.nickname.set(typeof stored === 'string' ? stored.trim().slice(0, 40) : '');
      this.hydrated.set(true);
    });
  }

  setNickname(value: string): boolean {
    const nickname = value.trim().slice(0, 40);
    this.nickname.set(nickname);
    return this.persistence.write(KEY, nickname);
  }

  reset(): void {
    this.nickname.set('');
    this.persistence.remove(KEY);
  }
}
