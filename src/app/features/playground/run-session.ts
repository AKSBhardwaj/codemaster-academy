import { DestroyRef, inject, signal } from '@angular/core';
import type { Subscription } from 'rxjs';
import type { RunEvent } from './engines/execution-engine';
import { ExecutionService } from './engines/execution.service';
import type { RunState } from './output-panel/output-panel';

/**
 * Small reusable state machine shared by the playground page and the inline lesson runner:
 * holds the events of the current run and starts/stops executions.
 */
export class RunSession {
  readonly events = signal<RunEvent[]>([]);
  readonly state = signal<RunState>('idle');
  private readonly execution = inject(ExecutionService);
  private subscription: Subscription | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  run(language: string, code: string, host?: HTMLElement): void {
    this.stop();
    this.events.set([]);
    this.state.set('running');
    this.subscription = this.execution.run({ language, code, host }).subscribe({
      next: (event) => {
        this.events.update((list) => [...list, event]);
        if (event.type === 'done') this.state.set(this.events().some((e) => e.type === 'error') ? 'error' : 'done');
        else if (event.type === 'error' && this.execution.capabilityFor(language) === 'unavailable') this.state.set('error');
      },
      complete: () => {
        if (this.state() === 'running') this.state.set(this.events().some((e) => e.type === 'error') ? 'error' : 'done');
      },
    });
  }

  /** Stops the current run and removes its frame/worker; keeps the log visible. */
  stop(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    if (this.state() === 'running') this.state.set('idle');
  }

  reset(): void {
    this.stop();
    this.events.set([]);
    this.state.set('idle');
  }
}
