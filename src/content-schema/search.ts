import type { TechnologyStatus } from './common';

/**
 * Search index document shape. Shared by the build step (which writes the index)
 * and the application (which queries it). No runtime dependencies on purpose.
 */
export type SearchDocumentKind =
  'technology' | 'category' | 'path' | 'lesson' | 'example' | 'exercises' | 'quiz' | 'reference';

export interface SearchDocument {
  id: string;
  kind: SearchDocumentKind;
  title: string;
  subtitle: string;
  url: string;
  technology?: string;
  category?: string;
  keywords: string[];
  status?: TechnologyStatus;
}

export interface SearchIndexFile {
  version: 1;
  generatedOn: string;
  documents: SearchDocument[];
}

/** MiniSearch configuration; the SAME object must be used wherever an index is built or loaded. */
export const SEARCH_INDEX_OPTIONS = {
  idField: 'id',
  fields: ['title', 'keywords', 'subtitle', 'technology', 'category'],
  storeFields: ['kind', 'title', 'subtitle', 'url', 'technology', 'category', 'status'],
} as const;

export const SEARCH_QUERY_OPTIONS = {
  prefix: true,
  fuzzy: 0.2,
  combineWith: 'AND',
  boost: { title: 4, keywords: 3, technology: 2, subtitle: 1.5, category: 1 },
} as const;
