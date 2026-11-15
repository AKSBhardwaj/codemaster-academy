import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { PersistenceService } from './persistence.service';
import { PlatformService } from './platform.service';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

function isPreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (PREFERENCES as readonly string[]).includes(value);
}

/** Colour theme state. The resolved theme is written to `<html data-bs-theme>`, which drives Bootstrap and the design tokens. */
@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly persistence = inject(PersistenceService);
  private readonly platform = inject(PlatformService);
  private readonly document = inject(DOCUMENT);
  private readonly systemPrefersDark = signal(false);

  readonly preference = signal<ThemePreference>('system');
  readonly resolved = computed<ResolvedTheme>(() => {
    const preference = this.preference();
    if (preference === 'system') return this.systemPrefersDark() ? 'dark' : 'light';
    return preference;
  });
  readonly options: readonly { value: ThemePreference; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  constructor() {
    if (!this.platform.isBrowser) return;
    const stored = this.persistence.read<unknown>(STORAGE_KEY, 'system');
    this.preference.set(isPreference(stored) ? stored : 'system');
    if (typeof window.matchMedia === 'function') {
      const query = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemPrefersDark.set(query.matches);
      query.addEventListener('change', (event) => this.systemPrefersDark.set(event.matches));
    }
    effect(() => {
      this.document.documentElement.setAttribute('data-bs-theme', this.resolved());
    });
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    this.persistence.write(STORAGE_KEY, preference);
  }
}
