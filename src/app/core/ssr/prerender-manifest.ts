import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { PrerenderManifest } from '../../../content-schema/manifest';

export type { PrerenderManifest };

const EMPTY: PrerenderManifest = {
  generatedOn: '',
  categories: [],
  technologies: [],
  indexableTechnologies: [],
  lessons: [],
  references: [],
  examples: [],
  exercises: [],
  quizzes: [],
  learningPaths: [],
};

let cached: Promise<PrerenderManifest> | undefined;

/**
 * Reads `.generated/content/manifest.json` (written by `npm run content:build`) once per build.
 * A missing manifest yields no parametrised routes instead of failing the build.
 */
export function readPrerenderManifest(): Promise<PrerenderManifest> {
  cached ??= (async () => {
    const file = resolve(process.cwd(), '.generated', 'content', 'manifest.json');
    try {
      const raw = await readFile(file, 'utf8');
      return { ...EMPTY, ...(JSON.parse(raw) as Partial<PrerenderManifest>) };
    } catch {
      console.warn(`[prerender] manifest not found at ${file}; run "npm run content:build" first.`);
      return EMPTY;
    }
  })();
  return cached;
}
