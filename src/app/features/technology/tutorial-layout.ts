import { Component, computed, input, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon';
import { OffcanvasComponent } from '../../shared/components/offcanvas/offcanvas';
import { titleFromSlug } from '../../shared/utils/slug';
import { TutorialSidebarComponent, type SidebarSection } from './sidebar/tutorial-sidebar';

/**
 * Three-column tutorial layout: lesson sidebar (drawer below lg), content, contextual sidebar (xl and up).
 * Phase 4 feeds the sidebar from the technology overview; until then it renders an honest empty state.
 */
@Component({
  selector: 'cma-tutorial-layout',
  imports: [RouterOutlet, IconComponent, OffcanvasComponent, TutorialSidebarComponent],
  templateUrl: './tutorial-layout.html',
  styleUrl: './tutorial-layout.scss',
})
export class TutorialLayoutComponent {
  readonly tech = input.required<string>();
  protected readonly techName = computed(() => titleFromSlug(this.tech()));
  protected readonly sections = signal<SidebarSection[]>([]);
  protected readonly drawerOpen = signal(false);
  protected readonly collapsed = signal(false);
}
