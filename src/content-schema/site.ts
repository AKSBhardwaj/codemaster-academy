import { z } from 'zod';
import { slugSchema } from './common';

export const faqItemSchema = z.strictObject({
  question: z.string().min(10).max(140),
  answer: z.string().min(40).max(600),
});
export type FaqItem = z.infer<typeof faqItemSchema>;

export const valuePropositionSchema = z.strictObject({
  icon: z.string().min(1),
  title: z.string().min(3).max(60),
  text: z.string().min(40).max(240),
});
export type ValueProposition = z.infer<typeof valuePropositionSchema>;

/** Authored shape: src/assets/content/site/home.json */
export const homeConfigSchema = z.strictObject({
  popularLanguages: z.array(slugSchema).min(6).max(16),
  popularFrameworks: z.array(slugSchema).min(6).max(16),
  featuredPaths: z.array(slugSchema).min(3).max(12),
  whyUs: z.array(valuePropositionSchema).min(3).max(8),
  faq: z.array(faqItemSchema).min(4).max(12),
  playgroundPromo: z.strictObject({
    title: z.string().min(5).max(80),
    text: z.string().min(40).max(300),
    bullets: z.array(z.string().min(5).max(90)).min(2).max(5),
  }),
});
export type HomeConfig = z.infer<typeof homeConfigSchema>;
