import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookmarkStore } from '../../core/services/bookmark.store';
import { CatalogService } from '../../core/services/catalog.service';
import { RecentStore } from '../../core/services/recent.store';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { IconComponent } from '../../shared/components/icon/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { TechnologyCardComponent } from '../../shared/components/technology-card/technology-card';

@Component({
  selector: 'cma-bookmarks',
  imports: [
    DatePipe,
    RouterLink,
    EmptyStateComponent,
    IconComponent,
    PageHeaderComponent,
    TechnologyCardComponent,
  ],
  templateUrl: './bookmarks.html',
})
export class BookmarksPage {
  protected readonly bookmarks = inject(BookmarkStore);
  protected readonly recent = inject(RecentStore);
  private readonly catalog = inject(CatalogService);
  protected readonly technologies = computed(() =>
    this.catalog.bySlugs(this.bookmarks.technologies()),
  );
}
