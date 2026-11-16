import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/config/site-config';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

@Component({
  selector: 'cma-privacy',
  imports: [PageHeaderComponent, RouterLink],
  template: `
    <cma-page-header
      eyebrow="Your information"
      title="Privacy policy"
      lead="Last updated 16 November 2026"
    />
    <div class="container-xxl py-5">
      <div class="cma-prose">
        <h2 class="h4">Data stored in your browser</h2>
        <p>
          Your browser saves your progress, bookmarks, quiz scores, code drafts, theme choice and
          optional nickname. This learning data stays on this device. Clearing your browser data
          removes it. You can download a copy or clear it from
          <a routerLink="/settings">Learning settings</a>.
        </p>
        <h2 class="h4 mt-4">No account needed</h2>
        <p>
          {{ site.name }} has no sign-up form, passwords or online accounts. You can start a lesson
          right away. Your progress does not move between browsers or devices.
        </p>
        <h2 class="h4 mt-4">Visits to the site</h2>
        <p>
          We do not add advertising or tracking cookies. The service that hosts the website may keep
          normal visit logs, such as the pages requested.
        </p>
        <h2 class="h4 mt-4">Embedded content</h2>
        <p>
          Videos load only after you press play. Playing a video connects to the video provider. The
          code playground runs in your browser. HTML and JavaScript examples use a separate frame
          that cannot read your saved learning data.
        </p>
        <h2 class="h4 mt-4">Contact</h2>
        <p class="mb-0">
          The <a routerLink="/contact">feedback page</a> lets you prepare, copy or download a note.
          It does not send or save your message. If an email option is available and you choose it,
          your email app handles sending.
        </p>
      </div>
    </div>
  `,
})
export class PrivacyPage {
  protected readonly site = inject(SITE_CONFIG);
}
