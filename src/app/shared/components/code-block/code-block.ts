import { Component, computed, inject, input, signal } from '@angular/core';
import { codeLanguageLabel } from '../../../../content-schema/code-language';
import type { CodeToken } from '../../../core/models/content';
import { PlatformService } from '../../../core/services/platform.service';
import { PlaygroundHandoffService } from '../../../features/playground/playground-handoff.service';
import { IconComponent } from '../icon/icon';
import { InlineMarkupComponent } from '../inline-markup/inline-markup';

const RUNNABLE_LANGUAGES = new Set(['html', 'css', 'javascript', 'js', 'sql']);

/**
 * Syntax-highlighted code block rendered from precomputed tokens (no runtime highlighter, no innerHTML).
 * Falls back to plain lines when no tokens are supplied. Runnable examples offer "Open in playground".
 */
@Component({
  selector: 'cma-code-block',
  imports: [IconComponent, InlineMarkupComponent],
  templateUrl: './code-block.html',
})
export class CodeBlockComponent {
  readonly code = input.required<string>();
  readonly language = input('text');
  readonly tokens = input<CodeToken[][] | undefined>(undefined);
  readonly title = input<string | undefined>(undefined);
  readonly caption = input<string | undefined>(undefined);
  readonly highlightLines = input<readonly number[] | undefined>(undefined);
  readonly showLineNumbers = input(false);
  /** Shows the "Open in playground" action for languages the playground can execute. */
  readonly runnable = input(false);
  /** Accessible name announced for the region. */
  readonly label = input<string | undefined>(undefined);

  protected readonly copied = signal(false);
  private readonly platform = inject(PlatformService);
  private readonly handoff = inject(PlaygroundHandoffService);
  private copyTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly lines = computed<CodeToken[][]>(() => {
    const tokens = this.tokens();
    if (tokens && tokens.length) return tokens;
    return this.code()
      .split('\n')
      .map((line) => (line ? [[line]] : []));
  });
  protected readonly languageLabel = computed(() => codeLanguageLabel(this.language()));
  protected readonly highlighted = computed(() => new Set(this.highlightLines() ?? []));
  protected readonly ariaLabel = computed(
    () => this.label() ?? `${this.title() ?? this.languageLabel()} code example`,
  );
  protected readonly canOpenInPlayground = computed(
    () => this.runnable() && RUNNABLE_LANGUAGES.has(this.language().toLowerCase()),
  );

  protected async copy(): Promise<void> {
    if (!this.platform.isBrowser) return;
    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
      clearTimeout(this.copyTimer);
      this.copyTimer = setTimeout(() => this.copied.set(false), 1800);
    } catch {
      this.copied.set(false);
    }
  }

  protected openInPlayground(): void {
    this.handoff.open({ language: this.language(), code: this.code(), title: this.title() });
  }
}
