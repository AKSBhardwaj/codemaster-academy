import { Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { redirectGuestAfterHydration } from '../../core/guards/auth.guard';
import { AuthStore } from '../../core/services/auth.store';
import { BookmarkStore } from '../../core/services/bookmark.store';
import { ExerciseStore } from '../../core/services/exercise.store';
import { PathStore } from '../../core/services/path.store';
import { PersistenceService } from '../../core/services/persistence.service';
import { PlatformService } from '../../core/services/platform.service';
import { ProgressStore } from '../../core/services/progress.store';
import { QuizStore } from '../../core/services/quiz.store';
import { RecentStore } from '../../core/services/recent.store';
import { IconComponent } from '../../shared/components/icon/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { DemoNoticeComponent } from '../authentication/demo-notice';

@Component({
  selector: 'cma-profile',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    IconComponent,
    PageHeaderComponent,
    DemoNoticeComponent,
  ],
  templateUrl: './profile.html',
})
export class ProfilePage {
  protected readonly auth = inject(AuthStore);
  protected readonly progress = inject(ProgressStore);
  protected readonly exercises = inject(ExerciseStore);
  protected readonly quizzes = inject(QuizStore);
  protected readonly bookmarks = inject(BookmarkStore);
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected readonly submitted = signal(false);
  protected readonly confirmReset = signal(false);
  protected readonly confirmDelete = signal(false);
  private readonly recent = inject(RecentStore);
  private readonly paths = inject(PathStore);
  private readonly persistence = inject(PersistenceService);
  private readonly platform = inject(PlatformService);
  private readonly router = inject(Router);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    redirectGuestAfterHydration('/profile');
    effect(() => {
      const user = this.auth.user();
      if (user) this.form.patchValue({ name: user.name, email: user.email }, { emitEvent: false });
    });
  }

  /** Number of entries this site keeps in localStorage; re-read on every render so resets are reflected. */
  protected storedKeys(): number {
    return this.platform.isBrowser
      ? Object.keys(localStorage).filter((k) => k.startsWith(this.persistence.prefix)).length
      : 0;
  }

  protected async save(): Promise<void> {
    this.submitted.set(true);
    this.message.set('');
    this.error.set('');
    if (this.form.invalid) return;
    try {
      await this.auth.updateProfile(this.form.getRawValue());
      this.message.set('Profile updated.');
    } catch (error) {
      this.error.set(AuthStore.messageFor(error));
    }
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/');
  }

  protected exportData(): void {
    if (!this.platform.isBrowser) return;
    const data: Record<string, unknown> = {};
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(this.persistence.prefix) && !key.includes('auth:'))
        data[key] = this.persistence.read(key.slice(this.persistence.prefix.length), null);
    }
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'codemaster-academy-data.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  protected resetLearningData(): void {
    this.progress.reset();
    this.exercises.reset();
    this.quizzes.reset();
    this.bookmarks.reset();
    this.recent.reset();
    this.paths.reset();
    this.confirmReset.set(false);
    this.message.set('Learning data in this browser was reset.');
  }

  protected async deleteAccount(): Promise<void> {
    this.resetLearningData();
    await this.auth.deleteAccount();
    await this.router.navigateByUrl('/');
  }
}
