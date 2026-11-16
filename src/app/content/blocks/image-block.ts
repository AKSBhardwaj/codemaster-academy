import { Component, computed, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import type { ImageBlock } from '../../core/models/content';
import { InlineMarkupComponent } from '../../shared/components/inline-markup/inline-markup';
import { publicPath } from '../../../content-schema/site-constants';

@Component({
  selector: 'cma-image-block',
  imports: [NgOptimizedImage, InlineMarkupComponent],
  template: `
    <figure>
      <img
        class="img-fluid rounded border"
        [ngSrc]="imagePath()"
        [width]="block().width"
        [height]="block().height"
        [alt]="block().alt"
      />
      @if (block().caption) {
        <figcaption><cma-inline [text]="block().caption" /></figcaption>
      }
    </figure>
  `,
})
export class ImageBlockComponent {
  readonly block = input.required<ImageBlock>();
  protected readonly imagePath = computed(() => publicPath(this.block().src));
}
