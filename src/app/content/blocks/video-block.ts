import { Component, computed, input, signal } from '@angular/core';
import type { VideoBlock } from '../../core/models/content';
import { IconComponent } from '../../shared/components/icon/icon';

/** Privacy-friendly video embed: nothing loads from YouTube until the learner presses play. */
@Component({
  selector: 'cma-video-block',
  imports: [IconComponent],
  template: `
    <div class="cma-video">
      @if (loaded()) {
        <iframe
          [src]="embedUrl()"
          [title]="block().title"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
      } @else {
        <button type="button" class="cma-video__placeholder" (click)="loaded.set(true)">
          <cma-icon name="play-circle" [size]="48" />
          <span class="fw-semibold">{{ block().title }}</span>
          <span class="small opacity-75">Play video (loads from youtube-nocookie.com)</span>
        </button>
      }
    </div>
  `,
})
export class VideoBlockComponent {
  readonly block = input.required<VideoBlock>();
  protected readonly loaded = signal(false);
  protected readonly embedUrl = computed(() => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(this.block().videoId)}?autoplay=1`);
}
