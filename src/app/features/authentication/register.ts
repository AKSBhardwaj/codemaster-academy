import { Component, effect, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  type ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/services/auth.store';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { DemoNoticeComponent } from './demo-notice';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'cma-register',
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent, DemoNoticeComponent],
  templateUrl: './register.html',
})
export class RegisterPage {
  protected readonly auth = inject(AuthStore);
  protected readonly error = signal('');
  protected readonly busy = signal(false);
  protected readonly submitted = signal(false);
  private readonly router = inject(Router);
  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]],
    },
    { validators: passwordsMatch },
  );

  constructor() {
    effect(() => {
      if (this.auth.hydrated() && this.auth.isAuthenticated())
        void this.router.navigateByUrl('/dashboard');
    });
  }

  protected async submit(): Promise<void> {
    this.submitted.set(true);
    this.error.set('');
    if (this.form.invalid) return;
    this.busy.set(true);
    try {
      const { name, email, password } = this.form.getRawValue();
      await this.auth.register(name, email, password);
      await this.router.navigateByUrl('/dashboard');
    } catch (error) {
      this.error.set(AuthStore.messageFor(error));
    } finally {
      this.busy.set(false);
    }
  }
}
