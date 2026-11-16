import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PlatformService } from '../../core/services/platform.service';

const KEY = 'cma:playground:handoff';

export interface PlaygroundHandoff {
  language: string;
  code: string;
  title?: string;
}

/** Carries a code snippet from a lesson to the playground via sessionStorage (URLs stay short and shareable). */
@Injectable({ providedIn: 'root' })
export class PlaygroundHandoffService {
  private readonly router = inject(Router);
  private readonly platform = inject(PlatformService);

  open(handoff: PlaygroundHandoff): void {
    if (this.platform.isBrowser) {
      try {
        sessionStorage.setItem(KEY, JSON.stringify(handoff));
      } catch {
        /* storage unavailable: the playground opens with its default template */
      }
    }
    void this.router.navigate(['/playground'], {
      queryParams: { lang: normalise(handoff.language), from: 'lesson' },
    });
  }

  /** Returns and clears a pending handoff. */
  take(): PlaygroundHandoff | null {
    if (!this.platform.isBrowser) return null;
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      sessionStorage.removeItem(KEY);
      const parsed = JSON.parse(raw) as PlaygroundHandoff;
      return typeof parsed.code === 'string' && typeof parsed.language === 'string' ? parsed : null;
    } catch {
      return null;
    }
  }
}

function normalise(language: string): string {
  const lower = language.toLowerCase();
  return lower === 'js' ? 'javascript' : lower;
}
