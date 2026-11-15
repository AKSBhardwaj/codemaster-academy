import { Component, input } from '@angular/core';
import type { ListBlock } from '../../core/models/content';
import { InlineMarkupComponent } from '../../shared/components/inline-markup/inline-markup';

@Component({
  selector: 'cma-list-block',
  imports: [InlineMarkupComponent],
  template: `
    @if (block().ordered) {
      <ol>
        @for (item of block().items; track $index) {
          <li><cma-inline [text]="item" /></li>
        }
      </ol>
    } @else {
      <ul>
        @for (item of block().items; track $index) {
          <li><cma-inline [text]="item" /></li>
        }
      </ul>
    }
  `,
})
export class ListBlockComponent {
  readonly block = input.required<ListBlock>();
}
