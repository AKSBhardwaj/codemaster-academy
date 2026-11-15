import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SITE_CONFIG } from '../../core/config/site-config';
import { PlatformService } from '../../core/services/platform.service';
import { IconComponent } from '../../shared/components/icon/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

/**
 * Contact form without a backend: the message is handed to the visitor's email application through a
 * mailto link, and the page says so. Nothing is stored or sent by this site.
 */
@Component({
  selector: 'cma-contact',
  imports: [ReactiveFormsModule, IconComponent, PageHeaderComponent],
  templateUrl: './contact.html',
})
export class ContactPage {
  protected readonly site = inject(SITE_CONFIG);
  protected readonly submitted = signal(false);
  protected readonly handedOff = signal(false);
  private readonly platform = inject(PlatformService);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    topic: ['correction', [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
  });
  protected readonly mailto = computed(() => {
    const { name, email, topic, message } = this.form.getRawValue();
    const subject = encodeURIComponent(`[${topic}] Message from ${name || 'a learner'}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name} <${email}>`);
    return `mailto:${this.site.contactEmail}?subject=${subject}&body=${body}`;
  });

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    if (this.platform.isBrowser) window.location.href = this.mailto();
    this.handedOff.set(true);
  }
}
