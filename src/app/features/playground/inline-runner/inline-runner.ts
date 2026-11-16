import {
  Component,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { CodeEditorComponent } from '../../../shared/components/code-editor/code-editor';
import { IconComponent } from '../../../shared/components/icon/icon';
import { ExecutionService } from '../engines/execution.service';
import { OutputPanelComponent } from '../output-panel/output-panel';
import { PlaygroundHandoffService } from '../playground-handoff.service';
import { RunSession } from '../run-session';

/** Editable, runnable example embedded in a lesson ("Try it yourself"). */
@Component({
  selector: 'cma-inline-runner',
  imports: [CodeEditorComponent, OutputPanelComponent, IconComponent],
  template: `
    <div class="cma-inline-runner">
      <div class="cma-inline-runner__bar">
        <span class="cma-inline-runner__title"
          ><cma-icon name="play-circle" [size]="14" /> {{ title() }}</span
        >
        <div class="d-flex gap-1">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            (click)="reset()"
            [disabled]="!interactive()"
          >
            <cma-icon name="arrow-counterclockwise" [size]="14" /> Reset
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            (click)="openInPlayground()"
            [disabled]="!interactive()"
          >
            <cma-icon name="arrow-up-right" [size]="14" /> Playground
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
            (click)="run()"
            [disabled]="!interactive() || !canRun()"
          >
            <cma-icon name="play-fill" [size]="14" /> Run
          </button>
        </div>
      </div>
      <div class="cma-inline-runner__grid">
        <cma-code-editor
          [(value)]="code"
          [language]="language()"
          [minHeight]="height()"
          [label]="title() + ' editor'"
        />
        <cma-output-panel
          [events]="session.events()"
          [state]="session.state()"
          [showPreview]="language() !== 'sql'"
          [compact]="true"
        />
      </div>
    </div>
  `,
  styles: `
    .cma-inline-runner {
      margin-block: 1.25rem;
      border: 1px solid var(--cma-accent-soft-border);
      border-radius: var(--cma-radius-lg);
      overflow: hidden;
    }
    .cma-inline-runner__bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.5rem 0.4rem 0.875rem;
      background: var(--cma-accent-soft);
    }
    .cma-inline-runner__title {
      display: inline-flex;
      flex: 1 1 12rem;
      align-items: center;
      gap: 0.4rem;
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--cma-accent);
    }
    .cma-inline-runner__grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 0.5rem;
      padding: 0.5rem;
    }
    @media (min-width: 768px) {
      .cma-inline-runner__grid {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      }
    }
  `,
})
export class InlineRunnerComponent {
  readonly initialCode = input.required<string>();
  readonly language = input.required<string>();
  readonly title = input('Try it yourself');
  readonly height = input(180);

  protected readonly session = new RunSession();
  protected readonly interactive = signal(false);
  /** Editable copy of the example; resets whenever the input changes, otherwise keeps the learner's edits. */
  protected readonly code = linkedSignal(() => this.initialCode());
  private readonly execution = inject(ExecutionService);
  private readonly handoff = inject(PlaygroundHandoffService);
  private readonly output = viewChild(OutputPanelComponent);
  protected readonly canRun = computed(() => this.execution.canRun(this.language()));

  constructor() {
    afterNextRender(() => this.interactive.set(true));
  }

  protected run(): void {
    this.session.run(this.language(), this.code(), this.output()?.host);
  }

  protected reset(): void {
    this.code.set(this.initialCode());
    this.session.reset();
  }

  protected openInPlayground(): void {
    this.handoff.open({ language: this.language(), code: this.code(), title: this.title() });
  }
}
