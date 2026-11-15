import { Component, inject } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site-config';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

@Component({
  selector: 'cma-terms',
  imports: [PageHeaderComponent],
  template: `
    <cma-page-header eyebrow="Legal" title="Terms and conditions" lead="Last updated 15 November 2026" />
    <div class="container-xxl py-5">
      <div class="cma-prose">
        <h2 class="h4">Use of the content</h2>
        <p>
          Tutorials, examples and exercises on {{ site.name }} are provided free of charge for personal learning.
          You may use the code examples in your own projects. You may not republish the lesson text as your own.
        </p>
        <h2 class="h4 mt-4">Accuracy</h2>
        <p>
          We work hard to keep lessons technically correct and current, and each tutorial shows its completion
          status. Content is provided "as is" without warranty; always verify behaviour against official
          documentation for production decisions.
        </p>
        <h2 class="h4 mt-4">Playground</h2>
        <p>
          Code you run in the playground executes in your own browser inside a sandbox. You are responsible for
          the code you write and run.
        </p>
        <h2 class="h4 mt-4">Trademarks</h2>
        <p class="mb-0">
          Product names, logos and brands are property of their respective owners and are used for identification
          only; their use does not imply endorsement.
        </p>
      </div>
    </div>
  `,
})
export class TermsPage {
  protected readonly site = inject(SITE_CONFIG);
}
