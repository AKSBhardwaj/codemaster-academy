import { Component, ElementRef, computed, input, viewChild } from '@angular/core';
import type { RunEvent } from '../engines/execution-engine';
import { IconComponent } from '../../../shared/components/icon/icon';

export type RunState = 'idle' | 'running' | 'done' | 'error';

/**
 * Shows what a run produced: the sandboxed frame (for HTML/CSS/JS), console messages, SQL result
 * tables and errors. The frame is mounted by the engine into the `frameHost` element.
 */
@Component({
  selector: 'cma-output-panel',
  imports: [IconComponent],
  templateUrl: './output-panel.html',
  styleUrl: './output-panel.scss',
})
export class OutputPanelComponent {
  readonly events = input.required<readonly RunEvent[]>();
  readonly state = input<RunState>('idle');
  /** Whether a visual preview frame should be shown (HTML/CSS/JS runs). */
  readonly showPreview = input(true);
  readonly compact = input(false);
  readonly frameHost = viewChild.required<ElementRef<HTMLDivElement>>('frameHost');

  protected readonly consoleEvents = computed(() =>
    this.events().filter(
      (e): e is Extract<RunEvent, { type: 'console' | 'error' }> =>
        e.type === 'console' || e.type === 'error',
    ),
  );
  protected readonly results = computed(() =>
    this.events().filter((e): e is Extract<RunEvent, { type: 'result' }> => e.type === 'result'),
  );
  protected readonly status = computed(() =>
    this.events()
      .filter((e): e is Extract<RunEvent, { type: 'status' }> => e.type === 'status')
      .at(-1),
  );
  protected readonly done = computed(() =>
    this.events().find((e): e is Extract<RunEvent, { type: 'done' }> => e.type === 'done'),
  );
  protected readonly hasErrors = computed(() => this.events().some((e) => e.type === 'error'));

  /** Element the engine renders the sandboxed frame into. */
  get host(): HTMLElement {
    return this.frameHost().nativeElement;
  }

  protected cell(value: unknown): string {
    if (value === null || value === undefined) return 'NULL';
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }
}
