import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CREATOR_PROFILE } from '../../core/config/creator-profile';
import { SITE_CONFIG } from '../../core/config/site-config';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

@Component({
  selector: 'cma-about',
  imports: [PageHeaderComponent, RouterLink, NgOptimizedImage],
  styleUrl: './about.scss',
  template: `
    <cma-page-header
      eyebrow="Meet your learning space"
      title="About {{ site.name }}"
      [lead]="site.tagline"
    />
    <div class="container-xxl py-5">
      <section id="creator" class="cma-creator mb-5" aria-labelledby="creator-name" tabindex="-1">
        <div class="cma-creator__identity">
          <img
            class="cma-creator__portrait"
            [ngSrc]="creator.photoPath"
            [alt]="creator.name"
            width="128"
            height="128"
            priority
          />
          <p class="cma-eyebrow mb-2">Meet the creator</p>
          <h2 id="creator-name" class="cma-creator__name">Hi, I'm {{ creator.name }}</h2>
          <p class="cma-creator__role">{{ creator.role }}</p>
          <p class="cma-creator__experience">
            <strong>{{ creator.experience }}</strong>
            <span>years of building software</span>
          </p>
          <p class="small cma-text-secondary mb-0">Currently working at {{ creator.employer }}.</p>
          <p class="cma-creator__motto">{{ creator.motto }}</p>
        </div>
        <div class="cma-creator__story">
          <h3 class="h4 fw-bold">Making coding easier to learn</h3>
          <p>
            I build websites and the code that runs behind them. I enjoy turning big ideas into
            useful tools that are easy to use. I care about clear code, fast apps and solving real
            problems.
          </p>
          <p>
            I created {{ site.name }} to help more people learn to code. My aim is simple: explain
            each idea in small steps, show an example and give you something to try. You do not need
            to know everything to get started.
          </p>
          <h3 class="h5 fw-bold mt-4 mb-3">What I work with and explore</h3>
          <ul class="cma-creator__skills">
            @for (skill of creator.skills; track skill.title) {
              <li>
                <h4 class="h6 fw-bold mb-1">{{ skill.title }}</h4>
                <p class="small mb-2">{{ skill.description }}</p>
                <p class="cma-creator__tools mb-0">{{ skill.tools.join(', ') }}</p>
              </li>
            }
          </ul>
          <p class="cma-creator__learning mb-0">
            <strong>I am a learner, too.</strong> I enjoy trying new technology, exploring AI tools
            and building personal projects. I believe learning never stops. Great software starts
            with a real problem and gets better one step at a time.
          </p>
        </div>
      </section>
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
  protected readonly creator = CREATOR_PROFILE;
}
