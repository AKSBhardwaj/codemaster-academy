import { Injectable, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { AUTH_PROVIDER, AuthError, type DemoUser } from './auth.provider';
import { PlatformService } from './platform.service';

/** Current demo user. Restored after the first render so prerendered pages hydrate without mismatches. */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly provider = inject(AUTH_PROVIDER);
  readonly user = signal<DemoUser | null>(null);
  readonly hydrated = signal(false);
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly firstName = computed(() => this.user()?.name.split(' ')[0] ?? '');

  constructor() {
    const injector = inject(Injector);
    if (inject(PlatformService).isBrowser) {
      afterNextRender(() => void this.restore(), { injector });
    }
  }

  async restore(): Promise<void> {
    try {
      this.user.set(await this.provider.restore());
    } finally {
      this.hydrated.set(true);
    }
  }

  async register(name: string, email: string, password: string): Promise<void> {
    this.user.set(await this.provider.register(name, email, password));
  }

  async login(email: string, password: string): Promise<void> {
    this.user.set(await this.provider.login(email, password));
  }

  async logout(): Promise<void> {
    await this.provider.logout();
    this.user.set(null);
  }

  async updateProfile(patch: Partial<Pick<DemoUser, 'name' | 'email'>>): Promise<void> {
    this.user.set(await this.provider.updateProfile(patch));
  }

  async deleteAccount(): Promise<void> {
    await this.provider.deleteAccount();
    this.user.set(null);
  }

  /** Message safe to show to the learner. */
  static messageFor(error: unknown): string {
    return error instanceof AuthError ? error.message : 'Something went wrong. Please try again.';
  }
}
