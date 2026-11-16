import { z } from 'zod';
import {
  difficultySchema,
  iconRefSchema,
  isoDateSchema,
  slugSchema,
  technologyStatusSchema,
} from './common';

export const categorySchema = z.strictObject({
  slug: slugSchema,
  name: z.string().min(3).max(40),
  shortName: z.string().min(2).max(20),
  description: z.string().min(60).max(220),
  icon: z.string().min(1),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i, 'hex colour'),
  order: z.number().int().positive(),
});
export type Category = z.infer<typeof categorySchema>;

/** Authored shape: src/assets/content/catalog/technologies/<category>.json */
export const technologySourceSchema = z.strictObject({
  slug: slugSchema,
  name: z.string().min(1).max(40),
  categorySlug: slugSchema,
  difficulty: difficultySchema,
  featured: z.boolean(),
  popular: z.boolean(),
  icon: iconRefSchema,
  tags: z.array(z.string().min(2).max(24)).min(1).max(6),
  prerequisites: z.array(slugSchema).max(5),
  shortDescription: z.string().min(80).max(280),
  highlights: z.array(z.string().min(8).max(90)).length(3),
});
export type TechnologySource = z.infer<typeof technologySourceSchema>;

/** Compiled shape served at /assets/content/catalog/technologies.json (status and counts are derived, never authored). */
export const technologyCatalogEntrySchema = technologySourceSchema.extend({
  id: z.string().min(1),
  status: technologyStatusSchema,
  totalLessons: z.number().int().nonnegative(),
  estimatedMinutes: z.number().int().nonnegative(),
  hasExercises: z.boolean(),
  hasQuiz: z.boolean(),
  hasReference: z.boolean(),
  hasExamples: z.boolean(),
  updatedOn: isoDateSchema.optional(),
});
export type TechnologyCatalogEntry = z.infer<typeof technologyCatalogEntrySchema>;

export const catalogSchema = z.strictObject({
  categories: z.array(categorySchema),
  technologies: z.array(technologyCatalogEntrySchema),
});
export type Catalog = z.infer<typeof catalogSchema>;
