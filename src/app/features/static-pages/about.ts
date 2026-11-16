import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/config/site-config';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

@Component({
  selector: 'cma-about',
  imports: [PageHeaderComponent, RouterLink],
  template: `
    <cma-page-header
      eyebrow="Meet your learning space"
      title="About {{ site.name }}"
      [lead]="site.tagline"
    />
    <div class="container-xxl py-5">
      <div class="cma-prose">
        <h2 class="h4">Learn one small step at a time</h2>
        <p>
          {{ site.name }} is a free place to learn how to code. Code means instructions for a
          computer. Read a short lesson, look at an example, then try a small task. You can learn at
          your own pace. You do not need an account, email address or password.
        </p>
        <h2 class="h4 mt-4">Find a topic you like</h2>
        <p>
          Every topic includes lessons, examples, practice questions, a quiz and a word reference.
          Start with the basics. Each lesson adds one new idea. If you are new,
          <a routerLink="/start">start with this simple guide</a>.
        </p>
        <h2 class="h4 mt-4">Your progress stays here</h2>
        <p>
          Your browser remembers the lessons you finish on this device. You can see them on
          <a routerLink="/dashboard">My learning</a>. Clearing browser data removes that progress.
        </p>
        <h2 class="h4 mt-4">About the names and logos</h2>
        <p>
          The tools we teach have their own makers. Their names and logos belong to those makers.
          This site is an independent learning project.
        </p>
        <p class="mb-0">
          Found a mistake? <a routerLink="/contact">Prepare a feedback note</a> with the lesson
          link.
        </p>
      </div>
    </div>
  `,
})
export class AboutPage {
  protected readonly site = inject(SITE_CONFIG);
}
