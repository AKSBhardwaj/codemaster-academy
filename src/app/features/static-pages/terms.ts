import { Component, inject } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site-config';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

@Component({
  selector: 'cma-terms',
  imports: [PageHeaderComponent],
  template: `
    <cma-page-header
      eyebrow="Using this site"
      title="Terms and conditions"
      lead="Last updated 16 November 2026"
    />
    <div class="container-xxl py-5">
      <div class="cma-prose">
        <h2 class="h4">Use of the content</h2>
        <p>
          You can use {{ site.name }} for free to learn. You may use the code examples in your own
          projects. Please do not copy lesson text and claim you wrote it.
        </p>
        <h2 class="h4 mt-4">Accuracy</h2>
        <p>
          We try to make lessons correct, but mistakes can happen. Each tutorial shows whether its
          lessons are ready. For an important real project, check the tool maker's own guide too. We
          cannot promise that every example fits every project.
        </p>
        <h2 class="h4 mt-4">Playground</h2>
        <p>
          The playground runs supported code in your browser. Use it to practise with small
          examples. Your saved work stays in this browser and may be lost if you clear browser data.
        </p>
        <h2 class="h4 mt-4">Trademarks</h2>
        <p class="mb-0">
          Product names and logos belong to their owners. Showing them helps you recognise each
          tool. It does not mean the tool's maker sponsors this site.
        </p>
      </div>
    </div>
  `,
})
export class TermsPage {
  protected readonly site = inject(SITE_CONFIG);
}
