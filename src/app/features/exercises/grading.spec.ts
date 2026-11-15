import type { QuizQuestion } from '../../core/models/content';
import { correctAnswerText, gradeAnswer, matchesConsoleOutput, matchesSqlResult, summarise } from './grading';

const base = { lessonSlug: 'intro', difficulty: 'beginner' as const, explanation: 'Because.' };

describe('grading', () => {
  it('grades choice questions by index', () => {
    const q: QuizQuestion = { ...base, id: 'q', type: 'multiple-choice', question: 'Pick', options: ['a', 'b'], correctIndex: 1 };
    expect(gradeAnswer(q, { kind: 'choice', index: 1 })).toBe(true);
    expect(gradeAnswer(q, { kind: 'choice', index: 0 })).toBe(false);
    expect(gradeAnswer(q, null)).toBe(false);
    expect(correctAnswerText(q)).toBe('b');
  });

  it('grades true/false', () => {
    const q: QuizQuestion = { ...base, id: 'q', type: 'true-false', question: 'Is it?', correct: false };
    expect(gradeAnswer(q, { kind: 'boolean', value: false })).toBe(true);
    expect(gradeAnswer(q, { kind: 'boolean', value: true })).toBe(false);
  });

  it('grades fill-in-the-blank with whitespace and case normalisation', () => {
    const q: QuizQuestion = { ...base, id: 'q', type: 'fill-blank', question: 'The ___ attribute', answers: ['_blank'] };
    expect(gradeAnswer(q, { kind: 'text', value: '  _BLANK ' })).toBe(true);
    const strict: QuizQuestion = { ...q, caseSensitive: true };
    expect(gradeAnswer(strict, { kind: 'text', value: '_BLANK' })).toBe(false);
  });

  it('matches console output and SQL results', () => {
    expect(matchesConsoleOutput([{ type: 'console', level: 'log', text: '3' }, { type: 'console', level: 'log', text: 'null' }], ['3', 'null'])).toBe(true);
    expect(matchesConsoleOutput([{ type: 'console', level: 'log', text: '3' }], ['3', 'null'])).toBe(false);
    const events = [{ type: 'result' as const, columns: ['Name', 'price'], rows: [['Notebook', 4.5]] }];
    expect(matchesSqlResult(events, ['name', 'price'], [['Notebook', '4.5']])).toBe(true);
    expect(matchesSqlResult(events, ['name'], [['Notebook']])).toBe(false);
  });

  it('summarises scores against the pass mark', () => {
    expect(summarise([true, true, false, true], 70)).toEqual({ total: 4, correct: 3, incorrect: 1, percent: 75, passed: true });
    expect(summarise([], 70).percent).toBe(0);
  });
});
