/**
 * Content model types for the application. The Zod schemas in src/content-schema are the single source
 * of truth; only types are imported here so Zod never reaches the browser bundle.
 */
export type {
  Catalog,
  Category,
  Difficulty,
  FaqItem,
  HomeConfig,
  IconRef,
  LearningPath,
  LearningPathSummary,
  PathStage,
  PrerenderManifest,
  SearchDocument,
  SearchDocumentKind,
  SearchIndexFile,
  SeoMeta,
  TechnologyCatalogEntry,
  TechnologyStatus,
  ValueProposition,
} from '../../../content-schema/index';

export const STATUS_LABEL: Record<'complete' | 'in-progress' | 'planned', string> = {
  complete: 'Complete',
  'in-progress': 'In progress',
  planned: 'Planned',
};

export const DIFFICULTY_LABEL: Record<'beginner' | 'intermediate' | 'advanced', string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};
