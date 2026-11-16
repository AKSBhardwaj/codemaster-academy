import type { Provider } from '@angular/core';
import {
  CONTENT_SOURCE,
  ContentNotFoundError,
  type ContentSource,
} from '../content/loader/content-source';

/** Minimal valid home config for component tests. */
export const EMPTY_HOME_CONFIG = {
  popularLanguages: [],
  popularFrameworks: [],
  featuredPaths: [],
  whyUs: [],
  faq: [],
  playgroundPromo: { title: 'Playground', text: 'Run code in the browser.', bullets: [] },
};

/** Fixtures that make the shell render with an empty catalog. */
export const EMPTY_CATALOG_FIXTURES: Record<string, unknown> = {
  'catalog/categories.json': [],
  'catalog/technologies.json': [],
  'learning-paths/index.json': [],
  'site/home.json': EMPTY_HOME_CONFIG,
  'search/core.json': { version: 1, generatedOn: '2026-01-01', documents: [] },
};

/** Replaces the HTTP content source with in-memory fixtures keyed by relative path. */
export function provideTestContent(
  files: Record<string, unknown> = EMPTY_CATALOG_FIXTURES,
): Provider[] {
  const source: ContentSource = {
    load: <T>(path: string): Promise<T> =>
      path in files
        ? Promise.resolve(files[path] as T)
        : Promise.reject(new ContentNotFoundError(path)),
  };
  return [{ provide: CONTENT_SOURCE, useValue: source }];
}
