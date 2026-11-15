import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PersistenceService } from '../../core/services/persistence.service';
import { ProgressStore } from '../../core/services/progress.store';
import { IconComponent } from '../../shared/components/icon/icon';
import { OffcanvasComponent } from '../../shared/components/offcanvas/offcanvas';
import { ContextSidebarComponent } from './context-sidebar/context-sidebar';
import { TutorialSidebarComponent, type SidebarSection } from './sidebar/tutorial-sidebar';
import { TutorialContext } from './tutorial-context';

const COLLAPSED_KEY = 'ui:sidebar-collapsed';

/** Three-column tutorial layout: lesson sidebar (drawer below lg), content, contextual sidebar (xl and up). */
@Component({
  selector: 'cma-tutorial-layout',
  imports: [RouterOutlet, IconComponent, OffcanvasComponent, TutorialSidebarComponent, ContextSidebarComponent],
  providers: [TutorialContext],
  templateUrl: './tutorial-layout.html',
  styleUrl: './tutorial-layout.scss',
})
export class TutorialLayoutComponent {
  readonly tech = input.required<string>();
  protected readonly context = inject(TutorialContext);
  protected readonly drawerOpen = signal(false);
  protected readonly collapsed = signal(false);
  private readonly progress = inject(ProgressStore);
  private readonly persistence = inject(PersistenceService);

  protected readonly sections = computed<SidebarSection[]>(() => {
    const technology = this.context.technology();
    if (!technology) return [];
    const completed = this.progress.completedFor(technology.slug);
    const bySlug = new Map(technology.lessons.map((lesson) => [lesson.slug, lesson]));
    return technology.sidebarCategories.map((category) => ({
      id: category.id,
      title: category.title,
      items: category.lessonSlugs
        .map((slug) => bySlug.get(slug))
        .filter((lesson): lesson is NonNullable<typeof lesson> => !!lesson)
        .map((lesson) => ({
          label: lesson.title,
          path: `/tutorials/${technology.slug}/${lesson.slug}`,
          completed: completed.has(lesson.slug),
        })),
    }));
  });

  constructor() {
    effect(() => this.context.techSlug.set(this.tech()));
    effect(() => {
      if (this.progress.hydrated()) this.collapsed.set(this.persistence.read<boolean>(COLLAPSED_KEY, false));
    });
  }

  protected setCollapsed(value: boolean): void {
    this.collapsed.set(value);
    this.persistence.write(COLLAPSED_KEY, value);
  }
}
