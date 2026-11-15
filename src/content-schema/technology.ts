import { z } from 'zod';
import { contentBlockSchema, contentBlockSourceSchema } from './blocks';
import { isoDateSchema, seoMetaSchema, slugSchema } from './common';
import { technologyCatalogEntrySchema } from './catalog';

export const lessonRefSchema = z.strictObject({
  technologySlug: slugSchema,
  slug: slugSchema,
  title: z.string().min(1),
});
export type LessonRef = z.infer<typeof lessonRefSchema>;

/** Authored shape: technologies/<slug>/lessons/<lesson>.json */
export const lessonSourceSchema = z.strictObject({
  schemaVersion: z.literal(1),
  slug: slugSchema,
  title: z.string().min(3).max(90),
  /** One or two sentences shown in lists and search results. */
  summary: z.string().min(40).max(200),
  introduction: z.string().min(60).max(600),
  learningObjectives: z.array(z.string().min(10).max(140)).min(2).max(6),
  blocks: z.array(contentBlockSourceSchema).min(3).max(80),
  exerciseIds: z.array(z.string()).max(10).optional(),
  relatedLessons: z.array(z.strictObject({ technologySlug: slugSchema, slug: slugSchema })).max(6),
  seo: seoMetaSchema,
  updatedOn: isoDateSchema,
});
export type LessonSource = z.infer<typeof lessonSourceSchema>;

export const tocEntrySchema = z.strictObject({
  id: slugSchema,
  text: z.string(),
  level: z.union([z.literal(2), z.literal(3)]),
});
export type TocEntry = z.infer<typeof tocEntrySchema>;

/** Compiled shape served at /assets/content/technologies/<slug>/lessons/<lesson>.json */
export const lessonSchema = lessonSourceSchema
  .omit({ blocks: true, relatedLessons: true })
  .extend({
    id: z.string(),
    technologySlug: slugSchema,
    technologyName: z.string(),
    order: z.number().int().positive(),
    categoryId: slugSchema,
    categoryTitle: z.string(),
    readingTimeMinutes: z.number().int().positive(),
    blocks: z.array(contentBlockSchema),
    toc: z.array(tocEntrySchema),
    relatedLessons: z.array(lessonRefSchema),
    previousLesson: lessonRefSchema.nullable(),
    nextLesson: lessonRefSchema.nullable(),
    hasExerciseSet: z.boolean(),
    hasQuiz: z.boolean(),
  });
export type Lesson = z.infer<typeof lessonSchema>;

export const lessonSummarySchema = z.strictObject({
  slug: slugSchema,
  title: z.string(),
  summary: z.string(),
  categoryId: slugSchema,
  order: z.number().int().positive(),
  readingTimeMinutes: z.number().int().positive(),
});
export type LessonSummary = z.infer<typeof lessonSummarySchema>;

export const sidebarCategorySchema = z.strictObject({
  id: slugSchema,
  title: z.string().min(2).max(60),
  lessonSlugs: z.array(slugSchema).min(1),
});
export type SidebarCategory = z.infer<typeof sidebarCategorySchema>;

/** Authored shape: technologies/<slug>/overview.json */
export const technologyOverviewSourceSchema = z.strictObject({
  slug: slugSchema,
  description: z.string().min(150).max(900),
  versionNote: z.string().min(10).max(200).optional(),
  whatYouWillLearn: z.array(z.string().min(10).max(140)).min(3).max(10),
  learningObjectives: z.array(z.string().min(10).max(160)).min(3).max(10),
  sidebarCategories: z.array(sidebarCategorySchema).min(1).max(10),
  seo: seoMetaSchema,
});
export type TechnologyOverviewSource = z.infer<typeof technologyOverviewSourceSchema>;

/** Compiled shape served at /assets/content/technologies/<slug>/overview.json */
export const technologySchema = technologyCatalogEntrySchema.extend({
  description: z.string(),
  versionNote: z.string().optional(),
  whatYouWillLearn: z.array(z.string()),
  learningObjectives: z.array(z.string()),
  sidebarCategories: z.array(sidebarCategorySchema),
  lessons: z.array(lessonSummarySchema),
  counts: z.strictObject({
    lessons: z.number().int().nonnegative(),
    exercises: z.number().int().nonnegative(),
    quizQuestions: z.number().int().nonnegative(),
    references: z.number().int().nonnegative(),
    examples: z.number().int().nonnegative(),
  }),
  seo: seoMetaSchema,
});
export type Technology = z.infer<typeof technologySchema>;

/** Authored shape: technologies/<slug>/reference.json */
export const referenceEntrySchema = z.strictObject({
  slug: slugSchema,
  name: z.string().min(1).max(60),
  summary: z.string().min(20).max(300),
  syntax: z.string().max(300).optional(),
  example: z.strictObject({ language: z.string().min(1), code: z.string().min(1).max(2000) }).optional(),
  notes: z.array(z.string().min(5).max(240)).max(6).optional(),
  lessonSlug: slugSchema.optional(),
});
export const referenceGroupSchema = z.strictObject({
  id: slugSchema,
  title: z.string().min(2).max(60),
  entries: z.array(referenceEntrySchema).min(1).max(120),
});
export const referenceSourceSchema = z.strictObject({
  title: z.string().min(5).max(80),
  description: z.string().min(40).max(300),
  groups: z.array(referenceGroupSchema).min(1).max(20),
});
export type ReferenceSource = z.infer<typeof referenceSourceSchema>;
export const referenceSchema = referenceSourceSchema.extend({ technologySlug: slugSchema, technologyName: z.string() });
export type Reference = z.infer<typeof referenceSchema>;
export type ReferenceEntry = z.infer<typeof referenceEntrySchema>;
export type ReferenceGroup = z.infer<typeof referenceGroupSchema>;

/** Authored shape: technologies/<slug>/examples.json */
export const exampleSourceSchema = z.strictObject({
  id: slugSchema,
  title: z.string().min(3).max(80),
  description: z.string().min(20).max(300),
  language: z.string().min(1),
  code: z.string().min(1).max(8000),
  output: z.string().max(4000).optional(),
  runnable: z.boolean(),
  tags: z.array(z.string().min(2).max(24)).max(6),
  lessonSlug: slugSchema.optional(),
});
export const exampleSetSourceSchema = z.strictObject({
  title: z.string().min(5).max(80),
  description: z.string().min(40).max(300),
  examples: z.array(exampleSourceSchema).min(1).max(100),
});
export type ExampleSetSource = z.infer<typeof exampleSetSourceSchema>;
export const exampleSchema = exampleSourceSchema.extend({ tokens: z.array(z.array(z.tuple([z.string(), z.string().optional()]))) });
export type Example = z.infer<typeof exampleSchema>;
export const exampleSetSchema = exampleSetSourceSchema.extend({
  technologySlug: slugSchema,
  technologyName: z.string(),
  examples: z.array(exampleSchema),
});
export type ExampleSet = z.infer<typeof exampleSetSchema>;
