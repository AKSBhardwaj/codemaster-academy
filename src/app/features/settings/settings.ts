import { Component, afterNextRender, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BookmarkStore } from '../../core/services/bookmark.store';
import { ExerciseStore } from '../../core/services/exercise.store';
import { LearnerStore } from '../../core/services/learner.store';
import { PathStore } from '../../core/services/path.store';
import { PersistenceService } from '../../core/services/persistence.service';
import { PlatformService } from '../../core/services/platform.service';
import { ProgressStore } from '../../core/services/progress.store';
import { QuizStore } from '../../core/services/quiz.store';
import { RecentStore } from '../../core/services/recent.store';
import { SearchUiStore } from '../../core/services/search-ui.store';
import { ThemeStore } from '../../core/services/theme.store';
import { IconComponent } from '../../shared/components/icon/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

@Component({
  selector: 'cma-settings',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, PageHeaderComponent],
  templateUrl: './settings.html',
})
export class SettingsPage {
  protected readonly learner = inject(LearnerStore);
  protected readonly progress = inject(ProgressStore);
  protected readonly exercises = inject(ExerciseStore);
  protected readonly bookmarks = inject(BookmarkStore);
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected readonly submitted = signal(false);
  protected readonly confirmReset = signal(false);
  protected readonly confirmClear = signal(false);
  protected readonly interactive = signal(false);
  private readonly rendered = signal(false);
  private readonly quizzes = inject(QuizStore);
  private readonly recent = inject(RecentStore);
  private readonly paths = inject(PathStore);
  private readonly searches = inject(SearchUiStore);
  private readonly theme = inject(ThemeStore);
  private readonly persistence = inject(PersistenceService);
  private readonly platform = inject(PlatformService);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    nickname: [{ value: '', disabled: true }, [Validators.maxLength(40)]],
  });

  constructor() {
    afterNextRender(() => this.rendered.set(true));
    effect(() => {
      // Apply saved data before enabling input, regardless of callback registration order.
      if (!this.rendered() || !this.learner.hydrated()) return;
      this.form.patchValue({ nickname: this.learner.nickname() }, { emitEvent: false });
      this.form.enable({ emitEvent: false });
      this.interactive.set(true);
    });
  }

  protected save(): void {
    if (!this.interactive()) return;
    this.submitted.set(true);
    this.message.set('');
    this.error.set('');
    if (this.form.invalid) return;
    const saved = this.learner.setNickname(this.form.getRawValue().nickname);
    if (saved) this.message.set('Nickname saved in this browser.');
    else
      this.error.set(
        'Your browser could not save this name. You can keep learning, but the name may be lost when you close this page.',
      );
  }

  protected exportData(): void {
    if (!this.platform.isBrowser) return;
    const blob = new Blob(
      [
        JSON.stringify(
          { version: 1, exportedAt: new Date().toISOString(), data: this.persistence.snapshot() },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'codemaster-academy-data.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.error.set('');
    this.message.set('Your progress copy is ready to download.');
  }

  protected resetLearningData(): void {
    this.progress.reset();
    this.exercises.reset();
    this.quizzes.reset();
    this.bookmarks.reset();
    this.recent.reset();
    this.paths.reset();
    this.confirmReset.set(false);
    this.error.set('');
    this.message.set('Learning data in this browser was reset.');
  }

  protected clearAllData(): void {
    this.resetLearningData();
    this.learner.reset();
    this.searches.clearRecent();
    this.theme.setPreference('system');
    this.persistence.clearAll();
    this.confirmClear.set(false);
    this.message.set('All saved data for this site was removed from this browser.');
  }
}
