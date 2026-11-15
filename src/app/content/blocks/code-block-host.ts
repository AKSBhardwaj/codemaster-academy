import { Component, input } from '@angular/core';
import type { CodeBlock } from '../../core/models/content';
import { CodeBlockComponent } from '../../shared/components/code-block/code-block';

/** Adapts a compiled code block (with build-time tokens) to the shared CodeBlockComponent. */
@Component({
  selector: 'cma-code-block-host',
  imports: [CodeBlockComponent],
  template: `
    <cma-code-block
      [code]="block().code"
      [language]="block().language"
      [tokens]="block().tokens"
      [title]="block().title"
      [caption]="block().caption"
      [highlightLines]="block().highlightLines"
      [showLineNumbers]="block().showLineNumbers ?? false"
      [runnable]="block().runnable ?? false"
    />
  `,
})
export class CodeBlockHostComponent {
  readonly block = input.required<CodeBlock>();
}
