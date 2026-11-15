import { z } from 'zod';
import { slugSchema } from './common';

/** Written by the compiler; read by app.routes.server.ts to enumerate prerender parameters and by the sitemap generator. */
export const prerenderManifestSchema = z.strictObject({
  generatedOn: z.string(),
  categories: z.array(slugSchema),
  technologies: z.array(slugSchema),
  /** Only technologies whose overview page should be indexed (status !== planned). */
  indexableTechnologies: z.array(slugSchema),
  lessons: z.array(z.strictObject({ tech: slugSchema, lesson: slugSchema })),
  references: z.array(slugSchema),
  examples: z.array(slugSchema),
  exercises: z.array(slugSchema),
  quizzes: z.array(slugSchema),
  learningPaths: z.array(slugSchema),
});
export type PrerenderManifest = z.infer<typeof prerenderManifestSchema>;
