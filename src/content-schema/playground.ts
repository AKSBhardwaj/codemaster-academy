import { z } from 'zod';
import { slugSchema } from './common';

export const runCapabilitySchema = z.enum(['browser', 'wasm', 'server', 'unavailable']);
export type RunCapability = z.infer<typeof runCapabilitySchema>;

export const playgroundTemplateSchema = z.strictObject({
  id: slugSchema,
  title: z.string().min(3).max(60),
  description: z.string().min(10).max(160),
  code: z.string().min(1).max(20000),
});
export type PlaygroundTemplate = z.infer<typeof playgroundTemplateSchema>;

export const playgroundLanguageSchema = z.strictObject({
  id: slugSchema,
  label: z.string().min(1).max(30),
  /** Language id used by the editor and the highlighter. */
  editorLanguage: z.string().min(1),
  capability: runCapabilitySchema,
  /** Honest explanation shown when capability is not browser/wasm. */
  note: z.string().min(10).max(300).optional(),
  templates: z.array(playgroundTemplateSchema).min(1).max(12),
});
export type PlaygroundLanguage = z.infer<typeof playgroundLanguageSchema>;

/** Authored shape: src/assets/content/site/playground.json */
export const playgroundConfigSchema = z.strictObject({
  languages: z.array(playgroundLanguageSchema).min(1).max(30),
  /** SQL executed before every SQL run to create the sample database. */
  sqlSetup: z.string().min(1).max(20000),
  sqlSchemaSummary: z.array(z.strictObject({ table: z.string(), columns: z.array(z.string()).min(1) })).min(1),
});
export type PlaygroundConfig = z.infer<typeof playgroundConfigSchema>;
