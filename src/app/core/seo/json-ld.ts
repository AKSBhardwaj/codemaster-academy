import type { JsonLd } from '../services/seo.service';
import type { Lesson, Technology } from '../models/content';

export interface Crumb {
  name: string;
  url: string;
}

export function breadcrumbList(items: Crumb[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url })),
  };
}

export function techArticle(lesson: Lesson, url: string, siteName: string, siteUrl: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: lesson.title,
    description: lesson.seo.description,
    url,
    dateModified: lesson.updatedOn,
    inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
    author: { '@type': 'Organization', name: siteName, url: siteUrl },
    publisher: { '@type': 'Organization', name: siteName, url: siteUrl },
    proficiencyLevel: 'Beginner',
  };
}

/** Course structured data is only emitted for complete tutorials (genuine, free, self-paced courses). */
export function course(technology: Technology, url: string, siteName: string, siteUrl: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `${technology.name} Tutorial`,
    description: technology.seo.description,
    url,
    provider: { '@type': 'Organization', name: siteName, url: siteUrl },
    isAccessibleForFree: true,
    inLanguage: 'en',
    numberOfCredits: 0,
    hasCourseInstance: [{ '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: `PT${Math.max(1, Math.round(technology.estimatedMinutes / 60))}H` }],
    offers: [{ '@type': 'Offer', category: 'Free', price: 0, priceCurrency: 'USD' }],
  };
}
