import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/config/site-config';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

@Component({
  selector: 'cma-about',
  imports: [PageHeaderComponent, RouterLink],
  template: `
    <cma-page-header eyebrow="Company" title="About {{ site.name }}" [lead]="site.tagline" />
    <div class="container-xxl py-5">
      <div class="cma-prose">
        <h2 class="h4">What this platform is</h2>
        <p>
          {{ site.name }} is an independent developer-education site. Every tutorial is written as a sequence of
          short lessons with runnable examples, expected output, common mistakes, exercises and a quiz, so you can
          check your understanding as you go instead of only reading.
        </p>
        <h2 class="h4 mt-4">How tutorials are produced</h2>
        <p>
          Each technology has a clearly labelled status. <strong>Complete</strong> tutorials have a full lesson set
          that passed our content checklist; <strong>in progress</strong> tutorials are published lesson by lesson;
          <strong>planned</strong> tutorials have a catalog entry and description only. We never present an
          unfinished tutorial as complete.
        </p>
        <h2 class="h4 mt-4">Independence</h2>
        <p>
          We are not affiliated with the vendors of the technologies we teach. Product names, logos and brands
          belong to their respective owners and are used for identification only.
        </p>
        <p class="mb-0">
          Found a mistake? <a routerLink="/contact">Tell us</a> and we will fix the lesson.
        </p>
      </div>
    </div>
  `,
})
export class AboutPage {
  protected readonly site = inject(SITE_CONFIG);
}
