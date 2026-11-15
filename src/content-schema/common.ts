import { z } from 'zod';

/** kebab-case identifier safe for URLs and prerender route parameters. */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a kebab-case slug (a-z, 0-9, hyphens)');

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date (YYYY-MM-DD)');

export const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type Difficulty = z.infer<typeof difficultySchema>;

export const technologyStatusSchema = z.enum(['complete', 'in-progress', 'planned']);
export type TechnologyStatus = z.infer<typeof technologyStatusSchema>;

/** `logo` points at /assets/icons/tech/<src>.svg, `glyph` names a Bootstrap icon from the UI icon set. */
export const iconRefSchema = z.strictObject({
  kind: z.enum(['logo', 'glyph']),
  src: z.string().min(1),
});
export type IconRef = z.infer<typeof iconRefSchema>;

export const seoMetaSchema = z.strictObject({
  title: z.string().min(10).max(70),
  description: z.string().min(50).max(170),
  keywords: z.array(z.string().min(2)).max(12).optional(),
  image: z.string().optional(),
});
export type SeoMeta = z.infer<typeof seoMetaSchema>;
