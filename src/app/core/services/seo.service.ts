import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SITE_CONFIG } from '../config/site-config';

export type RobotsDirective = 'index,follow' | 'noindex,follow' | 'noindex,nofollow';

export interface JsonLd {
  '@context': 'https://schema.org';
  '@type': string;
  [key: string]: unknown;
}

export interface PageSeo {
  title: string;
  description: string;
  /** Path (without origin) used for the canonical URL; defaults to the current URL path. */
  canonicalPath?: string;
  robots?: RobotsDirective;
  type?: 'website' | 'article';
  /** Absolute or root-relative image path for social cards. */
  image?: string;
  /** When false the brand suffix is not appended to the document title. */
  withBrandSuffix?: boolean;
  jsonLd?: JsonLd[];
}

const JSON_LD_ID = 'cma-jsonld';

/** Central owner of document metadata: title, description, canonical, robots, Open Graph, Twitter and JSON-LD. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly site = inject(SITE_CONFIG);

  /** Applies `data.seo` of the deepest activated route after every navigation. Pages with dynamic data call `apply` themselves. */
  watchRoutes(): void {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const seo = this.deepestRoute(this.router.routerState.root).snapshot.data['seo'] as PageSeo | undefined;
      if (seo) this.apply(seo);
    });
  }

  apply(seo: PageSeo): void {
    const fullTitle = seo.withBrandSuffix === false ? seo.title : `${seo.title} | ${this.site.name}`;
    const canonical = this.absoluteUrl(seo.canonicalPath ?? this.currentPath());
    const image = this.absoluteUrl(seo.image ?? this.site.defaultOgImagePath);

    this.title.setTitle(fullTitle);
    this.setMeta('description', seo.description);
    this.setMeta('robots', seo.robots ?? 'index,follow');
    this.setProperty('og:site_name', this.site.name);
    this.setProperty('og:type', seo.type ?? 'website');
    this.setProperty('og:title', fullTitle);
    this.setProperty('og:description', seo.description);
    this.setProperty('og:url', canonical);
    this.setProperty('og:image', image);
    this.setMeta('twitter:card', 'summary_large_image');
    this.setMeta('twitter:title', fullTitle);
    this.setMeta('twitter:description', seo.description);
    this.setMeta('twitter:image', image);
    this.setCanonical(canonical);
    this.setJsonLd(seo.jsonLd ?? []);
  }

  absoluteUrl(path: string): string {
    if (/^https?:\/\//.test(path)) return path;
    const normalised = path.startsWith('/') ? path : `/${path}`;
    return `${this.site.siteUrl}${normalised === '/' ? '' : normalised.replace(/\/+$/, '')}`;
  }

  private currentPath(): string {
    return this.router.url.split(/[?#]/)[0] || '/';
  }

  private deepestRoute(route: ActivatedRoute): ActivatedRoute {
    let current = route;
    while (current.firstChild) current = current.firstChild;
    return current;
  }

  private setMeta(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }

  private setProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content });
  }

  private setCanonical(href: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private setJsonLd(items: JsonLd[]): void {
    this.document.getElementById(JSON_LD_ID)?.remove();
    if (items.length === 0) return;
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = JSON_LD_ID;
    // "<" is escaped so content can never close the script element.
    script.textContent = JSON.stringify(items.length === 1 ? items[0] : items).replace(/</g, '\\u003c');
    this.document.head.appendChild(script);
  }
}
