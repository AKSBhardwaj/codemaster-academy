import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * Shape of `.generated/content/manifest.json`, produced by `npm run content:build`.
 * Used by the server route configuration to enumerate prerender parameters.
 */
export interface PrerenderManifest {
  categories: string[];
  technologies: string[];
  lessons: { tech: string; lesson: string }[];
  references: string[];
  examples: string[];
  exercises: string[];
  quizzes: string[];
  learningPaths: string[];
}

const EMPTY: PrerenderManifest = {
  categories: [],
  technologies: [],
  lessons: [],
  references: [],
  examples: [],
  exercises: [],
  quizzes: [],
  learningPaths: [],
};

let cached: Promise<PrerenderManifest> | undefined;

/** Reads the manifest once per build. A missing manifest yields no parametrised routes instead of failing the build. */
export function readPrerenderManifest(): Promise<PrerenderManifest> {
  cached ??= (async () => {
    const file = resolve(process.cwd(), '.generated', 'content', 'manifest.json');
    try {
      const raw = await readFile(file, 'utf8');
      return { ...EMPTY, ...(JSON.parse(raw) as Partial<PrerenderManifest>) };
    } catch {
      console.warn(
        `[prerender] manifest not found at ${file}; run "npm run content:build" to prerender content routes.`,
      );
      return EMPTY;
    }
  })();
  return cached;
}
