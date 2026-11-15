import { z } from 'zod';
import { difficultySchema, slugSchema } from './common';

const idSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'kebab-case id');
const questionText = z.string().min(10).max(600);
const options = z.array(z.string().min(1).max(200)).min(2).max(6);

const base = {
  id: idSchema,
  lessonSlug: slugSchema,
  difficulty: difficultySchema,
  question: questionText,
  explanation: z.string().min(20).max(800),
};

export const multipleChoiceSchema = z
  .strictObject({ ...base, type: z.literal('multiple-choice'), options, correctIndex: z.number().int().nonnegative() })
  .refine((q) => q.correctIndex < q.options.length, { message: 'correctIndex out of range' });

export const trueFalseSchema = z.strictObject({ ...base, type: z.literal('true-false'), correct: z.boolean() });

export const fillBlankSchema = z
  .strictObject({
    ...base,
    type: z.literal('fill-blank'),
    answers: z.array(z.string().min(1).max(80)).min(1).max(6),
    caseSensitive: z.boolean().optional(),
  })
  .refine((q) => q.question.includes('___'), { message: 'fill-blank questions must contain ___' });

export const predictOutputSchema = z
  .strictObject({
    ...base,
    type: z.literal('predict-output'),
    language: z.string().min(1),
    code: z.string().min(1).max(4000),
    options,
    correctIndex: z.number().int().nonnegative(),
  })
  .refine((q) => q.correctIndex < q.options.length, { message: 'correctIndex out of range' });

export const findErrorSchema = z
  .strictObject({
    ...base,
    type: z.literal('find-error'),
    language: z.string().min(1),
    code: z.string().min(1).max(4000),
    options,
    correctIndex: z.number().int().nonnegative(),
    errorLine: z.number().int().positive().optional(),
  })
  .refine((q) => q.correctIndex < q.options.length, { message: 'correctIndex out of range' });

export const codingTaskSchema = z.strictObject({
  ...base,
  type: z.literal('coding-task'),
  language: z.string().min(1),
  starterCode: z.string().min(1).max(8000),
  solutionCode: z.string().min(1).max(8000),
  checklist: z.array(z.string().min(5).max(160)).min(2).max(8),
  /** Optional automatic check (only for languages the playground can execute). */
  check: z
    .discriminatedUnion('kind', [
      z.strictObject({ kind: z.literal('console-output'), expectedLines: z.array(z.string()).min(1) }),
      z.strictObject({
        kind: z.literal('sql-result'),
        expectedColumns: z.array(z.string()).min(1),
        expectedRows: z.array(z.array(z.union([z.string(), z.number(), z.null()]))).min(1),
      }),
    ])
    .optional(),
});

export const exerciseSchema = z.discriminatedUnion('type', [
  multipleChoiceSchema,
  trueFalseSchema,
  fillBlankSchema,
  predictOutputSchema,
  findErrorSchema,
  codingTaskSchema,
]);
export type Exercise = z.infer<typeof exerciseSchema>;
export type ExerciseType = Exercise['type'];

/** Quiz questions are every exercise type except coding tasks. */
export const quizQuestionSourceSchema = z.discriminatedUnion('type', [
  multipleChoiceSchema,
  trueFalseSchema,
  fillBlankSchema,
  predictOutputSchema,
  findErrorSchema,
]);
export type QuizQuestion = z.infer<typeof quizQuestionSourceSchema>;

/** Authored shape: technologies/<slug>/exercises.json */
export const exerciseSetSourceSchema = z.strictObject({
  title: z.string().min(5).max(80),
  description: z.string().min(40).max(300),
  exercises: z.array(exerciseSchema).min(1).max(200),
});
export type ExerciseSetSource = z.infer<typeof exerciseSetSourceSchema>;
export const exerciseSetSchema = exerciseSetSourceSchema.extend({ technologySlug: slugSchema, technologyName: z.string() });
export type ExerciseSet = z.infer<typeof exerciseSetSchema>;

/** Authored shape: technologies/<slug>/quiz.json */
export const quizSourceSchema = z.strictObject({
  id: idSchema,
  title: z.string().min(5).max(80),
  description: z.string().min(40).max(300),
  passPercent: z.number().int().min(50).max(100),
  questions: z.array(quizQuestionSourceSchema).min(5).max(60),
});
export type QuizSource = z.infer<typeof quizSourceSchema>;
export const quizSchema = quizSourceSchema.extend({ technologySlug: slugSchema, technologyName: z.string() });
export type Quiz = z.infer<typeof quizSchema>;
