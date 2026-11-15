import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { EXECUTION_ENGINES, type ExecutionEngine, type RunCapability, type RunEvent, type RunRequest } from './execution-engine';
import { HtmlSandboxEngine } from './html-sandbox.engine';
import { SqlJsEngine } from './sqljs.engine';
import { UnavailableEngine } from './unavailable.engine';

const ALIASES: Record<string, string> = { js: 'javascript', htm: 'html' };

/** Picks the engine for a language. Registered engines come from EXECUTION_ENGINES; the fallback is honest. */
@Injectable({ providedIn: 'root' })
export class ExecutionService {
  private readonly engines = inject(EXECUTION_ENGINES, { optional: true }) ?? [inject(HtmlSandboxEngine), inject(SqlJsEngine)];
  private readonly fallback = inject(UnavailableEngine);

  normalise(language: string): string {
    const lower = language.trim().toLowerCase();
    return ALIASES[lower] ?? lower;
  }

  engineFor(language: string): ExecutionEngine {
    const id = this.normalise(language);
    return this.engines.find((engine) => engine.languages.includes(id)) ?? this.fallback;
  }

  capabilityFor(language: string): RunCapability {
    return this.engineFor(language).capability;
  }

  canRun(language: string): boolean {
    const capability = this.capabilityFor(language);
    return capability === 'browser' || capability === 'wasm';
  }

  run(request: RunRequest): Observable<RunEvent> {
    const language = this.normalise(request.language);
    return this.engineFor(language).run({ ...request, language });
  }
}
