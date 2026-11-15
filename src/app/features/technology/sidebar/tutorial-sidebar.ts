import { Component, computed, input, model, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { debounceTime, map } from 'rxjs';
import { IconComponent } from '../../../shared/components/icon/icon';

export interface SidebarItem {
  readonly label: string;
  readonly path: string;
  readonly completed?: boolean;
}

export interface SidebarSection {
  readonly id: string;
  readonly title: string;
  readonly items: readonly SidebarItem[];
}

let nextId = 0;

/** Collapsible, searchable lesson navigation used both as the desktop sidebar and inside the mobile drawer. */
@Component({
  selector: 'cma-tutorial-sidebar',
  imports: [ReactiveFormsModule, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './tutorial-sidebar.html',
  styleUrl: './tutorial-sidebar.scss',
})
export class TutorialSidebarComponent {
  readonly title = input.required<string>();
  readonly overviewPath = input<string>('');
  readonly sections = input.required<readonly SidebarSection[]>();
  readonly variant = input<'sidebar' | 'drawer'>('sidebar');
  readonly collapsed = model(false);
  readonly navigated = output<void>();

  protected readonly searchId = `cma-sidebar-search-${nextId++}`;
  protected readonly filter = new FormControl('', { nonNullable: true });
  protected readonly query = toSignal(
    this.filter.valueChanges.pipe(
      debounceTime(80),
      map((value) => value.trim().toLowerCase()),
    ),
    { initialValue: '' },
  );
  private readonly collapsedSections = signal<ReadonlySet<string>>(new Set());

  protected readonly visibleSections = computed(() => {
    const query = this.query();
    if (!query) return this.sections();
    return this.sections()
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.label.toLowerCase().includes(query)),
      }))
      .filter((section) => section.items.length > 0);
  });
  protected readonly totalItems = computed(() => this.sections().reduce((sum, s) => sum + s.items.length, 0));
  protected readonly completedItems = computed(() =>
    this.sections().reduce((sum, s) => sum + s.items.filter((i) => i.completed).length, 0),
  );
  protected readonly showBody = computed(() => this.variant() === 'drawer' || !this.collapsed());

  protected isExpanded(id: string): boolean {
    return this.query() !== '' || !this.collapsedSections().has(id);
  }

  protected toggleSection(id: string): void {
    this.collapsedSections.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected toggleCollapsed(): void {
    this.collapsed.set(!this.collapsed());
  }
}
