import { Injectable, Injector, afterNextRender, inject, signal } from '@angular/core';
import { PersistenceService } from './persistence.service';
import { PlatformService } from './platform.service';

const KEY = 'paths:enrolled';

/** Learning paths the learner has enrolled in (browser-local). */
@Injectable({ providedIn: 'root' })
export class PathStore {
  private readonly persistence = inject(PersistenceService);
  readonly enrolled = signal<string[]>([]);
  readonly hydrated = signal(false);

  constructor() {
    const injector = inject(Injector);
    if (inject(PlatformService).isBrowser) {
      afterNextRender(
        () => {
          this.enrolled.set(this.persistence.read<string[]>(KEY, []));
          this.hydrated.set(true);
        },
        { injector },
      );
    }
  }

  isEnrolled(slug: string): boolean {
    return this.enrolled().includes(slug);
  }

  toggle(slug: string): void {
    this.enrolled.update((list) =>
      list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug],
    );
    this.persistence.write(KEY, this.enrolled());
  }

  reset(): void {
    this.enrolled.set([]);
    this.persistence.remove(KEY);
  }
}
