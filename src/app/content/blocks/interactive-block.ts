import { Component, input } from '@angular/core';
import type { InteractiveBlock } from '../../core/models/content';
import { CodeBlockComponent } from '../../shared/components/code-block/code-block';

/**
 * "Try it yourself" block. Until the playground engines land (Phase 5) it shows the editable starting
 * code as a static block with an honest note; Phase 5 replaces the note with the inline runner.
 */
@Component({
  selector: 'cma-interactive-block',
  imports: [CodeBlockComponent],
  template: `
    <cma-code-block [code]="block().code" [language]="block().language" [title]="block().title ?? 'Try it yourself'" />
    <p class="cma-block-note">
      This example becomes editable and runnable when the in-lesson playground is released (build phase 5). For now you can copy it into your editor.
    </p>
  `,
})
export class InteractiveBlockComponent {
  readonly block = input.required<InteractiveBlock>();
}
