import { Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { SeoService } from '../../../core/services/seo.service';
import { itemList } from '../../../core/seo/json-ld';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { IconComponent } from '../../../shared/components/icon/icon';
import { TechnologyCardComponent } from '../../../shared/components/technology-card/technology-card';
import type { UiIconName } from '../../../shared/icons/ui-icons.generated';

@Component({
  selector: 'cma-category',
  imports: [RouterLink, TechnologyCardComponent, EmptyStateComponent, IconComponent],
  templateUrl: './category.html',
  styleUrl: './category.scss',
})
export class CategoryPage {
  readonly category = input.required<string>();
  protected readonly catalog = inject(CatalogService);
  protected readonly entry = computed(() => this.catalog.category(this.category()));
  protected readonly technologies = computed(() =>
    this.catalog.technologies().filter((t) => t.categorySlug === this.category()),
  );
  protected readonly otherCategories = computed(() =>
    this.catalog.categories().filter((c) => c.slug !== this.category()),
  );
  protected readonly loaded = computed(() => this.catalog.categories().length > 0);
  private readonly seo = inject(SeoService);

  constructor() {
    effect(() => {
      const entry = this.entry();
      if (entry) {
        const published = this.technologies().filter((t) => t.status !== 'planned');
        this.seo.apply({
          title: `${entry.name} Tutorials`,
          description: entry.description,
          jsonLd: [
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Tutorials',
                  item: this.seo.absoluteUrl('/tutorials'),
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: entry.name,
                  item: this.seo.absoluteUrl(`/tutorials/category/${entry.slug}`),
                },
              ],
            },
            ...(published.length
              ? [
                  itemList(
                    `${entry.name} tutorials`,
                    published.map((t) => ({
                      name: `${t.name} Tutorial`,
                      url: this.seo.absoluteUrl(`/tutorials/${t.slug}`),
                    })),
                  ),
                ]
              : []),
          ],
        });
      } else if (this.loaded()) {
        this.seo.apply({
          title: 'Category not found',
          description: 'This category does not exist.',
          robots: 'noindex,nofollow',
        });
      }
    });
  }

  protected icon(name: string): UiIconName {
    return name as UiIconName;
  }
}
