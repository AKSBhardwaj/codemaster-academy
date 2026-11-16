import { Component, computed, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import type { IconRef } from '../../../core/models/content';
import { IconComponent } from '../icon/icon';
import type { UiIconName } from '../../icons/ui-icons.generated';
import { publicPath } from '../../../../content-schema/site-constants';

/**
 * Technology logo tile. Logos (SVG files copied from devicon) render as images on a light tile so dark
 * logos stay visible in dark mode; topic glyphs render as Bootstrap icons tinted with the category accent.
 */
@Component({
  selector: 'cma-tech-icon',
  imports: [NgOptimizedImage, IconComponent],
  template: `
    <span
      class="cma-tech-icon"
      [class.cma-tech-icon--glyph]="icon().kind === 'glyph'"
      [style.--tile]="size() + 'px'"
      [style.--accent]="accent() || null"
    >
      @if (icon().kind === 'logo') {
        <img [ngSrc]="imagePath()" [width]="imageSize()" [height]="imageSize()" [alt]="alt()" />
      } @else {
        <cma-icon [name]="glyph()" [size]="imageSize()" [label]="alt()" />
      }
    </span>
  `,
  styles: `
    .cma-tech-icon {
      --tile: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: var(--tile);
      height: var(--tile);
      border-radius: calc(var(--tile) * 0.25);
      background: var(--cma-tile-bg, #ffffff);
      border: 1px solid var(--cma-border);
    }
    .cma-tech-icon--glyph {
      background: color-mix(in srgb, var(--accent, var(--cma-accent)) 12%, var(--cma-surface));
      border-color: color-mix(in srgb, var(--accent, var(--cma-accent)) 30%, transparent);
      color: var(--accent, var(--cma-accent));
    }
    :host-context([data-bs-theme='dark']) .cma-tech-icon:not(.cma-tech-icon--glyph) {
      background: #e2e8f0;
      border-color: #cbd5e1;
    }
    img {
      display: block;
    }
  `,
})
export class TechIconComponent {
  readonly icon = input.required<IconRef>();
  readonly name = input('');
  readonly size = input(44);
  /** Category accent colour used for glyph tiles. */
  readonly accent = input<string | undefined>(undefined);
  protected readonly imageSize = computed(() => Math.round(this.size() * 0.6));
  protected readonly imagePath = computed(() =>
    publicPath('/assets/icons/tech/' + this.icon().src + '.svg'),
  );
  protected readonly alt = computed(() => (this.name() ? `${this.name()} logo` : ''));
  protected readonly glyph = computed(() => this.icon().src as UiIconName);
}
