import { Component, effect, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { SeoService, type PageSeo } from '../../core/services/seo.service';
import { itemList } from '../../core/seo/json-ld';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { PathCardComponent } from '../../shared/components/path-card/path-card';

@Component({
  selector: 'cma-paths-index',
  imports: [PageHeaderComponent, PathCardComponent],
  template: `
    <cma-page-header
      eyebrow="Roadmaps"
      title="Learning paths"
      lead="A learning path is a list of topics to follow in order. Choose what you want to learn, then take one small step. Every stage has lessons ready for you."
    />
    <div class="container-xxl py-4 py-lg-5">
      <h2 class="h4 mb-3">Choose a learning goal</h2>
      <div class="row g-3">
        @for (path of catalog.paths(); track path.slug) {
          <div class="col-12 col-sm-6 col-lg-4"><cma-path-card [path]="path" /></div>
        } @empty {
          <div class="col-12" aria-busy="true">
            <div class="cma-skeleton" style="height: 10rem"></div>
          </div>
        }
      </div>
    </div>
  `,
})
export class PathsIndexPage {
  protected readonly catalog = inject(CatalogService);
  private readonly seo = inject(SeoService);
  private readonly routeSeo = inject(ActivatedRoute).snapshot.data['seo'] as PageSeo | undefined;

  constructor() {
    effect(() => {
      const paths = this.catalog.paths();
      if (!paths.length || !this.routeSeo) return;
      this.seo.apply({
        ...this.routeSeo,
        jsonLd: [
          itemList(
            'Learning paths',
            paths.map((p) => ({
              name: p.title,
              url: this.seo.absoluteUrl(`/learning-paths/${p.slug}`),
            })),
          ),
        ],
      });
    });
  }
}
