import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DIFFICULTY_LABEL, type TechnologyCatalogEntry } from '../../../core/models/content';
import { CatalogService } from '../../../core/services/catalog.service';
import { StatusBadgeComponent } from '../status-badge/status-badge';
import { TechIconComponent } from '../tech-icon/tech-icon';

/** Catalog card for a technology. `grid` shows description and metadata; `compact` is an icon + name tile. */
@Component({
  selector: 'cma-technology-card',
  imports: [RouterLink, StatusBadgeComponent, TechIconComponent],
  templateUrl: './technology-card.html',
  styleUrl: './technology-card.scss',
  host: { '[class.cma-technology-card-host--compact]': 'variant() === "compact"' },
})
export class TechnologyCardComponent {
  readonly technology = input.required<TechnologyCatalogEntry>();
  readonly variant = input<'grid' | 'compact'>('grid');
  private readonly catalog = inject(CatalogService);
  protected readonly category = computed(() =>
    this.catalog.category(this.technology().categorySlug),
  );
  protected readonly difficulty = computed(() => DIFFICULTY_LABEL[this.technology().difficulty]);
  protected readonly link = computed(() => ['/tutorials', this.technology().slug]);
}
