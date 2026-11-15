import { z } from 'zod';
import { difficultySchema, seoMetaSchema, slugSchema } from './common';

/**
 * A stage either points at a technology tutorial (optionally with alternatives the learner may pick instead)
 * or is a topic stage with no tutorial of its own (`topicNote` explains what to do, honestly).
 */
export const pathStageSchema = z
  .strictObject({
    id: slugSchema,
    title: z.string().min(3).max(60),
    description: z.string().min(40).max(320),
    technologySlug: slugSchema.optional(),
    alternativeSlugs: z.array(slugSchema).max(3).optional(),
    lessonSlugs: z.array(slugSchema).optional(),
    topicNote: z.string().min(20).max(320).optional(),
    estimatedHours: z.number().positive().max(200),
  })
  .refine((stage) => stage.technologySlug !== undefined || stage.topicNote !== undefined, {
    message: 'a stage needs either a technologySlug or a topicNote',
  });
export type PathStage = z.infer<typeof pathStageSchema>;

/** Authored shape: src/assets/content/learning-paths/<slug>.json */
export const learningPathSourceSchema = z.strictObject({
  slug: slugSchema,
  title: z.string().min(3).max(50),
  tagline: z.string().min(10).max(120),
  description: z.string().min(80).max(420),
  icon: z.string().min(1),
  audience: z.string().min(10).max(160),
  level: difficultySchema,
  featured: z.boolean(),
  order: z.number().int().positive(),
  stages: z.array(pathStageSchema).min(3).max(12),
  seo: seoMetaSchema,
});
export type LearningPathSource = z.infer<typeof learningPathSourceSchema>;

export const learningPathSchema = learningPathSourceSchema.extend({
  estimatedHours: z.number().positive(),
  stageCount: z.number().int().positive(),
  technologySlugs: z.array(slugSchema),
});
export type LearningPath = z.infer<typeof learningPathSchema>;

export const learningPathSummarySchema = learningPathSchema.omit({ stages: true, seo: true });
export type LearningPathSummary = z.infer<typeof learningPathSummarySchema>;
