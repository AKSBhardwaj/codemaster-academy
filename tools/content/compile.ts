/**
 * Content compiler: validates authored JSON under src/assets/content and emits the
 * compiled, enriched files the application loads from /assets/content/*.
 *
 * Phase 3 scope: catalog (categories + technologies), learning paths, home config,
 * search core index, prerender manifest and JSON schemas for editor support.
 * Phase 4 adds technology overviews, lessons, exercises, quizzes, references, examples.
 */
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { z } from 'zod';
import {
  categorySchema,
  homeConfigSchema,
  learningPathSourceSchema,
  technologySourceSchema,
  type Category,
  type HomeConfig,
  type LearningPath,
  type LearningPathSummary,
  type PrerenderManifest,
  type SearchDocument,
  type SearchIndexFile,
  type TechnologyCatalogEntry,
  type TechnologySource,
} from '../../src/content-schema/index';

export const ROOT = resolve(import.meta.dirname, '..', '..');
export const SOURCE_DIR = resolve(ROOT, 'src', 'assets', 'content');
export const OUTPUT_DIR = resolve(ROOT, '.generated', 'content');
const TECH_ICON_DIR = resolve(ROOT, 'src', 'assets', 'icons', 'tech');
const UI_ICON_LIST = resolve(ROOT, 'tools', 'icons', 'ui-icons.json');
const SCHEMA_DIR = resolve(SOURCE_DIR, 'schemas');

export class ContentError extends Error {}

interface CompileResult {
  categories: Category[];
  technologies: TechnologyCatalogEntry[];
  paths: LearningPath[];
  home: HomeConfig;
  manifest: PrerenderManifest;
  searchDocuments: SearchDocument[];
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as unknown;
  } catch (error) {
    throw new ContentError(`${rel(path)}: invalid JSON (${(error as Error).message})`);
  }
}

function rel(path: string): string {
  return path.replace(ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
}

function parseWith<T>(schema: z.ZodType<T>, value: unknown, file: string): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const issues = result.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
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
      if (!categorySlugs.has(item.categorySlug)) {
        throw new ContentError(`${rel(file)}: "${item.slug}" references unknown category "${item.categorySlug}"`);
      }
      if (item.categorySlug !== basename(file, '.json')) {
        throw new ContentError(`${rel(file)}: "${item.slug}" has categorySlug "${item.categorySlug}" but lives in ${basename(file)}`);
      }
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

async function validateIcons(technologies: TechnologySource[], categories: Category[]): Promise<void> {
  const uiIcons = new Set(JSON.parse(await readFile(UI_ICON_LIST, 'utf8')) as string[]);
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

/** Phase 4 fills this from technologies/<slug>/overview.json; until then every technology is planned. */
async function compileTechnology(source: TechnologySource): Promise<TechnologyCatalogEntry> {
  const overviewFile = resolve(SOURCE_DIR, 'technologies', source.slug, 'overview.json');
  const hasOverview = await exists(overviewFile);
  const totalLessons = 0;
  const status: TechnologyCatalogEntry['status'] = totalLessons === 0 ? 'planned' : totalLessons >= 12 ? 'complete' : 'in-progress';
  void hasOverview;
  return {
    ...source,
    id: source.slug,
    status,
    totalLessons,
    estimatedMinutes: 0,
    hasExercises: false,
    hasQuiz: false,
    hasReference: false,
    hasExamples: false,
  };
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

async function loadHome(technologies: TechnologyCatalogEntry[], paths: LearningPath[]): Promise<HomeConfig> {
  const file = resolve(SOURCE_DIR, 'site', 'home.json');
  const home = parseWith(homeConfigSchema, await readJson(file), file);
  const techSlugs = new Set(technologies.map((t) => t.slug));
  const pathSlugs = new Set(paths.map((p) => p.slug));
  const uiIcons = new Set(JSON.parse(await readFile(UI_ICON_LIST, 'utf8')) as string[]);
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

function buildSearchDocuments(categories: Category[], technologies: TechnologyCatalogEntry[], paths: LearningPath[]): SearchDocument[] {
  const categoryName = new Map(categories.map((c) => [c.slug, c.name]));
  const docs: SearchDocument[] = [];
  for (const category of categories) {
    docs.push({
      id: `category:${category.slug}`,
      kind: 'category',
      title: category.name,
      subtitle: category.description,
      url: `/tutorials/category/${category.slug}`,
      keywords: [category.shortName],
    });
  }
  for (const tech of technologies) {
    docs.push({
      id: `technology:${tech.slug}`,
      kind: 'technology',
      title: tech.name,
      subtitle: tech.shortDescription,
      url: `/tutorials/${tech.slug}`,
      technology: tech.name,
      category: categoryName.get(tech.categorySlug),
      keywords: [...tech.tags, ...tech.highlights],
      status: tech.status,
    });
  }
  for (const path of paths) {
    docs.push({
      id: `path:${path.slug}`,
      kind: 'path',
      title: `${path.title} learning path`,
      subtitle: path.tagline,
      url: `/learning-paths/${path.slug}`,
      keywords: path.stages.map((stage) => stage.title),
    });
  }
  return docs;
}

export async function compile(): Promise<CompileResult> {
  if (!(await exists(SOURCE_DIR))) throw new ContentError(`content source directory not found: ${SOURCE_DIR}`);
  const categories = await loadCategories();
  const sources = await loadTechnologySources(categories);
  await validateIcons(sources, categories);
  const technologies = await Promise.all(sources.map(compileTechnology));
  technologies.sort((a, b) => a.name.localeCompare(b.name));
  const paths = await loadLearningPaths(technologies);
  const home = await loadHome(technologies, paths);
  const generatedOn = new Date().toISOString().slice(0, 10);
  const manifest: PrerenderManifest = {
    generatedOn,
    categories: categories.map((c) => c.slug),
    technologies: technologies.map((t) => t.slug),
    indexableTechnologies: technologies.filter((t) => t.status !== 'planned').map((t) => t.slug),
    lessons: [],
    references: [],
    examples: [],
    exercises: [],
    quizzes: [],
    learningPaths: paths.map((p) => p.slug),
  };
  return { categories, technologies, paths, home, manifest, searchDocuments: buildSearchDocuments(categories, technologies, paths) };
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
  const index: SearchIndexFile = { version: 1, generatedOn: result.manifest.generatedOn, documents: result.searchDocuments };
  await writeJson(out('search', 'core.json'), index);
  await writeJson(out('manifest.json'), result.manifest);
}

/** JSON Schemas for editor autocompletion of authored files (mapped in .vscode/settings.json). */
export async function emitJsonSchemas(): Promise<void> {
  await mkdir(SCHEMA_DIR, { recursive: true });
  const schemas: Record<string, z.ZodType> = {
    'categories.schema.json': z.array(categorySchema),
    'technologies.schema.json': z.array(technologySourceSchema),
    'learning-path.schema.json': learningPathSourceSchema,
    'home.schema.json': homeConfigSchema,
  };
  for (const [name, schema] of Object.entries(schemas)) {
    const json = z.toJSONSchema(schema, { target: 'draft-7', io: 'input' });
    await writeFile(resolve(SCHEMA_DIR, name), JSON.stringify(json, null, 2) + '\n', 'utf8');
  }
}
