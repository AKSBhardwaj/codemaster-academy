import { Component, ElementRef, afterNextRender, effect, inject, input, viewChild } from '@angular/core';
import type { OutputBlock } from '../../core/models/content';
import { PlatformService } from '../../core/services/platform.service';
import { IconComponent } from '../../shared/components/icon/icon';

const PREVIEW_STYLES = `<style>
  body { margin: 12px; font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #172033; background: #fff; }
  h1, h2, h3 { margin: 0 0 .5em; line-height: 1.25; } p { margin: 0 0 .75em; } table { border-collapse: collapse; } th, td { border: 1px solid #cbd5e1; padding: 4px 8px; }
</style>`;

/**
 * Expected output of a code example: plain text (console style) or authored HTML rendered inside a
 * fully sandboxed iframe (no scripts, opaque origin). The frame is created after hydration on the client.
 */
@Component({
  selector: 'cma-output-block',
  imports: [IconComponent],
  template: `
    <div class="cma-output">
      <div class="cma-output__header"><cma-icon name="terminal" [size]="12" /> {{ block().title ?? (block().kind === 'html' ? 'Rendered output' : 'Output') }}</div>
      @if (block().kind === 'html') {
        <div class="cma-output__frame-wrap" [style.height.px]="height()">
          <iframe #frame class="cma-output__frame" sandbox="" title="Rendered output preview" loading="lazy" [style.height.px]="height()"></iframe>
        </div>
      } @else {
        <pre class="cma-output__text">{{ block().content }}</pre>
      }
    </div>
  `,
})
export class OutputBlockComponent {
  readonly block = input.required<OutputBlock>();
  readonly height = input(160);
  private readonly frame = viewChild<ElementRef<HTMLIFrameElement>>('frame');
  private readonly platform = inject(PlatformService);

  constructor() {
    // Set srcdoc as a DOM property after hydration; never bound in the template (Angular would sanitise it).
    effect(() => {
      const frame = this.frame()?.nativeElement;
      const content = this.block().content;
      if (!frame || !this.platform.isBrowser) return;
      frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8">${PREVIEW_STYLES}</head><body>${content}</body></html>`;
    });
    afterNextRender(() => {
      /* ensures the effect above runs after the view exists on the client */
    });
  }
}
