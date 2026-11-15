import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { RunCapability } from '../../../../content-schema/playground';

export type { RunCapability };

export interface RunRequest {
  language: string;
  code: string;
  /** Element the engine may mount visual output into (the HTML sandbox frame). */
  host?: HTMLElement;
}

export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error';

export type RunEvent =
  | { type: 'status'; message: string }
  | { type: 'console'; level: ConsoleLevel; text: string }
  | { type: 'error'; message: string }
  | { type: 'result'; columns: string[]; rows: unknown[][]; statement?: string }
  | { type: 'done'; durationMs: number };

/**
 * A code execution backend. Each engine declares the languages it handles and how it runs them.
 * Future server-side execution is another implementation registered under EXECUTION_ENGINES.
 */
export interface ExecutionEngine {
  readonly id: string;
  readonly languages: readonly string[];
  readonly capability: RunCapability;
  /** Starts a run; completing/unsubscribing the observable stops it and releases resources. */
  run(request: RunRequest): Observable<RunEvent>;
}

export const EXECUTION_ENGINES = new InjectionToken<readonly ExecutionEngine[]>('EXECUTION_ENGINES');

export const CAPABILITY_LABEL: Record<RunCapability, string> = {
  browser: 'Runs in your browser',
  wasm: 'Runs in your browser (WebAssembly)',
  server: 'Runs on a server',
  unavailable: 'Execution not available',
};
