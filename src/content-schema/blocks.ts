import { z } from 'zod';
import { slugSchema } from './common';
import { quizQuestionSourceSchema } from './exercise';

/** Text that may contain inline markup (**bold**, *italic*, `code`, [text](href)). */
export const richTextSchema = z.string().min(1).max(2000);

/** One highlighted token: [text, cssClass?]. Produced by the compiler, never authored. */
export const codeTokenSchema = z.tuple([z.string(), z.string().optional()]);
export type CodeToken = z.infer<typeof codeTokenSchema>;

export const headingBlockSchema = z.strictObject({
  type: z.literal('heading'),
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  text: z.string().min(2).max(120),
  id: slugSchema.optional(),
});

export const paragraphBlockSchema = z.strictObject({
  type: z.literal('paragraph'),
  text: richTextSchema,
});

export const listBlockSchema = z.strictObject({
  type: z.literal('list'),
  ordered: z.boolean(),
  items: z.array(richTextSchema).min(1).max(30),
});

export const codeBlockSourceSchema = z.strictObject({
  type: z.literal('code'),
  language: z.string().min(1).max(30),
  code: z.string().min(1).max(20000),
  title: z.string().max(80).optional(),
  caption: richTextSchema.optional(),
  highlightLines: z.array(z.number().int().positive()).max(50).optional(),
  showLineNumbers: z.boolean().optional(),
  /** Marks the example as runnable in the playground (html/css/js or sql only). */
  runnable: z.boolean().optional(),
});
export const codeBlockSchema = codeBlockSourceSchema.extend({
  tokens: z.array(z.array(codeTokenSchema)),
});

/** Equivalent examples in several languages, with one example selected at a time. */
export const codeTabsBlockSourceSchema = z
  .strictObject({
    type: z.literal('code-tabs'),
    title: z.string().max(80).optional(),
    defaultLanguage: codeBlockSourceSchema.shape.language.optional(),
    variants: z.array(codeBlockSourceSchema).min(2).max(8),
  })
  .superRefine((block, context) => {
    const languages = new Set<string>();
    block.variants.forEach((variant, index) => {
      if (languages.has(variant.language)) {
        context.addIssue({
          code: 'custom',
          path: ['variants', index, 'language'],
          message: 'each code tab must use a different language',
        });
      }
      languages.add(variant.language);
    });
    if (block.defaultLanguage && !languages.has(block.defaultLanguage)) {
      context.addIssue({
        code: 'custom',
        path: ['defaultLanguage'],
        message: 'defaultLanguage must match one of the variants',
      });
    }
  });
export const codeTabsBlockSchema = codeTabsBlockSourceSchema.safeExtend({
  variants: z.array(codeBlockSchema).min(2).max(8),
});

export const outputBlockSchema = z.strictObject({
  type: z.literal('output'),
  content: z.string().min(1).max(10000),
  /** text = console/terminal style; html = rendered inside a sandboxed frame. */
  kind: z.enum(['text', 'html']).optional(),
  title: z.string().max(80).optional(),
});

export const alertBlockSchema = z.strictObject({
  type: z.literal('alert'),
  variant: z.enum(['info', 'warning', 'success', 'danger']),
  title: z.string().max(80).optional(),
  text: richTextSchema,
});

export const tableBlockSchema = z
  .strictObject({
    type: z.literal('table'),
    caption: z.string().max(120).optional(),
    headers: z.array(z.string().min(1).max(60)).min(2).max(6),
    rows: z.array(z.array(richTextSchema)).min(1).max(60),
  })
  .refine((table) => table.rows.every((row) => row.length === table.headers.length), {
    message: 'every row must have exactly one cell per header',
  });

export const imageBlockSchema = z.strictObject({
  type: z.literal('image'),
  src: z.string().min(1),
  alt: z.string().min(3).max(200),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  caption: richTextSchema.optional(),
});

export const videoBlockSchema = z.strictObject({
  type: z.literal('video'),
  provider: z.literal('youtube'),
  videoId: z.string().regex(/^[A-Za-z0-9_-]{6,20}$/),
  title: z.string().min(3).max(120),
});

export const calloutBlockSchema = z.strictObject({
  type: z.literal('callout'),
  icon: z.string().optional(),
  title: z.string().min(2).max(80),
  text: richTextSchema,
});

export const interactiveBlockSchema = z.strictObject({
  type: z.literal('interactive'),
  language: z.enum(['html', 'sql']),
  code: z.string().min(1).max(20000),
  title: z.string().max(80).optional(),
  /** Height of the result panel in pixels. */
  height: z.number().int().min(80).max(800).optional(),
});

export const quizBlockSchema = z.strictObject({
  type: z.literal('quiz'),
  title: z.string().max(80).optional(),
  questions: z.array(quizQuestionSourceSchema).min(1).max(5),
});

export const exerciseBlockSchema = z.strictObject({
  type: z.literal('exercise'),
  exerciseId: z.string().min(1),
});

export const contentBlockSourceSchema = z.discriminatedUnion('type', [
  headingBlockSchema,
  paragraphBlockSchema,
  listBlockSchema,
  codeBlockSourceSchema,
  codeTabsBlockSourceSchema,
  outputBlockSchema,
  alertBlockSchema,
  tableBlockSchema,
  imageBlockSchema,
  videoBlockSchema,
  calloutBlockSchema,
  interactiveBlockSchema,
  quizBlockSchema,
  exerciseBlockSchema,
]);
export type ContentBlockSource = z.infer<typeof contentBlockSourceSchema>;

export const contentBlockSchema = z.discriminatedUnion('type', [
  headingBlockSchema,
  paragraphBlockSchema,
  listBlockSchema,
  codeBlockSchema,
  codeTabsBlockSchema,
  outputBlockSchema,
  alertBlockSchema,
  tableBlockSchema,
  imageBlockSchema,
  videoBlockSchema,
  calloutBlockSchema,
  interactiveBlockSchema,
  quizBlockSchema,
  exerciseBlockSchema,
]);
export type ContentBlock = z.infer<typeof contentBlockSchema>;
export type HeadingBlock = z.infer<typeof headingBlockSchema>;
export type ParagraphBlock = z.infer<typeof paragraphBlockSchema>;
export type ListBlock = z.infer<typeof listBlockSchema>;
export type CodeBlock = z.infer<typeof codeBlockSchema>;
export type CodeTabsBlock = z.infer<typeof codeTabsBlockSchema>;
export type OutputBlock = z.infer<typeof outputBlockSchema>;
export type AlertBlock = z.infer<typeof alertBlockSchema>;
export type TableBlock = z.infer<typeof tableBlockSchema>;
export type ImageBlock = z.infer<typeof imageBlockSchema>;
export type VideoBlock = z.infer<typeof videoBlockSchema>;
export type CalloutBlock = z.infer<typeof calloutBlockSchema>;
export type InteractiveBlock = z.infer<typeof interactiveBlockSchema>;
export type QuizBlock = z.infer<typeof quizBlockSchema>;
export type ExerciseBlock = z.infer<typeof exerciseBlockSchema>;
