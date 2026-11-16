import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';
import { readPrerenderManifest } from './core/ssr/prerender-manifest';

/**
 * Static-output rendering strategy: every route is prerendered so each URL has an index.html on any static host.
 * Interactive/user pages prerender a neutral shell (marked noindex by their route data) and load browser-only
 * state after hydration. Parameters for dynamic routes come from the content manifest.
 */
type Manifest = Awaited<ReturnType<typeof readPrerenderManifest>>;

const fromManifest = (
  path: string,
  params: (manifest: Manifest) => Record<string, string>[],
): ServerRoute => ({
  path,
  renderMode: RenderMode.Prerender,
  fallback: PrerenderFallback.Client,
  getPrerenderParams: async () => params(await readPrerenderManifest()),
});

export const serverRoutes: ServerRoute[] = [
  fromManifest('tutorials/category/:category', (m) =>
    m.categories.map((category) => ({ category })),
  ),
  fromManifest('tutorials/:tech', (m) => m.technologies.map((tech) => ({ tech }))),
  fromManifest('tutorials/:tech/:lesson', (m) => m.lessons),
  fromManifest('references/:tech', (m) => m.references.map((tech) => ({ tech }))),
  fromManifest('examples/:tech', (m) => m.examples.map((tech) => ({ tech }))),
  fromManifest('exercises/:tech', (m) => m.exercises.map((tech) => ({ tech }))),
  fromManifest('quizzes/:tech', (m) => m.quizzes.map((tech) => ({ tech }))),
  fromManifest('learning-paths/:slug', (m) => m.learningPaths.map((slug) => ({ slug }))),
  { path: '**', renderMode: RenderMode.Prerender },
];
