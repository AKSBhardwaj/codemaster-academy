/**
 * Site-wide constants shared by the Angular application and the build scripts.
 * Keep this module free of Angular dependencies so build scripts can use it too.
 */
import { DEPLOYMENT } from './site-deployment';

export const SITE_URL: string = DEPLOYMENT.siteUrl;
export const SITE_BASE_PATH: string = DEPLOYMENT.baseHref;
export const SITE_NAME = 'CodeMaster Academy';

/** Root-relative asset paths must include the repository prefix on GitHub project Pages. */
export function publicPath(path: string): string {
  if (/^(?:https?:|data:|blob:)/i.test(path)) return path;
  const base = SITE_BASE_PATH.replace(/\/$/, '');
  const value = '/' + path.replace(/^\/+/, '');
  if (base && (value === base || value.startsWith(base + '/'))) return value;
  return base + value;
}

/** Page URLs end in /, matching GitHub Pages directory redirects. Asset URLs keep their extensions. */
export function absoluteSiteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  const value = publicPath(path);
  const withSlash = /[?#]|\.[a-z0-9]+$/i.test(value) || value.endsWith('/') ? value : value + '/';
  return new URL(withSlash, SITE_URL).href;
}
