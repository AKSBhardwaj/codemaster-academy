import { Component, inject } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site-config';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { WorkInProgressComponent } from '../../shared/components/work-in-progress/work-in-progress';

@Component({
  selector: 'cma-contact',
  imports: [PageHeaderComponent, WorkInProgressComponent],
  template: `
    <cma-page-header
      eyebrow="Company"
      title="Contact us"
      lead="Questions, corrections or partnership ideas are welcome."
    />
    <div class="container-xxl py-5">
      <div class="cma-prose">
        <p>
          Email us at <a href="mailto:{{ site.contactEmail }}">{{ site.contactEmail }}</a>. We read every message
          and reply to corrections first.
        </p>
        <cma-work-in-progress feature="The contact form" [phase]="6" />
      </div>
    </div>
  `,
})
export class ContactPage {
  protected readonly site = inject(SITE_CONFIG);
}
