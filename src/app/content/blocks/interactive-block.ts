import { Component, input } from '@angular/core';
import type { InteractiveBlock } from '../../core/models/content';
import { CodeBlockComponent } from '../../shared/components/code-block/code-block';
import { InlineRunnerComponent } from '../../features/playground/inline-runner/inline-runner';

/**
 * "Try it yourself" block: the static code is prerendered; the editable runner (CodeMirror + sandbox)
 * is deferred until it scrolls into view, so lesson pages stay light.
 */
@Component({
  selector: 'cma-interactive-block',
  imports: [CodeBlockComponent, InlineRunnerComponent],
  template: `
    @defer (on viewport; hydrate on viewport) {
      <cma-inline-runner
        [initialCode]="block().code"
        [language]="block().language"
        [title]="block().title ?? 'Try it yourself'"
        [height]="block().height ?? 180"
      />
    } @placeholder {
      <cma-code-block
        [code]="block().code"
        [language]="block().language"
        [title]="block().title ?? 'Try it yourself'"
      />
    }
  `,
})
export class InteractiveBlockComponent {
  readonly block = input.required<InteractiveBlock>();
}
