import { Component, inject } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site-config';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

@Component({
  selector: 'cma-privacy',
  imports: [PageHeaderComponent],
  template: `
    <cma-page-header eyebrow="Legal" title="Privacy policy" lead="Last updated 15 November 2026" />
    <div class="container-xxl py-5">
      <div class="cma-prose">
        <h2 class="h4">Data stored in your browser</h2>
        <p>
          Learning progress, bookmarks, quiz results, theme preference and the optional demo account are stored only
          in your browser's local storage. Nothing is sent to a server, and clearing your browser data removes it.
          You can also reset it from your profile page.
        </p>
        <h2 class="h4 mt-4">No accounts on a server</h2>
        <p>
          The current version of {{ site.name }} has no backend. "Registration" and "login" create a demo profile
          that lives in this browser only and does not synchronise across devices.
        </p>
        <h2 class="h4 mt-4">Analytics and cookies</h2>
        <p>We do not use analytics, advertising or tracking cookies.</p>
        <h2 class="h4 mt-4">Embedded content</h2>
        <p>
          Video lessons use privacy-enhanced embeds that load only after you click play. The code playground runs
          your code in an isolated sandbox that cannot access this site's storage.
        </p>
        <h2 class="h4 mt-4">Contact</h2>
        <p class="mb-0">Privacy questions: <a href="mailto:{{ site.contactEmail }}">{{ site.contactEmail }}</a>.</p>
      </div>
    </div>
  `,
})
export class PrivacyPage {
  protected readonly site = inject(SITE_CONFIG);
}
