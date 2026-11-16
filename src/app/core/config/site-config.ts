import { InjectionToken } from '@angular/core';
import type { UiIconName } from '../../shared/icons/ui-icons.generated';
import { SITE_NAME, SITE_URL, publicPath } from '../../../content-schema/site-constants';

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
  name: SITE_NAME,
  shortName: 'CodeMaster',
  tagline: 'Learn to code, one small step at a time',
  description:
    'Learn to code with simple lessons, small examples and fun practice. Start with HTML, CSS and JavaScript. Free to use, with no account needed.',
  // Generated from the deployment address; shared with the sitemap and static HTML build.
  siteUrl: SITE_URL,
  logoPath: publicPath('/brand/logo.svg'),
  defaultOgImagePath: '/brand/og-default.png',
  // Set a real address to enable the optional email handoff on the feedback page.
  contactEmail: '',
  // Add real profiles here; the footer hides the section while this list is empty.
  social: [],
  foundedYear: 2026,
};

export const SITE_CONFIG = new InjectionToken<SiteConfig>('SITE_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_SITE_CONFIG,
});
