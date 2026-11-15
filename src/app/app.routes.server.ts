import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';
import { readPrerenderManifest } from './core/ssr/prerender-manifest';

/**
 * Static-output rendering strategy:
 * - every public page is prerendered at build time (parameters come from the content manifest),
 * - interactive/user pages render on the client only and are marked noindex by their route data.
 */
const prerenderFromManifest = (
  params: (manifest: Awaited<ReturnType<typeof readPrerenderManifest>>) => Record<string, string>[],
): ServerRoute => ({
  path: '',
  renderMode: RenderMode.Prerender,
  fallback: PrerenderFallback.Client,
  getPrerenderParams: async () => params(await readPrerenderManifest()),
});

const withPath = (path: string, route: ServerRoute): ServerRoute => ({ ...route, path });

export const serverRoutes: ServerRoute[] = [
  withPath(
    'tutorials/category/:category',
    prerenderFromManifest((m) => m.categories.map((category) => ({ category }))),
  ),
  withPath('tutorials/:tech', prerenderFromManifest((m) => m.technologies.map((tech) => ({ tech })))),
  withPath('tutorials/:tech/:lesson', prerenderFromManifest((m) => m.lessons)),
  withPath('references/:tech', prerenderFromManifest((m) => m.references.map((tech) => ({ tech })))),
  withPath('examples/:tech', prerenderFromManifest((m) => m.examples.map((tech) => ({ tech })))),
  withPath('exercises/:tech', prerenderFromManifest((m) => m.exercises.map((tech) => ({ tech })))),
  withPath('quizzes/:tech', prerenderFromManifest((m) => m.quizzes.map((tech) => ({ tech })))),
  withPath('learning-paths/:slug', prerenderFromManifest((m) => m.learningPaths.map((slug) => ({ slug })))),
  { path: 'playground', renderMode: RenderMode.Client },
  { path: 'search', renderMode: RenderMode.Client },
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'register', renderMode: RenderMode.Client },
  { path: 'dashboard', renderMode: RenderMode.Client },
  { path: 'profile', renderMode: RenderMode.Client },
  { path: 'bookmarks', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
