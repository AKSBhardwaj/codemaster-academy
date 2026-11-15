import { Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import type { ImageBlock } from '../../core/models/content';
import { InlineMarkupComponent } from '../../shared/components/inline-markup/inline-markup';

@Component({
  selector: 'cma-image-block',
  imports: [NgOptimizedImage, InlineMarkupComponent],
  template: `
    <figure>
      <img class="img-fluid rounded border" [ngSrc]="block().src" [width]="block().width" [height]="block().height" [alt]="block().alt" />
      @if (block().caption) {
        <figcaption><cma-inline [text]="block().caption" /></figcaption>
      }
    </figure>
  `,
})
export class ImageBlockComponent {
  readonly block = input.required<ImageBlock>();
}
