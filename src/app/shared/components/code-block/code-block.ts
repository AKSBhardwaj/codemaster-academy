import { Component, computed, inject, input, signal } from '@angular/core';
import type { CodeToken } from '../../../core/models/content';
import { PlatformService } from '../../../core/services/platform.service';
import { IconComponent } from '../icon/icon';
import { InlineMarkupComponent } from '../inline-markup/inline-markup';

const LANGUAGE_LABEL: Record<string, string> = {
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  json: 'JSON',
  sql: 'SQL',
  python: 'Python',
  py: 'Python',
  java: 'Java',
  csharp: 'C#',
  cs: 'C#',
  cpp: 'C++',
  c: 'C',
  php: 'PHP',
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  text: 'Text',
  yaml: 'YAML',
  dockerfile: 'Dockerfile',
  go: 'Go',
  rust: 'Rust',
  kotlin: 'Kotlin',
  swift: 'Swift',
  'angular-html': 'Angular template',
  'angular-ts': 'Angular',
  jsx: 'JSX',
  tsx: 'TSX',
  markdown: 'Markdown',
  xml: 'XML',
};

/**
 * Syntax-highlighted code block rendered from precomputed tokens (no runtime highlighter, no innerHTML).
 * Falls back to plain lines when no tokens are supplied.
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
  /** Accessible name announced for the region. */
  readonly label = input<string | undefined>(undefined);

  protected readonly copied = signal(false);
  private readonly platform = inject(PlatformService);
  private copyTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly lines = computed<CodeToken[][]>(() => {
    const tokens = this.tokens();
    if (tokens && tokens.length) return tokens;
    return this.code()
      .split('\n')
      .map((line) => (line ? [[line]] : []));
  });
  protected readonly languageLabel = computed(() => LANGUAGE_LABEL[this.language().toLowerCase()] ?? this.language().toUpperCase());
  protected readonly highlighted = computed(() => new Set(this.highlightLines() ?? []));
  protected readonly ariaLabel = computed(() => this.label() ?? `${this.title() ?? this.languageLabel()} code example`);

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
}
