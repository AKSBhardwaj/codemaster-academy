import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ContentService } from '../../../core/services/content.service';
import { publicPath } from '../../../../content-schema/site-constants';
import type { ExecutionEngine, RunEvent, RunRequest } from './execution-engine';

const WORKER_URL = publicPath('/assets/sql.js/worker.sql-wasm.js');
const RUN_TIMEOUT_MS = 5000;

interface WorkerResult {
  id: number;
  ready?: boolean;
  results?: { columns: string[]; values: unknown[][] }[];
  error?: string;
}

/** Splits a script into statements for per-statement result reporting (handles quotes and comments). */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let quote: string | null = null;
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const next = sql[i + 1];
    if (!quote && char === '-' && next === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      continue;
    }
    if (!quote && char === '/' && next === '*') {
      const end = sql.indexOf('*/', i + 2);
      i = end === -1 ? sql.length : end + 1;
      continue;
    }
    if (quote) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      current += char;
      continue;
    }
    if (char === ';') {
      if (current.trim()) statements.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

/**
 * Runs SQL on SQLite compiled to WebAssembly (sql.js) inside a Web Worker. Every run starts from a fresh
 * in-memory database seeded with the sample schema, so learners can experiment freely.
 */
@Injectable({ providedIn: 'root' })
export class SqlJsEngine implements ExecutionEngine {
  readonly id = 'sqljs';
  readonly languages = ['sql'] as const;
  readonly capability = 'wasm' as const;
  /** SQL executed before the learner's statements; the playground sets it, lesson runners load it on demand. */
  setupSql = '';
  private readonly content = inject(ContentService);
  private setupLoad: Promise<string> | undefined;

  /** The sample schema from site/playground.json, so inline runners and coding tasks see the same tables as the playground. */
  private loadSetup(): Promise<string> {
    if (this.setupSql) return Promise.resolve(this.setupSql);
    this.setupLoad ??= this.content
      .load<{ sqlSetup?: string }>('site/playground.json')
      .then((config) => (this.setupSql = config.sqlSetup ?? ''))
      .catch(() => '');
    return this.setupLoad;
  }

  run(request: RunRequest): Observable<RunEvent> {
    return new Observable<RunEvent>((subscriber) => {
      const started = performance.now();
      let worker: Worker | undefined;
      let nextId = 1;
      const pending = new Map<
        number,
        { resolve: (r: WorkerResult) => void; reject: (e: Error) => void }
      >();
      const timer = setTimeout(() => {
        subscriber.next({
          type: 'error',
          message: 'The query did not finish within 5 seconds and was stopped.',
        });
        subscriber.complete();
      }, RUN_TIMEOUT_MS);

      const send = (message: Record<string, unknown>): Promise<WorkerResult> =>
        new Promise((resolve, reject) => {
          const id = nextId++;
          pending.set(id, { resolve, reject });
          worker?.postMessage({ id, ...message });
        });

      (async () => {
        try {
          worker = new Worker(WORKER_URL);
          worker.onmessage = (event: MessageEvent<WorkerResult>) => {
            const entry = pending.get(event.data.id);
            if (!entry) return;
            pending.delete(event.data.id);
            if (event.data.error) entry.reject(new Error(event.data.error));
            else entry.resolve(event.data);
          };
          worker.onerror = (event) => {
            subscriber.next({
              type: 'error',
              message: `SQLite engine failed to load: ${event.message || 'unknown error'}`,
            });
            subscriber.complete();
          };
          subscriber.next({ type: 'status', message: 'Starting SQLite (WebAssembly)' });
          await send({ action: 'open' });
          const setup = await this.loadSetup();
          if (setup) await send({ action: 'exec', sql: setup });
          const statements = splitSqlStatements(request.code);
          if (statements.length === 0)
            subscriber.next({ type: 'status', message: 'No SQL statements to run.' });
          for (const statement of statements) {
            try {
              const result = await send({ action: 'exec', sql: statement });
              const sets = result.results ?? [];
              if (sets.length === 0) {
                subscriber.next({
                  type: 'console',
                  level: 'info',
                  text: `OK: ${statement.split('\n')[0].slice(0, 80)}`,
                });
              }
              for (const set of sets)
                subscriber.next({
                  type: 'result',
                  columns: set.columns,
                  rows: set.values,
                  statement,
                });
            } catch (error) {
              subscriber.next({
                type: 'error',
                message: `${(error as Error).message} — in: ${statement.split('\n')[0].slice(0, 80)}`,
              });
              break;
            }
          }
          subscriber.next({ type: 'done', durationMs: Math.round(performance.now() - started) });
        } catch (error) {
          subscriber.next({ type: 'error', message: (error as Error).message });
        } finally {
          clearTimeout(timer);
          subscriber.complete();
        }
      })();

      return () => {
        clearTimeout(timer);
        worker?.terminate();
        pending.clear();
      };
    });
  }
}
