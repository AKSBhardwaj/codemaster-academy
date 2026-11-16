import type { Exercise, ExerciseType, QuizQuestion } from '../../core/models/content';
import type { RunEvent } from '../playground/engines/execution-engine';

export type Answer =
  | { kind: 'choice'; index: number }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'text'; value: string };

export const EXERCISE_TYPE_LABEL: Record<ExerciseType, string> = {
  'multiple-choice': 'Multiple choice',
  'true-false': 'True or false',
  'fill-blank': 'Fill in the blank',
  'predict-output': 'Predict the output',
  'find-error': 'Find the error',
  'coding-task': 'Coding task',
};

function normalise(value: string, caseSensitive: boolean | undefined): string {
  const collapsed = value.trim().replace(/\s+/g, ' ');
  return caseSensitive ? collapsed : collapsed.toLowerCase();
}

/** Grades a non-coding question. Pure: safe to unit test and to use in templates via computed(). */
export function gradeAnswer(question: QuizQuestion, answer: Answer | null): boolean {
  if (!answer) return false;
  switch (question.type) {
    case 'multiple-choice':
    case 'predict-output':
    case 'find-error':
      return answer.kind === 'choice' && answer.index === question.correctIndex;
    case 'true-false':
      return answer.kind === 'boolean' && answer.value === question.correct;
    case 'fill-blank':
      return (
        answer.kind === 'text' &&
        question.answers.some(
          (a) =>
            normalise(a, question.caseSensitive) ===
            normalise(answer.value, question.caseSensitive),
        )
      );
  }
}

/** Human-readable correct answer for the review screen. */
export function correctAnswerText(question: QuizQuestion): string {
  switch (question.type) {
    case 'multiple-choice':
    case 'predict-output':
    case 'find-error':
      return question.options[question.correctIndex];
    case 'true-false':
      return question.correct ? 'True' : 'False';
    case 'fill-blank':
      return question.answers.join(' / ');
  }
}

/** Human-readable learner answer for the review screen. */
export function givenAnswerText(question: QuizQuestion, answer: Answer | null): string {
  if (!answer) return 'No answer';
  if (answer.kind === 'choice') {
    return question.type === 'true-false'
      ? ''
      : ((question as { options: string[] }).options[answer.index] ?? '');
  }
  if (answer.kind === 'boolean') return answer.value ? 'True' : 'False';
  return answer.value.trim() || 'No answer';
}

export function isCodingTask(
  exercise: Exercise,
): exercise is Extract<Exercise, { type: 'coding-task' }> {
  return exercise.type === 'coding-task';
}

/** Compares console output (log/info lines) with the expected lines, ignoring surrounding whitespace. */
export function matchesConsoleOutput(
  events: readonly RunEvent[],
  expectedLines: readonly string[],
): boolean {
  const lines = events
    .filter(
      (e): e is Extract<RunEvent, { type: 'console' }> =>
        e.type === 'console' && (e.level === 'log' || e.level === 'info'),
    )
    .flatMap((e) => e.text.split('\n'))
    .map((line) => line.trim())
    .filter(Boolean);
  const expected = expectedLines.map((line) => line.trim()).filter(Boolean);
  return lines.length === expected.length && lines.every((line, i) => line === expected[i]);
}

/** Compares the last SQL result set with the expected columns and rows (string comparison, case-insensitive columns). */
export function matchesSqlResult(
  events: readonly RunEvent[],
  expectedColumns: readonly string[],
  expectedRows: readonly (readonly unknown[])[],
): boolean {
  const result = [...events]
    .reverse()
    .find((e): e is Extract<RunEvent, { type: 'result' }> => e.type === 'result');
  if (!result) return false;
  const columnsMatch =
    result.columns.length === expectedColumns.length &&
    result.columns.every((c, i) => c.toLowerCase() === expectedColumns[i].toLowerCase());
  if (!columnsMatch || result.rows.length !== expectedRows.length) return false;
  const cell = (value: unknown): string =>
    value === null || value === undefined ? 'NULL' : String(value);
  return result.rows.every(
    (row, r) =>
      row.length === expectedRows[r].length &&
      row.every((value, c) => cell(value) === cell(expectedRows[r][c])),
  );
}

/** Score summary for a set of graded answers. */
export interface ScoreSummary {
  total: number;
  correct: number;
  incorrect: number;
  percent: number;
  passed: boolean;
}

export function summarise(results: readonly boolean[], passPercent: number): ScoreSummary {
  const total = results.length;
  const correct = results.filter(Boolean).length;
  const percent = total ? Math.round((correct / total) * 100) : 0;
  return { total, correct, incorrect: total - correct, percent, passed: percent >= passPercent };
}
