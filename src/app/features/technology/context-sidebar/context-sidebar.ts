import {
  Component,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { PlatformService } from '../../../core/services/platform.service';
import { ProgressStore } from '../../../core/services/progress.store';
import { IconComponent } from '../../../shared/components/icon/icon';
import { TutorialContext } from '../tutorial-context';
import { PageAnchorService } from '../../../core/services/page-anchor.service';

/** Right-hand contextual sidebar: on this page (TOC), progress, related tutorials and practice links. */
@Component({
  selector: 'cma-context-sidebar',
  imports: [RouterLink, IconComponent],
  templateUrl: './context-sidebar.html',
  styleUrl: './context-sidebar.scss',
})
export class ContextSidebarComponent {
  protected readonly anchors = inject(PageAnchorService);
  protected readonly context = inject(TutorialContext);
  protected readonly progress = inject(ProgressStore);
  private readonly catalog = inject(CatalogService);
  private readonly platform = inject(PlatformService);
  private readonly injector = inject(Injector);
  private observer: IntersectionObserver | undefined;

  protected readonly activeId = signal<string | null>(null);
  protected readonly toc = computed(() => this.context.activeLesson()?.toc ?? []);
  protected readonly completedCount = computed(() =>
    this.progress.countFor(this.context.techSlug()),
  );
  protected readonly total = computed(() => this.context.lessons().length);
  protected readonly percent = computed(() =>
    this.total() ? Math.round((this.completedCount() / this.total()) * 100) : 0,
  );
  protected readonly related = computed(() => {
    const entry = this.context.catalogEntry();
    if (!entry) return [];
    const prerequisites = this.catalog.bySlugs(entry.prerequisites);
    const siblings = this.catalog
      .technologies()
      .filter(
        (t) =>
          t.categorySlug === entry.categorySlug &&
          t.slug !== entry.slug &&
          !entry.prerequisites.includes(t.slug),
      )
      .sort((a, b) => Number(b.status !== 'planned') - Number(a.status !== 'planned'))
      .slice(0, Math.max(0, 4 - prerequisites.length));
    return [...prerequisites, ...siblings];
  });

  constructor() {
    effect(() => {
      const toc = this.toc();
      this.activeId.set(toc[0]?.id ?? null);
      if (!this.platform.isBrowser) return;
      afterNextRender(() => this.observe(toc.map((t) => t.id)), { injector: this.injector });
    });
  }

  private observe(ids: string[]): void {
    this.observer?.disconnect();
    if (!ids.length || typeof IntersectionObserver === 'undefined') return;
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) this.activeId.set(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    );
    for (const id of ids) {
      const element = document.getElementById(id);
      if (element) this.observer.observe(element);
    }
  }
}
