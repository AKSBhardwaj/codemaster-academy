import { Injectable, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { PersistenceService } from './persistence.service';
import { PlatformService } from './platform.service';

const KEY = 'bookmarks';

export interface LessonBookmark {
  tech: string;
  slug: string;
  title: string;
  techName: string;
  addedAt: string;
}

interface BookmarkState {
  technologies: string[];
  lessons: LessonBookmark[];
}

/** Bookmarked tutorials and lessons, stored in the browser (hydration-safe). */
@Injectable({ providedIn: 'root' })
export class BookmarkStore {
  private readonly persistence = inject(PersistenceService);
  private readonly state = signal<BookmarkState>({ technologies: [], lessons: [] });
  readonly hydrated = signal(false);
  readonly technologies = computed(() => this.state().technologies);
  readonly lessons = computed(() => this.state().lessons);
  readonly count = computed(() => this.state().technologies.length + this.state().lessons.length);

  constructor() {
    const injector = inject(Injector);
    if (inject(PlatformService).isBrowser) {
      afterNextRender(
        () => {
          const stored = this.persistence.read<Partial<BookmarkState>>(KEY, {});
          this.state.set({ technologies: stored.technologies ?? [], lessons: stored.lessons ?? [] });
          this.hydrated.set(true);
        },
        { injector },
      );
    }
  }

  isTechnologyBookmarked(slug: string): boolean {
    return this.state().technologies.includes(slug);
  }

  isLessonBookmarked(tech: string, slug: string): boolean {
    return this.state().lessons.some((l) => l.tech === tech && l.slug === slug);
  }

  toggleTechnology(slug: string): void {
    this.state.update((s) => ({
      ...s,
      technologies: s.technologies.includes(slug) ? s.technologies.filter((t) => t !== slug) : [...s.technologies, slug],
    }));
    this.save();
  }

  toggleLesson(bookmark: Omit<LessonBookmark, 'addedAt'>): void {
    this.state.update((s) => {
      const exists = s.lessons.some((l) => l.tech === bookmark.tech && l.slug === bookmark.slug);
      return {
        ...s,
        lessons: exists
          ? s.lessons.filter((l) => !(l.tech === bookmark.tech && l.slug === bookmark.slug))
          : [{ ...bookmark, addedAt: new Date().toISOString() }, ...s.lessons],
      };
    });
    this.save();
  }

  reset(): void {
    this.state.set({ technologies: [], lessons: [] });
    this.persistence.remove(KEY);
  }

  private save(): void {
    this.persistence.write(KEY, this.state());
  }
}
