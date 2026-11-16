import { Component, afterNextRender, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SITE_CONFIG } from '../../core/config/site-config';
import { PlatformService } from '../../core/services/platform.service';
import { IconComponent } from '../../shared/components/icon/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

/**
 * Prepare feedback locally. Email is offered only when a real contact address is configured.
 */
@Component({
  selector: 'cma-contact',
  imports: [ReactiveFormsModule, IconComponent, PageHeaderComponent],
  templateUrl: './contact.html',
})
export class ContactPage {
  protected readonly site = inject(SITE_CONFIG);
  protected readonly submitted = signal(false);
  protected readonly message = signal('');
  protected readonly draft = signal('');
  protected readonly interactive = signal(false);
  protected readonly canEmail =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.site.contactEmail) &&
    !/\.(example|invalid|test|localhost)$/i.test(this.site.contactEmail);
  private readonly platform = inject(PlatformService);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.maxLength(80)]],
    topic: ['correction', [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
  });

  constructor() {
    this.form.disable({ emitEvent: false });
    afterNextRender(() => {
      this.form.enable({ emitEvent: false });
      this.interactive.set(true);
    });
  }

  protected submit(): void {
    this.submitted.set(true);
    this.form.controls.message.setValue(this.form.controls.message.value.trim());
    if (this.form.invalid) return;
    const { name, topic, message } = this.form.getRawValue();
    this.draft.set(
      `CodeMaster Academy feedback\nTopic: ${topic}\nFrom: ${name.trim() || 'A learner'}\n\n${message.trim()}`,
    );
    this.message.set('Your message is ready below. Nothing has been sent.');
  }

  protected async copyDraft(): Promise<void> {
    if (!this.platform.isBrowser) return;
    try {
      await navigator.clipboard.writeText(this.draft());
      this.message.set('Message copied. You can paste it where you want to share it.');
    } catch {
      this.message.set(
        'Copy is not available here. Select the message below and copy it, or download it.',
      );
    }
  }

  protected downloadDraft(): void {
    if (!this.platform.isBrowser) return;
    const url = URL.createObjectURL(new Blob([this.draft()], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'codemaster-feedback.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.message.set('Your message is ready to download. Nothing has been sent.');
  }

  protected emailDraft(): void {
    if (!this.platform.isBrowser || !this.canEmail) return;
    window.location.href = `mailto:${this.site.contactEmail}?subject=${encodeURIComponent('CodeMaster Academy feedback')}&body=${encodeURIComponent(this.draft())}`;
    this.message.set('Your email app should open. Check the message there before sending it.');
  }
}
