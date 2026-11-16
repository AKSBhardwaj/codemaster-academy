import { Injectable, InjectionToken, inject } from '@angular/core';
import type MiniSearch from 'minisearch';
import type {
  SearchDocument,
  SearchDocumentKind,
  SearchIndexFile,
  TechnologyStatus,
} from '../models/content';
import { SEARCH_INDEX_OPTIONS, SEARCH_QUERY_OPTIONS } from '../../../content-schema/search';
import { ContentService } from './content.service';

export interface SearchHit {
  id: string;
  kind: SearchDocumentKind;
  title: string;
  subtitle: string;
  url: string;
  technology?: string;
  category?: string;
  status?: TechnologyStatus;
  score: number;
  /** Document terms that matched the query, used for highlighting. */
  terms: string[];
}

export interface SearchOptions {
  limit?: number;
  kinds?: readonly SearchDocumentKind[];
}

/** Search backend contract. The local MiniSearch provider can be swapped for an API-backed one. */
export interface SearchProvider {
  warmUp(): Promise<void>;
  search(query: string, options?: SearchOptions): Promise<SearchHit[]>;
}

export const KIND_LABEL: Record<SearchDocumentKind, string> = {
  technology: 'Tutorial',
  category: 'Category',
  path: 'Learning path',
  lesson: 'Lesson',
  example: 'Example',
  exercises: 'Exercises',
  quiz: 'Quiz',
  reference: 'Reference',
};

const STATUS_BOOST: Record<TechnologyStatus, number> = {
  complete: 1.3,
  'in-progress': 1.1,
  planned: 0.85,
};
/** Tutorials and lessons are what learners usually want; roadmaps and categories rank slightly lower for the same terms. */
const KIND_BOOST: Partial<Record<SearchDocumentKind, number>> = {
  technology: 1.6,
  lesson: 1.2,
  category: 1,
  path: 0.9,
};

/** Client-side search over the prebuilt index files shipped with the content. */
export class LocalSearchProvider implements SearchProvider {
  private readonly content = inject(ContentService);
  private index?: Promise<MiniSearch<SearchDocument>>;

  warmUp(): Promise<void> {
    return this.load().then(() => undefined);
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchHit[]> {
    const text = query.trim();
    if (!text) return [];
    const index = await this.load();
    const results = index.search(text, {
      ...SEARCH_QUERY_OPTIONS,
      boostDocument: (_id, _term, stored) =>
        (STATUS_BOOST[(stored?.['status'] as TechnologyStatus) ?? 'complete'] ?? 1) *
        (KIND_BOOST[stored?.['kind'] as SearchDocumentKind] ?? 1),
    });
    const normalised = text.toLowerCase();
    const hits: SearchHit[] = results.map((result) => ({
      id: String(result.id),
      kind: result['kind'] as SearchDocumentKind,
      title: result['title'] as string,
      subtitle: result['subtitle'] as string,
      url: result['url'] as string,
      technology: result['technology'] as string | undefined,
      category: result['category'] as string | undefined,
      status: result['status'] as TechnologyStatus | undefined,
      score: result.score * (String(result['title']).toLowerCase() === normalised ? 2 : 1),
      terms: result.terms,
    }));
    hits.sort((a, b) => b.score - a.score);
    const filtered = options.kinds ? hits.filter((hit) => options.kinds?.includes(hit.kind)) : hits;
    return filtered.slice(0, options.limit ?? 20);
  }

  private load(): Promise<MiniSearch<SearchDocument>> {
    this.index ??= (async () => {
      const files = await Promise.all([
        this.content.load<SearchIndexFile>('search/core.json'),
        this.content.load<SearchIndexFile>('search/lessons.json').catch(() => null),
      ]);
      // Lazy-loaded so the search engine is not part of the initial bundle.
      const { default: MiniSearchCtor } = await import('minisearch');
      const index = new MiniSearchCtor<SearchDocument>({
        idField: SEARCH_INDEX_OPTIONS.idField,
        fields: [...SEARCH_INDEX_OPTIONS.fields],
        storeFields: [...SEARCH_INDEX_OPTIONS.storeFields],
      });
      for (const file of files) if (file) index.addAll(file.documents);
      return index;
    })();
    return this.index;
  }
}

export const SEARCH_PROVIDER = new InjectionToken<SearchProvider>('SEARCH_PROVIDER', {
  providedIn: 'root',
  factory: () => new LocalSearchProvider(),
});

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly provider = inject(SEARCH_PROVIDER);

  warmUp(): Promise<void> {
    return this.provider.warmUp();
  }

  search(query: string, options?: SearchOptions): Promise<SearchHit[]> {
    return this.provider.search(query, options);
  }
}
