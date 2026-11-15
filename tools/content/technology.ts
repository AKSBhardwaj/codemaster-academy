/**
 * Compiles one technology folder (overview, lessons, exercises, quiz, reference, examples)
 * into the enriched JSON the application serves. See compile.ts for the orchestration.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { z } from 'zod';
import {
  collectInlineLinks,
  exampleSetSourceSchema,
  exerciseSetSourceSchema,
  lessonSourceSchema,
  quizSourceSchema,
  referenceSourceSchema,
  stripInlineMarkup,
  technologyOverviewSourceSchema,
  type CodeBlock,
  type ContentBlock,
  type ContentBlockSource,
  type Example,
  type ExampleSet,
  type ExerciseSet,
  type Lesson,
  type LessonRef,
  type LessonSource,
  type LessonSummary,
  type Quiz,
  type Reference,
  type Technology,
  type TechnologyCatalogEntry,
  type TechnologySource,
  type TocEntry,
} from '../../src/content-schema/index';
import { tokenise } from './highlight';

export class ContentError extends Error {}

export interface CompiledTechnology {
  overview: Technology;
  lessons: Lesson[];
  exerciseSet?: ExerciseSet;
  quiz?: Quiz;
  reference?: Reference;
  exampleSet?: ExampleSet;
  /** Every internal link found in markup, with the file it came from, for the global link check. */
  links: { href: string; file: string }[];
  /** Related lessons referenced from lessons, validated globally once every technology is compiled. */
  relatedRefs: { from: string; technologySlug: string; slug: string }[];
}

const WORDS_PER_MINUTE = 200;
const CODE_LINES_PER_MINUTE = 40;

function rel(path: string, root: string): string {
  return path.replace(root, '').replace(/\\/g, '/').replace(/^\//, '');
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path: string, root: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as unknown;
  } catch (error) {
    throw new ContentError(`${rel(path, root)}: invalid JSON (${(error as Error).message})`);
  }
}

function parseWith<T>(schema: z.ZodType<T>, value: unknown, file: string, root: string): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const issues = result.error.issues.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`).join('\n');
  throw new ContentError(`${rel(file, root)}: schema validation failed\n${issues}`);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function textOf(block: ContentBlockSource): string[] {
  switch (block.type) {
    case 'heading':
      return [block.text];
    case 'paragraph':
      return [block.text];
    case 'list':
      return block.items;
    case 'alert':
    case 'callout':
      return [block.text, block.title ?? ''];
    case 'table':
      return [block.caption ?? '', ...block.rows.flat()];
    case 'code':
      return [block.caption ?? ''];
    case 'image':
      return [block.caption ?? ''];
    case 'quiz':
      return block.questions.flatMap((q) => [q.question, q.explanation]);
    default:
      return [];
  }
}

function readingTime(lesson: LessonSource): number {
  const words = [lesson.introduction, ...lesson.learningObjectives, ...lesson.blocks.flatMap(textOf)]
    .map(stripInlineMarkup)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  const codeLines = lesson.blocks.reduce(
    (sum, block) => sum + (block.type === 'code' || block.type === 'interactive' ? block.code.split('\n').length : 0),
    0,
  );
  return Math.max(2, Math.ceil(words / WORDS_PER_MINUTE + codeLines / CODE_LINES_PER_MINUTE));
}

async function compileBlocks(blocks: ContentBlockSource[], file: string, root: string): Promise<{ blocks: ContentBlock[]; toc: TocEntry[] }> {
  const usedIds = new Set<string>();
  const toc: TocEntry[] = [];
  const compiled: ContentBlock[] = [];
  for (const block of blocks) {
    if (block.type === 'heading') {
      let id = block.id ?? slugify(block.text);
      if (!id) throw new ContentError(`${rel(file, root)}: heading "${block.text}" produces an empty id`);
      let counter = 2;
      const base = id;
      while (usedIds.has(id)) id = `${base}-${counter++}`;
      usedIds.add(id);
      if (block.level !== 4) toc.push({ id, text: block.text, level: block.level });
      compiled.push({ ...block, id });
    } else if (block.type === 'code') {
      const tokens = await tokenise(block.code, block.language);
      const codeBlock: CodeBlock = { ...block, tokens };
      compiled.push(codeBlock);
    } else {
      compiled.push(block);
    }
  }
  return { blocks: compiled, toc };
}

function linksIn(texts: string[], file: string, root: string): { href: string; file: string }[] {
  return texts.flatMap((text) => collectInlineLinks(text).map((href) => ({ href, file: rel(file, root) })));
}

export async function compileTechnologyFolder(
  source: TechnologySource,
  catalogEntry: Omit<TechnologyCatalogEntry, 'status' | 'totalLessons' | 'estimatedMinutes' | 'hasExercises' | 'hasQuiz' | 'hasReference' | 'hasExamples'>,
  contentDir: string,
  root: string,
): Promise<CompiledTechnology | null> {
  const dir = resolve(contentDir, 'technologies', source.slug);
  const overviewFile = resolve(dir, 'overview.json');
  if (!(await exists(overviewFile))) return null;

  const overview = parseWith(technologyOverviewSourceSchema, await readJson(overviewFile, root), overviewFile, root);
  if (overview.slug !== source.slug) throw new ContentError(`${rel(overviewFile, root)}: slug must be "${source.slug}"`);

  // --- lessons ---
  const lessonsDir = resolve(dir, 'lessons');
  const lessonFiles = (await exists(lessonsDir))
    ? (await readdir(lessonsDir)).filter((name) => name.endsWith('.json')).map((name) => resolve(lessonsDir, name))
    : [];
  const sources = new Map<string, { source: LessonSource; file: string }>();
  for (const file of lessonFiles) {
    const lesson = parseWith(lessonSourceSchema, await readJson(file, root), file, root);
    if (lesson.slug !== basename(file, '.json')) throw new ContentError(`${rel(file, root)}: slug "${lesson.slug}" must match the file name`);
    sources.set(lesson.slug, { source: lesson, file });
  }
  const orderedSlugs: { slug: string; categoryId: string; categoryTitle: string }[] = [];
  const seenInSidebar = new Set<string>();
  for (const category of overview.sidebarCategories) {
    for (const slug of category.lessonSlugs) {
      if (seenInSidebar.has(slug)) throw new ContentError(`${rel(overviewFile, root)}: lesson "${slug}" listed twice in sidebarCategories`);
      seenInSidebar.add(slug);
      if (!sources.has(slug)) throw new ContentError(`${rel(overviewFile, root)}: sidebar lists lesson "${slug}" but lessons/${slug}.json does not exist`);
      orderedSlugs.push({ slug, categoryId: category.id, categoryTitle: category.title });
    }
  }
  for (const slug of sources.keys()) {
    if (!seenInSidebar.has(slug)) throw new ContentError(`${rel(overviewFile, root)}: lessons/${slug}.json exists but is not listed in sidebarCategories`);
  }

  // --- exercises, quiz, reference, examples ---
  const links: { href: string; file: string }[] = [];
  let exerciseSet: ExerciseSet | undefined;
  const exercisesFile = resolve(dir, 'exercises.json');
  if (await exists(exercisesFile)) {
    const parsed = parseWith(exerciseSetSourceSchema, await readJson(exercisesFile, root), exercisesFile, root);
    const ids = new Set<string>();
    for (const exercise of parsed.exercises) {
      if (ids.has(exercise.id)) throw new ContentError(`${rel(exercisesFile, root)}: duplicate exercise id "${exercise.id}"`);
      ids.add(exercise.id);
      if (!sources.has(exercise.lessonSlug)) throw new ContentError(`${rel(exercisesFile, root)}: exercise "${exercise.id}" references unknown lesson "${exercise.lessonSlug}"`);
      links.push(...linksIn([exercise.question, exercise.explanation], exercisesFile, root));
    }
    exerciseSet = { ...parsed, technologySlug: source.slug, technologyName: source.name };
  }
  let quiz: Quiz | undefined;
  const quizFile = resolve(dir, 'quiz.json');
  if (await exists(quizFile)) {
    const parsed = parseWith(quizSourceSchema, await readJson(quizFile, root), quizFile, root);
    const ids = new Set<string>();
    for (const question of parsed.questions) {
      if (ids.has(question.id)) throw new ContentError(`${rel(quizFile, root)}: duplicate question id "${question.id}"`);
      ids.add(question.id);
      if (!sources.has(question.lessonSlug)) throw new ContentError(`${rel(quizFile, root)}: question "${question.id}" references unknown lesson "${question.lessonSlug}"`);
    }
    quiz = { ...parsed, technologySlug: source.slug, technologyName: source.name };
  }
  let reference: Reference | undefined;
  const referenceFile = resolve(dir, 'reference.json');
  if (await exists(referenceFile)) {
    const parsed = parseWith(referenceSourceSchema, await readJson(referenceFile, root), referenceFile, root);
    const slugs = new Set<string>();
    for (const group of parsed.groups) {
      for (const entry of group.entries) {
        if (slugs.has(entry.slug)) throw new ContentError(`${rel(referenceFile, root)}: duplicate reference slug "${entry.slug}"`);
        slugs.add(entry.slug);
        if (entry.lessonSlug && !sources.has(entry.lessonSlug)) throw new ContentError(`${rel(referenceFile, root)}: "${entry.slug}" references unknown lesson "${entry.lessonSlug}"`);
      }
    }
    reference = { ...parsed, technologySlug: source.slug, technologyName: source.name };
  }
  let exampleSet: ExampleSet | undefined;
  const examplesFile = resolve(dir, 'examples.json');
  if (await exists(examplesFile)) {
    const parsed = parseWith(exampleSetSourceSchema, await readJson(examplesFile, root), examplesFile, root);
    const ids = new Set<string>();
    const examples: Example[] = [];
    for (const example of parsed.examples) {
      if (ids.has(example.id)) throw new ContentError(`${rel(examplesFile, root)}: duplicate example id "${example.id}"`);
      ids.add(example.id);
      if (example.lessonSlug && !sources.has(example.lessonSlug)) throw new ContentError(`${rel(examplesFile, root)}: "${example.id}" references unknown lesson "${example.lessonSlug}"`);
      examples.push({ ...example, tokens: await tokenise(example.code, example.language) });
    }
    exampleSet = { ...parsed, technologySlug: source.slug, technologyName: source.name, examples };
  }

  // --- compile lessons in sidebar order ---
  const exerciseIds = new Set(exerciseSet?.exercises.map((e) => e.id) ?? []);
  const summaries: LessonSummary[] = [];
  const lessons: Lesson[] = [];
  const relatedRefs: CompiledTechnology['relatedRefs'] = [];
  const refOf = (index: number): LessonRef | null => {
    const entry = orderedSlugs[index];
    if (!entry) return null;
    const { source: lesson } = sources.get(entry.slug)!;
    return { technologySlug: source.slug, slug: lesson.slug, title: lesson.title };
  };
  for (let index = 0; index < orderedSlugs.length; index++) {
    const { slug, categoryId, categoryTitle } = orderedSlugs[index];
    const { source: lesson, file } = sources.get(slug)!;
    for (const id of lesson.exerciseIds ?? []) {
      if (!exerciseIds.has(id)) throw new ContentError(`${rel(file, root)}: exerciseIds references unknown exercise "${id}"`);
    }
    for (const block of lesson.blocks) {
      if (block.type === 'exercise' && !exerciseIds.has(block.exerciseId)) {
        throw new ContentError(`${rel(file, root)}: exercise block references unknown exercise "${block.exerciseId}"`);
      }
      if (block.type === 'code' && block.runnable && !['html', 'css', 'javascript', 'js', 'sql'].includes(block.language.toLowerCase())) {
        throw new ContentError(`${rel(file, root)}: runnable code blocks must be html, css, javascript or sql (got "${block.language}")`);
      }
    }
    links.push(...linksIn([lesson.introduction, ...lesson.blocks.flatMap(textOf)], file, root));
    for (const related of lesson.relatedLessons) relatedRefs.push({ from: rel(file, root), ...related });
    const { blocks, toc } = await compileBlocks(lesson.blocks, file, root);
    const minutes = readingTime(lesson);
    const compiled: Lesson = {
      ...lesson,
      id: `${source.slug}-${lesson.slug}`,
      technologySlug: source.slug,
      technologyName: source.name,
      order: index + 1,
      categoryId,
      categoryTitle,
      readingTimeMinutes: minutes,
      blocks,
      toc,
      relatedLessons: [], // resolved globally (titles come from the other technology's lessons)
      previousLesson: refOf(index - 1),
      nextLesson: refOf(index + 1),
      hasExerciseSet: !!exerciseSet,
      hasQuiz: !!quiz,
    };
    lessons.push(compiled);
    summaries.push({ slug, title: lesson.title, summary: lesson.summary, categoryId, order: index + 1, readingTimeMinutes: minutes });
  }

  const totalLessons = lessons.length;
  const exerciseCount = exerciseSet?.exercises.length ?? 0;
  const quizQuestions = quiz?.questions.length ?? 0;
  const referenceCount = reference?.groups.reduce((sum, g) => sum + g.entries.length, 0) ?? 0;
  const exampleCount = exampleSet?.examples.length ?? 0;
  const status: Technology['status'] =
    totalLessons >= 12 && exerciseCount >= 10 && quizQuestions >= 10 && referenceCount > 0 && exampleCount > 0
      ? 'complete'
      : totalLessons > 0
        ? 'in-progress'
        : 'planned';
  const updatedOn = lessons.map((l) => l.updatedOn).sort().at(-1);

  const technology: Technology = {
    ...catalogEntry,
    status,
    totalLessons,
    estimatedMinutes: lessons.reduce((sum, l) => sum + l.readingTimeMinutes, 0),
    hasExercises: exerciseCount > 0,
    hasQuiz: quizQuestions > 0,
    hasReference: referenceCount > 0,
    hasExamples: exampleCount > 0,
    updatedOn,
    description: overview.description,
    versionNote: overview.versionNote,
    whatYouWillLearn: overview.whatYouWillLearn,
    learningObjectives: overview.learningObjectives,
    sidebarCategories: overview.sidebarCategories,
    lessons: summaries,
    counts: { lessons: totalLessons, exercises: exerciseCount, quizQuestions, references: referenceCount, examples: exampleCount },
    seo: overview.seo,
  };
  return { overview: technology, lessons, exerciseSet, quiz, reference, exampleSet, links, relatedRefs };
}
