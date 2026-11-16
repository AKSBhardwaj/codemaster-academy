import { Component, inject, input } from '@angular/core';
import type { HeadingBlock } from '../../core/models/content';
import { PageAnchorService } from '../../core/services/page-anchor.service';

@Component({
  selector: 'cma-heading-block',
  template: `
    @switch (block().level) {
      @case (2) {
        <h2 [id]="block().id">
          {{ block().text
          }}<a
            class="cma-anchor"
            [href]="anchors.href(block().id)"
            [attr.aria-label]="'Link to section ' + block().text"
            >#</a
          >
        </h2>
      }
      @case (3) {
        <h3 [id]="block().id">
          {{ block().text
          }}<a
            class="cma-anchor"
            [href]="anchors.href(block().id)"
            [attr.aria-label]="'Link to section ' + block().text"
            >#</a
          >
        </h3>
      }
      @default {
        <h4 [id]="block().id">{{ block().text }}</h4>
      }
    }
  `,
})
export class HeadingBlockComponent {
  protected readonly anchors = inject(PageAnchorService);
  readonly block = input.required<HeadingBlock>();
}
