import type { JsonLd } from '../services/seo.service';
import type { Lesson, Technology } from '../models/content';
import { absoluteSiteUrl } from '../../../content-schema/site-constants';

export interface Crumb {
  name: string;
  url: string;
}

export function breadcrumbList(items: Crumb[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function techArticle(
  lesson: Lesson,
  url: string,
  siteName: string,
  siteUrl: string,
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: lesson.title,
    description: lesson.seo.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: absoluteSiteUrl('/brand/og-default.png'),
    dateModified: lesson.updatedOn,
    inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
    author: { '@type': 'Organization', name: siteName, url: siteUrl },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
      logo: { '@type': 'ImageObject', url: absoluteSiteUrl('/brand/logo.svg') },
    },
    proficiencyLevel: 'Beginner',
  };
}

/** Course structured data is only emitted for complete tutorials (genuine, free, self-paced courses). */
export function course(
  technology: Technology,
  url: string,
  siteName: string,
  siteUrl: string,
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `${technology.name} Tutorial`,
    description: technology.seo.description,
    url,
    provider: { '@type': 'Organization', name: siteName, url: siteUrl },
    isAccessibleForFree: true,
    inLanguage: 'en',
    hasCourseInstance: [
      {
        '@type': 'CourseInstance',
        courseMode: 'Online',
        courseWorkload: `PT${Math.max(1, Math.round(technology.estimatedMinutes / 60))}H`,
      },
    ],
    offers: [{ '@type': 'Offer', category: 'Free', price: 0, priceCurrency: 'USD' }],
  };
}

export interface SiteIdentity {
  name: string;
  siteUrl: string;
  logoPath: string;
  description: string;
  contactEmail: string;
}

export function organization(site: SiteIdentity): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: site.siteUrl,
    logo: absoluteSiteUrl(site.logoPath),
    description: site.description,
    ...(site.contactEmail ? { email: site.contactEmail } : {}),
  };
}

/** WebSite with a SearchAction pointing at the site search page. */
export function webSite(site: SiteIdentity): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.siteUrl,
    inLanguage: 'en',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${site.siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function faqPage(items: readonly { question: string; answer: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function itemList(name: string, items: readonly { name: string; url: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
