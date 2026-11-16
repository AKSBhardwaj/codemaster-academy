import { HomeCodePreviewComponent } from './home-code-preview';
import { Component, afterNextRender, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/config/site-config';
import { CatalogService } from '../../core/services/catalog.service';
import { SeoService } from '../../core/services/seo.service';
import { faqPage, organization, webSite } from '../../core/seo/json-ld';
import { CategoryCardComponent } from '../../shared/components/category-card/category-card';
import { IconComponent } from '../../shared/components/icon/icon';
import { PathCardComponent } from '../../shared/components/path-card/path-card';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header';
import { TechnologyCardComponent } from '../../shared/components/technology-card/technology-card';

@Component({
  selector: 'cma-home',
  imports: [
    RouterLink,
    IconComponent,
    TechnologyCardComponent,
    CategoryCardComponent,
    PathCardComponent,
    SectionHeaderComponent,
    HomeCodePreviewComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage {
  protected readonly site = inject(SITE_CONFIG);
  protected readonly catalog = inject(CatalogService);
  protected readonly query = signal('');
  protected readonly interactive = signal(false);
  protected readonly openFaq = signal<number | null>(0);
  private readonly router = inject(Router);

  protected readonly home = this.catalog.home;
  private readonly seo = inject(SeoService);

  constructor() {
    afterNextRender(() => this.interactive.set(true));
    // Structured data for the home page: who publishes the site, the site search and the FAQ shown below.
    effect(() => {
      const home = this.home();
      if (!home) return;
      const identity = {
        name: this.site.name,
        siteUrl: this.site.siteUrl,
        logoPath: this.site.logoPath,
        description: this.site.description,
        contactEmail: this.site.contactEmail,
      };
      this.seo.apply({
        title: `${this.site.name} – ${this.site.tagline}`,
        description: this.site.description,
        withBrandSuffix: false,
        canonicalPath: '/',
        jsonLd: [organization(identity), webSite(identity), faqPage(home.faq ?? [])],
      });
    });
  }
  protected readonly featuredPaths = computed(() => {
    const slugs = this.home()?.featuredPaths ?? [];
    const map = new Map(this.catalog.paths().map((p) => [p.slug, p]));
    return slugs.map((slug) => map.get(slug)).filter((p): p is NonNullable<typeof p> => !!p);
  });
  protected readonly popularLanguages = computed(() =>
    this.catalog
      .bySlugs(this.home()?.popularLanguages ?? [])
      .filter((tech) => tech.status !== 'planned'),
  );
  protected readonly categories = computed(() =>
    this.catalog
      .byCategory()
      .map(({ category, technologies }) => ({ category, count: technologies.length })),
  );
  protected readonly totalTechnologies = computed(() => this.catalog.technologies().length);
  protected readonly totalLessons = computed(() =>
    this.catalog.technologies().reduce((sum, tech) => sum + tech.totalLessons, 0),
  );
  protected readonly startingSteps = [
    {
      slug: 'html',
      name: 'Give your idea a home.',
      symbol: '</>',
      text: 'Add words, pictures, and links. HTML is how your first web page comes together.',
      action: 'Learn HTML',
    },
    {
      slug: 'css',
      name: 'Make it feel like you.',
      symbol: '#',
      text: 'Pick the colours, shapes, and spaces. CSS helps you turn a plain page into your own.',
      action: 'Explore CSS',
    },
    {
      slug: 'javascript',
      name: 'Bring it to life.',
      symbol: 'JS',
      text: 'Make a button do something. Use JavaScript to add little moments of magic to your page.',
      action: 'Try JavaScript',
    },
  ];

  protected updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected submitSearch(event: Event): void {
    event.preventDefault();
    if (!this.interactive()) return;
    const q = this.query().trim();
    void this.router.navigate(['/search'], q ? { queryParams: { q } } : {});
  }

  protected toggleFaq(index: number): void {
    this.openFaq.update((current) => (current === index ? null : index));
  }
}
