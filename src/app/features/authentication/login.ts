import { Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/services/auth.store';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { DemoNoticeComponent } from './demo-notice';

@Component({
  selector: 'cma-login',
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent, DemoNoticeComponent],
  templateUrl: './login.html',
})
export class LoginPage {
  /** Where to go after logging in (bound from the query string). */
  readonly returnUrl = input<string | undefined>(undefined);
  protected readonly auth = inject(AuthStore);
  protected readonly error = signal('');
  protected readonly busy = signal(false);
  protected readonly submitted = signal(false);
  private readonly router = inject(Router);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    effect(() => {
      if (this.auth.hydrated() && this.auth.isAuthenticated())
        void this.router.navigateByUrl(this.target());
    });
  }

  protected async submit(): Promise<void> {
    this.submitted.set(true);
    this.error.set('');
    if (this.form.invalid) return;
    this.busy.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      await this.router.navigateByUrl(this.target());
    } catch (error) {
      this.error.set(AuthStore.messageFor(error));
    } finally {
      this.busy.set(false);
    }
  }

  private target(): string {
    const url = this.returnUrl();
    return url && url.startsWith('/') ? url : '/dashboard';
  }
}
