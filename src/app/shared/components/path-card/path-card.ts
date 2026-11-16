import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DIFFICULTY_LABEL, type LearningPathSummary } from '../../../core/models/content';
import { IconComponent } from '../icon/icon';
import type { UiIconName } from '../../icons/ui-icons.generated';

@Component({
  selector: 'cma-path-card',
  imports: [RouterLink, IconComponent],
  template: `
    <article class="cma-path-card cma-card h-100">
      <span class="cma-path-card__icon"><cma-icon [name]="icon()" [size]="22" /></span>
      <h3 class="h6 mb-1">
        <a
          class="stretched-link cma-path-card__link"
          [routerLink]="['/learning-paths', path().slug]"
          >{{ path().title }}</a
        >
      </h3>
      <p class="cma-path-card__tagline mb-3">{{ path().tagline }}</p>
      <dl class="cma-path-card__meta">
        <div>
          <dt>Stages</dt>
          <dd>{{ path().stageCount }}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>≈ {{ path().estimatedHours }} h</dd>
        </div>
        <div>
          <dt>Level</dt>
          <dd>{{ level() }}</dd>
        </div>
      </dl>
    </article>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .cma-path-card {
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 1.125rem;
    }
    .cma-path-card__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 0.75rem;
      margin-bottom: 0.875rem;
      color: var(--cma-accent);
      background: var(--cma-accent-soft);
    }
    .cma-path-card__link {
      color: var(--cma-text);
      text-decoration: none;
    }
    .cma-path-card__link:hover {
      color: var(--cma-accent);
    }
    .cma-path-card__tagline {
      font-size: 0.9rem;
      color: var(--cma-text-secondary);
      flex: 1;
    }
    .cma-path-card__meta {
      display: flex;
      gap: 1.25rem;
      margin: 0;
      font-size: 0.8125rem;
    }
    .cma-path-card__meta dt {
      font-weight: 500;
      color: var(--cma-text-muted);
    }
    .cma-path-card__meta dd {
      margin: 0;
      font-weight: 600;
      color: var(--cma-text);
    }
  `,
})
export class PathCardComponent {
  readonly path = input.required<LearningPathSummary>();
  protected readonly level = computed(() => DIFFICULTY_LABEL[this.path().level]);
  protected icon(): UiIconName {
    return this.path().icon as UiIconName;
  }
}
