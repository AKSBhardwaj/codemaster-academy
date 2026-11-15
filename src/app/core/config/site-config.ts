import { InjectionToken } from '@angular/core';
import type { UiIconName } from '../../shared/icons/ui-icons.generated';

/** Brand and site identity. Change these values to rebrand without touching application logic. */
export interface SiteConfig {
  readonly name: string;
  readonly shortName: string;
  readonly tagline: string;
  readonly description: string;
  /** Absolute origin used for canonical URLs, Open Graph and the sitemap (no trailing slash). */
  readonly siteUrl: string;
  readonly logoPath: string;
  readonly defaultOgImagePath: string;
  readonly contactEmail: string;
  readonly social: readonly SocialLink[];
  readonly foundedYear: number;
}

export interface SocialLink {
  readonly name: string;
  readonly url: string;
  readonly icon: UiIconName;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  name: 'CodeMaster Academy',
  shortName: 'CodeMaster',
  tagline: 'Learn to code with clear, practical tutorials',
  description:
    'Free, structured programming tutorials with runnable examples, exercises and quizzes covering 100+ languages, frameworks, databases and developer tools.',
  // Placeholder origin until hosting is decided; used for canonical URLs and the sitemap.
  siteUrl: 'https://codemaster-academy.example',
  logoPath: '/brand/logo.svg',
  defaultOgImagePath: '/brand/og-default.png',
  contactEmail: 'hello@codemaster-academy.example',
  // Add real profiles here; the footer hides the section while this list is empty.
  social: [],
  foundedYear: 2026,
};

export const SITE_CONFIG = new InjectionToken<SiteConfig>('SITE_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_SITE_CONFIG,
});
