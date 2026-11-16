import { Component, afterNextRender, input, linkedSignal, signal } from '@angular/core';
import { codeLanguageLabel } from '../../../content-schema/code-language';
import type { CodeTabsBlock } from '../../core/models/content';
import { CodeBlockHostComponent } from './code-block-host';

/** Readable on the server; choosing another language needs no editor or runtime. */
@Component({
  selector: 'cma-code-tabs-block',
  imports: [CodeBlockHostComponent],
  templateUrl: './code-tabs-block.html',
  styleUrl: './code-tabs-block.scss',
})
export class CodeTabsBlockComponent {
  readonly block = input.required<CodeTabsBlock>();
  /** The lesson id and block position stay identical during prerendering and hydration. */
  readonly blockId = input.required<string>();

  protected readonly interactive = signal(false);
  protected readonly languageLabel = codeLanguageLabel;
  protected readonly selectedLanguage = linkedSignal(() => {
    const block = this.block();
    return block.defaultLanguage ?? block.variants[0].language;
  });

  constructor() {
    afterNextRender(() => this.interactive.set(true));
  }

  protected choose(language: string): void {
    if (this.interactive()) this.selectedLanguage.set(language);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    if (!this.interactive()) return;
    const variants = this.block().variants;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % variants.length;
        break;
      case 'ArrowLeft':
        next = (index + variants.length - 1) % variants.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = variants.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.choose(variants[next].language);
    const tab = event.currentTarget as HTMLButtonElement;
    tab.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }
}
