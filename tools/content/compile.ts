/**
 * Content compiler: validates authored JSON under src/assets/content and emits the compiled,
 * enriched files the application loads from /assets/content/*, plus the prerender manifest,
 * search index, sitemap and JSON Schemas for editor support.
 */
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { z } from 'zod';
import {
  categorySchema,
  exerciseSetSourceSchema,
  homeConfigSchema,
  learningPathSourceSchema,
  lessonSourceSchema,
  quizSourceSchema,
  referenceSourceSchema,
  exampleSetSourceSchema,
  technologyOverviewSourceSchema,
  technologySourceSchema,
  type Category,
  type HomeConfig,
  type LearningPath,
  type LearningPathSummary,
  type LessonRef,
  type PrerenderManifest,
  type SearchDocument,
  type SearchIndexFile,
  type TechnologyCatalogEntry,
  type TechnologySource,
} from '../../src/content-schema/index';
import { unavailableHighlightLanguages } from './highlight';
import { buildSitemap, type SitemapEntry } from './sitemap';
import { ContentError, compileTechnologyFolder, type CompiledTechnology } from './technology';

export { ContentError };
export const ROOT = resolve(import.meta.dirname, '..', '..');
export const SOURCE_DIR = resolve(ROOT, 'src', 'assets', 'content');
export const OUTPUT_DIR = resolve(ROOT, '.generated', 'content');
const TECH_ICON_DIR = resolve(ROOT, 'src', 'assets', 'icons', 'tech');
const UI_ICON_LIST = resolve(ROOT, 'tools', 'icons', 'ui-icons.json');
const SCHEMA_DIR = resolve(SOURCE_DIR, 'schemas');

const STATIC_INDEXABLE = ['/', '/tutorials', '/references', '/examples', '/exercises', '/quizzes', '/learning-paths', '/about', '/contact', '/privacy-policy', '/terms'];
const STATIC_NOINDEX = ['/playground', '/search', '/login', '/register', '/dashboard', '/profile', '/bookmarks', '/404'];

export interface CompileResult {
  categories: Category[];
  technologies: TechnologyCatalogEntry[];
  compiled: Map<string, CompiledTechnology>;
  paths: LearningPath[];
  home: HomeConfig;
  manifest: PrerenderManifest;
  searchCore: SearchDocument[];
  searchLessons: SearchDocument[];
  sitemap: string;
  warnings: string[];
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function rel(path: string): string {
  return path.replace(ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
}

async function readJson(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as unknown;
  } catch (error) {
    throw new ContentError(`${rel(path)}: invalid JSON (${(error as Error).message})`);
  }
}

function parseWith<T>(schema: z.ZodType<T>, value: unknown, file: string): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const issues = result.error.issues.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`).join('\n');
  throw new ContentError(`${rel(file)}: schema validation failed\n${issues}`);
}

async function listJsonFiles(dir: string): Promise<string[]> {
  if (!(await exists(dir))) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => join(dir, entry.name))
    .sort();
}

async function loadCategories(): Promise<Category[]> {
  const file = resolve(SOURCE_DIR, 'catalog', 'categories.json');
  const raw = parseWith(z.array(categorySchema).min(1), await readJson(file), file);
  const slugs = new Set<string>();
  for (const category of raw) {
    if (slugs.has(category.slug)) throw new ContentError(`${rel(file)}: duplicate category slug "${category.slug}"`);
    slugs.add(category.slug);
  }
  return raw.sort((a, b) => a.order - b.order);
}

async function loadTechnologySources(categories: Category[]): Promise<TechnologySource[]> {
  const dir = resolve(SOURCE_DIR, 'catalog', 'technologies');
  const files = await listJsonFiles(dir);
  if (files.length === 0) throw new ContentError(`no technology files found in ${rel(dir)}`);
  const categorySlugs = new Set(categories.map((c) => c.slug));
  const all: TechnologySource[] = [];
  const seen = new Map<string, string>();
  for (const file of files) {
    const items = parseWith(z.array(technologySourceSchema), await readJson(file), file);
    for (const item of items) {
      const previous = seen.get(item.slug);
      if (previous) throw new ContentError(`${rel(file)}: duplicate technology slug "${item.slug}" (also in ${previous})`);
      seen.set(item.slug, rel(file));
      if (!categorySlugs.has(item.categorySlug)) throw new ContentError(`${rel(file)}: "${item.slug}" references unknown category "${item.categorySlug}"`);
      if (item.categorySlug !== basename(file, '.json')) throw new ContentError(`${rel(file)}: "${item.slug}" has categorySlug "${item.categorySlug}" but lives in ${basename(file)}`);
      all.push(item);
    }
  }
  const slugs = new Set(all.map((t) => t.slug));
  for (const tech of all) {
    for (const prerequisite of tech.prerequisites) {
      if (!slugs.has(prerequisite)) throw new ContentError(`technology "${tech.slug}" lists unknown prerequisite "${prerequisite}"`);
      if (prerequisite === tech.slug) throw new ContentError(`technology "${tech.slug}" lists itself as a prerequisite`);
    }
  }
  return all;
}

async function loadUiIcons(): Promise<Set<string>> {
  return new Set(JSON.parse(await readFile(UI_ICON_LIST, 'utf8')) as string[]);
}

async function validateIcons(technologies: TechnologySource[], categories: Category[], uiIcons: Set<string>): Promise<void> {
  for (const category of categories) {
    if (!uiIcons.has(category.icon)) throw new ContentError(`category "${category.slug}" uses unknown UI icon "${category.icon}"`);
  }
  for (const tech of technologies) {
    if (tech.icon.kind === 'glyph') {
      if (!uiIcons.has(tech.icon.src)) throw new ContentError(`technology "${tech.slug}" uses unknown UI icon "${tech.icon.src}"`);
    } else if (!(await exists(resolve(TECH_ICON_DIR, `${tech.icon.src}.svg`)))) {
      throw new ContentError(`technology "${tech.slug}" expects logo ${rel(TECH_ICON_DIR)}/${tech.icon.src}.svg (run npm run icons:build)`);
    }
  }
}

async function loadLearningPaths(technologies: TechnologyCatalogEntry[]): Promise<LearningPath[]> {
  const files = await listJsonFiles(resolve(SOURCE_DIR, 'learning-paths'));
  const techSlugs = new Set(technologies.map((t) => t.slug));
  const paths: LearningPath[] = [];
  const seen = new Set<string>();
  for (const file of files) {
    const source = parseWith(learningPathSourceSchema, await readJson(file), file);
    if (source.slug !== basename(file, '.json')) throw new ContentError(`${rel(file)}: slug "${source.slug}" must match the file name`);
    if (seen.has(source.slug)) throw new ContentError(`duplicate learning path slug "${source.slug}"`);
    seen.add(source.slug);
    const stageIds = new Set<string>();
    const technologySlugs: string[] = [];
    for (const stage of source.stages) {
      if (stageIds.has(stage.id)) throw new ContentError(`${rel(file)}: duplicate stage id "${stage.id}"`);
      stageIds.add(stage.id);
      for (const slug of [stage.technologySlug, ...(stage.alternativeSlugs ?? [])]) {
        if (slug && !techSlugs.has(slug)) throw new ContentError(`${rel(file)}: stage "${stage.id}" references unknown technology "${slug}"`);
      }
      if (stage.technologySlug) technologySlugs.push(stage.technologySlug);
    }
    paths.push({
      ...source,
      estimatedHours: Math.round(source.stages.reduce((sum, stage) => sum + stage.estimatedHours, 0)),
      stageCount: source.stages.length,
      technologySlugs,
    });
  }
  return paths.sort((a, b) => a.order - b.order);
}

async function loadHome(technologies: TechnologyCatalogEntry[], paths: LearningPath[], uiIcons: Set<string>): Promise<HomeConfig> {
  const file = resolve(SOURCE_DIR, 'site', 'home.json');
  const home = parseWith(homeConfigSchema, await readJson(file), file);
  const techSlugs = new Set(technologies.map((t) => t.slug));
  const pathSlugs = new Set(paths.map((p) => p.slug));
  for (const slug of [...home.popularLanguages, ...home.popularFrameworks]) {
    if (!techSlugs.has(slug)) throw new ContentError(`${rel(file)}: unknown technology "${slug}"`);
  }
  for (const slug of home.featuredPaths) {
    if (!pathSlugs.has(slug)) throw new ContentError(`${rel(file)}: unknown learning path "${slug}"`);
  }
  for (const item of home.whyUs) {
    if (!uiIcons.has(item.icon)) throw new ContentError(`${rel(file)}: unknown UI icon "${item.icon}"`);
  }
  return home;
}

/** Resolves related lesson references across technologies and validates every internal link. */
function resolveCrossReferences(compiled: Map<string, CompiledTechnology>, validPaths: Set<string>): void {
  const lessonTitle = (tech: string, slug: string): string | undefined =>
    compiled.get(tech)?.lessons.find((l) => l.slug === slug)?.title;
  for (const bundle of compiled.values()) {
    for (const lesson of bundle.lessons) {
      const source = bundle.relatedRefs.filter((r) => r.from.endsWith(`/${lesson.technologySlug}/lessons/${lesson.slug}.json`));
      const refs: LessonRef[] = [];
      for (const related of source) {
        const title = lessonTitle(related.technologySlug, related.slug);
        if (!title) throw new ContentError(`${related.from}: relatedLessons references unknown lesson "${related.technologySlug}/${related.slug}"`);
        refs.push({ technologySlug: related.technologySlug, slug: related.slug, title });
      }
      lesson.relatedLessons = refs;
    }
    for (const { href, file } of bundle.links) {
      if (/^https?:\/\//.test(href)) continue;
      if (/^mailto:/.test(href)) continue;
      if (!href.startsWith('/')) throw new ContentError(`${file}: link "${href}" must be an absolute site path or an https URL`);
      const path = href.split('#')[0].replace(/\/+$/, '') || '/';
      if (!validPaths.has(path)) throw new ContentError(`${file}: broken internal link "${href}"`);
    }
  }
}

export async function compile(): Promise<CompileResult> {
  if (!(await exists(SOURCE_DIR))) throw new ContentError(`content source directory not found: ${SOURCE_DIR}`);
  const warnings: string[] = [];
  const uiIcons = await loadUiIcons();
  const categories = await loadCategories();
  const sources = await loadTechnologySources(categories);
  await validateIcons(sources, categories, uiIcons);

  const technologies: TechnologyCatalogEntry[] = [];
  const compiled = new Map<string, CompiledTechnology>();
  for (const source of sources) {
    const base = { ...source, id: source.slug };
    const bundle = await compileTechnologyFolder(source, base, SOURCE_DIR, ROOT);
    if (bundle) {
      compiled.set(source.slug, bundle);
      const { description: _d, versionNote: _v, whatYouWillLearn: _w, learningObjectives: _l, sidebarCategories: _s, lessons: _le, counts: _c, seo: _seo, ...entry } = bundle.overview;
      technologies.push(entry);
    } else {
      technologies.push({ ...base, status: 'planned', totalLessons: 0, estimatedMinutes: 0, hasExercises: false, hasQuiz: false, hasReference: false, hasExamples: false });
    }
  }
  technologies.sort((a, b) => a.name.localeCompare(b.name));

  const paths = await loadLearningPaths(technologies);
  const home = await loadHome(technologies, paths, uiIcons);

  // Valid internal link targets for the broken-link check.
  const validPaths = new Set<string>([...STATIC_INDEXABLE, ...STATIC_NOINDEX]);
  for (const category of categories) validPaths.add(`/tutorials/category/${category.slug}`);
  for (const path of paths) validPaths.add(`/learning-paths/${path.slug}`);
  for (const tech of technologies) {
    validPaths.add(`/tutorials/${tech.slug}`);
    const bundle = compiled.get(tech.slug);
    if (!bundle) continue;
    for (const lesson of bundle.lessons) validPaths.add(`/tutorials/${tech.slug}/${lesson.slug}`);
    if (bundle.reference) validPaths.add(`/references/${tech.slug}`);
    if (bundle.exampleSet) validPaths.add(`/examples/${tech.slug}`);
    if (bundle.exerciseSet) validPaths.add(`/exercises/${tech.slug}`);
    if (bundle.quiz) validPaths.add(`/quizzes/${tech.slug}`);
  }
  resolveCrossReferences(compiled, validPaths);

  // --- search documents ---
  const categoryName = new Map(categories.map((c) => [c.slug, c.name]));
  const searchCore: SearchDocument[] = [];
  const searchLessons: SearchDocument[] = [];
  for (const category of categories) {
    searchCore.push({ id: `category:${category.slug}`, kind: 'category', title: category.name, subtitle: category.description, url: `/tutorials/category/${category.slug}`, keywords: [category.shortName] });
  }
  for (const tech of technologies) {
    const category = categoryName.get(tech.categorySlug);
    searchCore.push({ id: `technology:${tech.slug}`, kind: 'technology', title: tech.name, subtitle: tech.shortDescription, url: `/tutorials/${tech.slug}`, technology: tech.name, category, keywords: [...tech.tags, ...tech.highlights], status: tech.status });
    const bundle = compiled.get(tech.slug);
    if (!bundle) continue;
    for (const lesson of bundle.lessons) {
      searchLessons.push({ id: `lesson:${tech.slug}/${lesson.slug}`, kind: 'lesson', title: lesson.title, subtitle: lesson.summary, url: `/tutorials/${tech.slug}/${lesson.slug}`, technology: tech.name, category, keywords: [tech.name, ...lesson.toc.map((t) => t.text)], status: tech.status });
    }
    if (bundle.exampleSet) {
      for (const example of bundle.exampleSet.examples) {
        searchLessons.push({ id: `example:${tech.slug}/${example.id}`, kind: 'example', title: example.title, subtitle: example.description, url: `/examples/${tech.slug}#${example.id}`, technology: tech.name, category, keywords: [tech.name, ...example.tags], status: tech.status });
      }
    }
    if (bundle.exerciseSet) searchCore.push({ id: `exercises:${tech.slug}`, kind: 'exercises', title: `${tech.name} exercises`, subtitle: bundle.exerciseSet.description, url: `/exercises/${tech.slug}`, technology: tech.name, category, keywords: [tech.name, 'practice'], status: tech.status });
    if (bundle.quiz) searchCore.push({ id: `quiz:${tech.slug}`, kind: 'quiz', title: `${tech.name} quiz`, subtitle: bundle.quiz.description, url: `/quizzes/${tech.slug}`, technology: tech.name, category, keywords: [tech.name, 'quiz', 'test'], status: tech.status });
    if (bundle.reference) searchCore.push({ id: `reference:${tech.slug}`, kind: 'reference', title: `${tech.name} reference`, subtitle: bundle.reference.description, url: `/references/${tech.slug}`, technology: tech.name, category, keywords: [tech.name, 'reference', ...bundle.reference.groups.map((g) => g.title)], status: tech.status });
  }
  for (const path of paths) {
    searchCore.push({ id: `path:${path.slug}`, kind: 'path', title: `${path.title} learning path`, subtitle: path.tagline, url: `/learning-paths/${path.slug}`, keywords: path.stages.map((stage) => stage.title) });
  }

  // --- manifest & sitemap ---
  const generatedOn = new Date().toISOString().slice(0, 10);
  const manifest: PrerenderManifest = {
    generatedOn,
    categories: categories.map((c) => c.slug),
    technologies: technologies.map((t) => t.slug),
    indexableTechnologies: technologies.filter((t) => t.status !== 'planned').map((t) => t.slug),
    lessons: [...compiled.values()].flatMap((b) => b.lessons.map((l) => ({ tech: l.technologySlug, lesson: l.slug }))),
    references: [...compiled.values()].filter((b) => b.reference).map((b) => b.overview.slug),
    examples: [...compiled.values()].filter((b) => b.exampleSet).map((b) => b.overview.slug),
    exercises: [...compiled.values()].filter((b) => b.exerciseSet).map((b) => b.overview.slug),
    quizzes: [...compiled.values()].filter((b) => b.quiz).map((b) => b.overview.slug),
    learningPaths: paths.map((p) => p.slug),
  };
  const sitemapEntries: SitemapEntry[] = STATIC_INDEXABLE.map((path) => ({ path, lastmod: generatedOn, changefreq: 'weekly', priority: path === '/' ? 1 : 0.6 }));
  for (const category of categories) sitemapEntries.push({ path: `/tutorials/category/${category.slug}`, lastmod: generatedOn, changefreq: 'weekly', priority: 0.7 });
  for (const path of paths) sitemapEntries.push({ path: `/learning-paths/${path.slug}`, lastmod: generatedOn, changefreq: 'monthly', priority: 0.7 });
  for (const tech of technologies) {
    const bundle = compiled.get(tech.slug);
    if (!bundle || tech.status === 'planned') continue;
    sitemapEntries.push({ path: `/tutorials/${tech.slug}`, lastmod: tech.updatedOn ?? generatedOn, changefreq: 'weekly', priority: 0.9 });
    for (const lesson of bundle.lessons) sitemapEntries.push({ path: `/tutorials/${tech.slug}/${lesson.slug}`, lastmod: lesson.updatedOn, changefreq: 'monthly', priority: 0.8 });
    if (bundle.reference) sitemapEntries.push({ path: `/references/${tech.slug}`, lastmod: tech.updatedOn ?? generatedOn, changefreq: 'monthly', priority: 0.6 });
    if (bundle.exampleSet) sitemapEntries.push({ path: `/examples/${tech.slug}`, lastmod: tech.updatedOn ?? generatedOn, changefreq: 'monthly', priority: 0.6 });
    if (bundle.exerciseSet) sitemapEntries.push({ path: `/exercises/${tech.slug}`, lastmod: tech.updatedOn ?? generatedOn, changefreq: 'monthly', priority: 0.5 });
    if (bundle.quiz) sitemapEntries.push({ path: `/quizzes/${tech.slug}`, lastmod: tech.updatedOn ?? generatedOn, changefreq: 'monthly', priority: 0.5 });
  }
  const missing = unavailableHighlightLanguages();
  if (missing.length) warnings.push(`no syntax highlighting grammar for: ${missing.join(', ')} (rendered as plain text)`);

  return { categories, technologies, compiled, paths, home, manifest, searchCore, searchLessons, sitemap: buildSitemap(sitemapEntries), warnings };
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(resolve(path, '..'), { recursive: true });
  await writeFile(path, JSON.stringify(value), 'utf8');
}

export async function emit(result: CompileResult): Promise<void> {
  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });
  const out = (...parts: string[]) => resolve(OUTPUT_DIR, ...parts);
  await writeJson(out('catalog', 'categories.json'), result.categories);
  await writeJson(out('catalog', 'technologies.json'), result.technologies);
  const summaries: LearningPathSummary[] = result.paths.map(({ stages: _stages, seo: _seo, ...summary }) => summary);
  await writeJson(out('learning-paths', 'index.json'), summaries);
  for (const path of result.paths) await writeJson(out('learning-paths', `${path.slug}.json`), path);
  await writeJson(out('site', 'home.json'), result.home);
  for (const [slug, bundle] of result.compiled) {
    await writeJson(out('technologies', slug, 'overview.json'), bundle.overview);
    for (const lesson of bundle.lessons) await writeJson(out('technologies', slug, 'lessons', `${lesson.slug}.json`), lesson);
    if (bundle.exerciseSet) await writeJson(out('technologies', slug, 'exercises.json'), bundle.exerciseSet);
    if (bundle.quiz) await writeJson(out('technologies', slug, 'quiz.json'), bundle.quiz);
    if (bundle.reference) await writeJson(out('technologies', slug, 'reference.json'), bundle.reference);
    if (bundle.exampleSet) await writeJson(out('technologies', slug, 'examples.json'), bundle.exampleSet);
  }
  const core: SearchIndexFile = { version: 1, generatedOn: result.manifest.generatedOn, documents: result.searchCore };
  const lessons: SearchIndexFile = { version: 1, generatedOn: result.manifest.generatedOn, documents: result.searchLessons };
  await writeJson(out('search', 'core.json'), core);
  await writeJson(out('search', 'lessons.json'), lessons);
  await writeJson(out('manifest.json'), result.manifest);
  await mkdir(out('root'), { recursive: true });
  await writeFile(out('root', 'sitemap.xml'), result.sitemap, 'utf8');
}

/** JSON Schemas for editor autocompletion of authored files (mapped in .vscode/settings.json). */
export async function emitJsonSchemas(): Promise<void> {
  await mkdir(SCHEMA_DIR, { recursive: true });
  const schemas: Record<string, z.ZodType> = {
    'categories.schema.json': z.array(categorySchema),
    'technologies.schema.json': z.array(technologySourceSchema),
    'learning-path.schema.json': learningPathSourceSchema,
    'home.schema.json': homeConfigSchema,
    'overview.schema.json': technologyOverviewSourceSchema,
    'lesson.schema.json': lessonSourceSchema,
    'exercises.schema.json': exerciseSetSourceSchema,
    'quiz.schema.json': quizSourceSchema,
    'reference.schema.json': referenceSourceSchema,
    'examples.schema.json': exampleSetSourceSchema,
  };
  for (const [name, schema] of Object.entries(schemas)) {
    const json = z.toJSONSchema(schema, { target: 'draft-7', io: 'input' });
    await writeFile(resolve(SCHEMA_DIR, name), JSON.stringify(json, null, 2) + '\n', 'utf8');
  }
}
