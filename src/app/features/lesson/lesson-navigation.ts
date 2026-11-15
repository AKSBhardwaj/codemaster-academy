import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { LessonRef } from '../../core/models/content';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'cma-lesson-navigation',
  imports: [RouterLink, IconComponent],
  template: `
    <nav class="cma-lesson-nav" aria-label="Lesson navigation">
      <div>
        @if (previous(); as prev) {
          <a class="cma-card cma-card--link cma-lesson-nav__link" [routerLink]="['/tutorials', prev.technologySlug, prev.slug]" rel="prev">
            <small><cma-icon name="arrow-left" [size]="12" /> Previous lesson</small>
            <strong>{{ prev.title }}</strong>
          </a>
        }
      </div>
      <div>
        @if (next(); as nxt) {
          <a class="cma-card cma-card--link cma-lesson-nav__link cma-lesson-nav__link--next" [routerLink]="['/tutorials', nxt.technologySlug, nxt.slug]" rel="next">
            <small>Next lesson <cma-icon name="arrow-right" [size]="12" /></small>
            <strong>{{ nxt.title }}</strong>
          </a>
        } @else if (finishPath()) {
          <a class="cma-card cma-card--link cma-lesson-nav__link cma-lesson-nav__link--next" [routerLink]="finishPath()">
            <small>You finished the lessons <cma-icon name="trophy" [size]="12" /></small>
            <strong>Back to the tutorial overview</strong>
          </a>
        }
      </div>
    </nav>
  `,
})
export class LessonNavigationComponent {
  readonly previous = input<LessonRef | null>(null);
  readonly next = input<LessonRef | null>(null);
  readonly finishPath = input<string | undefined>(undefined);
}
