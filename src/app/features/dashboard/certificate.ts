import { Component, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SITE_CONFIG } from '../../core/config/site-config';
import { IconComponent } from '../../shared/components/icon/icon';
import { PlatformService } from '../../core/services/platform.service';

/**
 * Self-issued completion certificate for a learning path. It is generated in the browser from local
 * progress data and says so on its face; it is not verified or signed by anyone.
 */
@Component({
  selector: 'cma-certificate',
  imports: [DatePipe, IconComponent],
  template: `
    <div
      class="cma-certificate"
      role="img"
      [attr.aria-label]="'Certificate of completion for ' + pathTitle() + ' issued to ' + learner()"
    >
      <div class="cma-certificate__inner">
        <p class="cma-certificate__brand">{{ site.name }}</p>
        <p class="cma-certificate__eyebrow">Certificate of completion</p>
        <h2 class="cma-certificate__name">{{ learner() }}</h2>
        <p class="cma-certificate__text">completed every published lesson of the</p>
        <p class="cma-certificate__path">{{ pathTitle() }} learning path</p>
        <p class="cma-certificate__meta">
          {{ lessons() }} lessons · ≈ {{ hours() }} hours · {{ completedOn() | date: 'd MMMM y' }}
        </p>
        <p class="cma-certificate__disclaimer">
          A keepsake made from the lessons you marked as done in this browser. This is not an
          official school or job certificate.
        </p>
      </div>
    </div>
    <div class="d-flex gap-2 mt-3 cma-certificate__actions">
      <button type="button" class="btn btn-outline-secondary btn-sm" (click)="print()">
        <cma-icon name="printer" [size]="14" /> Print or save as PDF
      </button>
    </div>
  `,
  styles: `
    .cma-certificate {
      padding: 0.75rem;
      border: 2px solid var(--cma-accent);
      border-radius: var(--cma-radius-lg);
      background: var(--cma-surface);
    }
    .cma-certificate__inner {
      padding: 2rem 1.5rem;
      border: 1px solid var(--cma-border);
      border-radius: var(--cma-radius);
      text-align: center;
    }
    .cma-certificate__brand {
      font-weight: 700;
      letter-spacing: 0.04em;
      margin-bottom: 1.25rem;
    }
    .cma-certificate__eyebrow {
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--cma-text-secondary);
      margin-bottom: 0.5rem;
    }
    .cma-certificate__name {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    .cma-certificate__text {
      color: var(--cma-text-secondary);
      margin-bottom: 0.25rem;
    }
    .cma-certificate__path {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--cma-accent);
      margin-bottom: 0.5rem;
    }
    .cma-certificate__meta {
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
    .cma-certificate__disclaimer {
      font-size: 0.75rem;
      color: var(--cma-text-muted);
      margin: 0;
    }
    @media print {
      .cma-certificate__actions {
        display: none !important;
      }
    }
  `,
})
export class CertificateComponent {
  readonly learner = input.required<string>();
  readonly pathTitle = input.required<string>();
  readonly lessons = input(0);
  readonly hours = input(0);
  readonly completedOn = input<string>(new Date().toISOString());
  protected readonly site = inject(SITE_CONFIG);
  private readonly platform = inject(PlatformService);

  protected print(): void {
    if (this.platform.isBrowser) window.print();
  }
}
