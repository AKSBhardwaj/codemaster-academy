import {
  Component,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { Exercise } from '../../../core/models/content';
import { CodeBlockComponent } from '../../../shared/components/code-block/code-block';
import { CodeEditorComponent } from '../../../shared/components/code-editor/code-editor';
import { IconComponent } from '../../../shared/components/icon/icon';
import { InlineMarkupComponent } from '../../../shared/components/inline-markup/inline-markup';
import { ExecutionService } from '../../playground/engines/execution.service';
import { OutputPanelComponent } from '../../playground/output-panel/output-panel';
import { RunSession } from '../../playground/run-session';
import { matchesConsoleOutput, matchesSqlResult } from '../grading';

type CodingTask = Extract<Exercise, { type: 'coding-task' }>;

/**
 * Practical coding task: editor seeded with starter code, optional run + automatic check for languages the
 * playground executes, a self-check checklist, and a solution reveal. Completion is explicit and honest:
 * "done" means the automatic check passed or the learner ticked every checklist item.
 */
@Component({
  selector: 'cma-coding-task',
  imports: [
    CodeEditorComponent,
    CodeBlockComponent,
    OutputPanelComponent,
    IconComponent,
    InlineMarkupComponent,
  ],
  templateUrl: './coding-task.html',
  styleUrl: './coding-task.scss',
})
export class CodingTaskComponent {
  readonly task = input.required<CodingTask>();
  readonly done = input(false);
  readonly completed = output<void>();

  protected readonly session = new RunSession();
  protected readonly code = linkedSignal(() => this.task().starterCode);
  protected readonly checklist = linkedSignal<boolean[]>(() =>
    this.task().checklist.map(() => false),
  );
  protected readonly solutionShown = signal(false);
  protected readonly interactive = signal(false);
  private readonly execution = inject(ExecutionService);
  private readonly output = viewChild(OutputPanelComponent);

  protected readonly canRun = computed(() => this.execution.canRun(this.task().language));
  protected readonly allChecked = computed(() => this.checklist().every(Boolean));
  protected readonly autoCheck = computed<'passed' | 'failed' | null>(() => {
    const check = this.task().check;
    const state = this.session.state();
    if (!check || (state !== 'done' && state !== 'error')) return null;
    const events = this.session.events();
    const passed =
      check.kind === 'console-output'
        ? matchesConsoleOutput(events, check.expectedLines)
        : matchesSqlResult(events, check.expectedColumns, check.expectedRows);
    return passed ? 'passed' : 'failed';
  });
  protected readonly canComplete = computed(
    () => this.allChecked() || this.autoCheck() === 'passed',
  );

  constructor() {
    // A native checkbox must wait until Angular can remember its changes.
    afterNextRender(() => this.interactive.set(true));
  }

  protected run(): void {
    this.session.run(this.task().language, this.code(), this.output()?.host);
  }

  protected reset(): void {
    this.code.set(this.task().starterCode);
    this.session.reset();
  }

  protected toggleItem(index: number): void {
    this.checklist.update((items) => items.map((value, i) => (i === index ? !value : value)));
  }

  protected markDone(): void {
    if (this.canComplete()) this.completed.emit();
  }
}
