import { Component, input } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { PlaygroundPage } from './playground';

/**
 * Route component: page header plus the playground. The router binds the `lang` and `template`
 * query parameters here and they are passed down to the embeddable playground component.
 */
@Component({
  selector: 'cma-playground-page',
  imports: [PageHeaderComponent, PlaygroundPage],
  template: `
    <cma-page-header
      eyebrow="Playground"
      title="Code playground"
      lead="Write and run HTML, CSS, JavaScript and SQL safely in your browser. Start from a template or open an example from any lesson."
    />
    <div class="container-xxl py-4">
      <cma-playground [lang]="lang()" [template]="template()" />
    </div>
  `,
})
export class PlaygroundRoutePage {
  readonly lang = input<string | undefined>(undefined);
  readonly template = input<string | undefined>(undefined);
}
