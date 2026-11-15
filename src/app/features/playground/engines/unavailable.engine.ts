import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { ExecutionEngine, RunEvent, RunRequest } from './execution-engine';

/** Fallback for languages without a browser-side runtime. Never pretends to execute anything. */
@Injectable({ providedIn: 'root' })
export class UnavailableEngine implements ExecutionEngine {
  readonly id = 'unavailable';
  readonly languages: readonly string[] = [];
  readonly capability = 'unavailable' as const;

  run(request: RunRequest): Observable<RunEvent> {
    return of<RunEvent>({
      type: 'error',
      message: `Running ${request.language} is not available in this version of the playground. It executes HTML, CSS, JavaScript and SQL only; copy the code into a local toolchain to run it.`,
    });
  }
}
