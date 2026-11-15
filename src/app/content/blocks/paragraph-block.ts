import { Component, input } from '@angular/core';
import type { ParagraphBlock } from '../../core/models/content';
import { InlineMarkupComponent } from '../../shared/components/inline-markup/inline-markup';

@Component({
  selector: 'cma-paragraph-block',
  imports: [InlineMarkupComponent],
  template: `<p><cma-inline [text]="block().text" /></p>`,
})
export class ParagraphBlockComponent {
  readonly block = input.required<ParagraphBlock>();
}
