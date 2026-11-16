import {
  Component,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type {
  PlaygroundConfig,
  PlaygroundLanguage,
  PlaygroundTemplate,
} from '../../../content-schema/playground';
import { ContentService } from '../../core/services/content.service';
import { PersistenceService } from '../../core/services/persistence.service';
import { PlatformService } from '../../core/services/platform.service';
import { CodeEditorComponent } from '../../shared/components/code-editor/code-editor';
import { IconComponent } from '../../shared/components/icon/icon';
import { CAPABILITY_LABEL } from './engines/execution-engine';
import { ExecutionService } from './engines/execution.service';
import { SqlJsEngine } from './engines/sqljs.engine';
import { OutputPanelComponent } from './output-panel/output-panel';
import { PlaygroundHandoffService } from './playground-handoff.service';
import { RunSession } from './run-session';

const DRAFT_KEY = 'playground:drafts';

@Component({
  selector: 'cma-playground',
  imports: [RouterLink, CodeEditorComponent, OutputPanelComponent, IconComponent],
  templateUrl: './playground.html',
  styleUrl: './playground.scss',
  host: {
    '[class.cma-playground-host--fullscreen]': 'fullscreen()',
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class PlaygroundPage {
  /** Query parameters bound by the router. */
  readonly lang = input<string | undefined>(undefined);
  readonly template = input<string | undefined>(undefined);

  protected readonly session = new RunSession();
  protected readonly execution = inject(ExecutionService);
  protected readonly capabilityLabel = CAPABILITY_LABEL;
  protected readonly languageId = signal('html');
  protected readonly code = signal('');
  protected readonly templateId = signal('');
  protected readonly fullscreen = signal(false);
  protected readonly copied = signal(false);
  protected readonly showSchema = signal(false);
  protected readonly interactive = signal(false);

  private readonly content = inject(ContentService);
  private readonly persistence = inject(PersistenceService);
  private readonly platform = inject(PlatformService);
  private readonly handoff = inject(PlaygroundHandoffService);
  private readonly router = inject(Router);
  private readonly sql = inject(SqlJsEngine);
  private readonly output = viewChild(OutputPanelComponent);
  private readonly editor = viewChild(CodeEditorComponent);
  private drafts: Record<string, string> = {};
  private initialised = false;

  protected readonly configResource = resource({
    loader: () => this.content.load<PlaygroundConfig>('site/playground.json'),
  });
  protected readonly config = computed(() =>
    this.configResource.hasValue()
      ? this.configResource.value()
      : this.content.peek<PlaygroundConfig>('site/playground.json'),
  );
  protected readonly languages = computed<PlaygroundLanguage[]>(
    () => this.config()?.languages ?? [],
  );
  protected readonly language = computed(() =>
    this.languages().find((l) => l.id === this.languageId()),
  );
  protected readonly templates = computed<PlaygroundTemplate[]>(
    () => this.language()?.templates ?? [],
  );
  protected readonly capability = computed(
    () => this.language()?.capability ?? this.execution.capabilityFor(this.languageId()),
  );
  protected readonly canRun = computed(
    () => this.capability() === 'browser' || this.capability() === 'wasm',
  );
  protected readonly showPreview = computed(
    () => this.languageId() !== 'sql' && this.capability() === 'browser',
  );
  protected readonly schema = computed(() => this.config()?.sqlSchemaSummary ?? []);

  constructor() {
    // Native select changes must wait until their handlers are attached.
    afterNextRender(() => this.interactive.set(true));
    effect(() => {
      const config = this.config();
      if (!config || this.initialised || !this.platform.isBrowser) return;
      this.initialised = true;
      this.sql.setupSql = config.sqlSetup;
      this.drafts = this.persistence.read<Record<string, string>>(DRAFT_KEY, {});
      const requested = (this.lang() ?? 'html').toLowerCase();
      const language = config.languages.find((l) => l.id === requested) ?? config.languages[0];
      const handoff = this.handoff.take();
      this.languageId.set(language.id);
      if (handoff && handoff.language === language.id) {
        this.code.set(handoff.code);
        this.templateId.set('');
      } else {
        const template =
          language.templates.find((t) => t.id === this.template()) ?? language.templates[0];
        this.templateId.set(template.id);
        this.code.set(this.drafts[language.id] ?? template.code);
      }
    });
    effect(() => {
      // Persist drafts per language while typing.
      const code = this.code();
      const id = this.languageId();
      if (!this.initialised) return;
      this.drafts = { ...this.drafts, [id]: code };
      this.persistence.write(DRAFT_KEY, this.drafts);
    });
  }

  protected selectLanguage(id: string): void {
    const language = this.languages().find((l) => l.id === id);
    if (!language) return;
    this.session.reset();
    this.languageId.set(language.id);
    const template = language.templates[0];
    this.templateId.set(template.id);
    this.code.set(this.drafts[language.id] ?? template.code);
    void this.router.navigate([], { queryParams: { lang: language.id }, replaceUrl: true });
  }

  protected selectTemplate(id: string): void {
    const template = this.templates().find((t) => t.id === id);
    if (!template) return;
    this.templateId.set(template.id);
    this.code.set(template.code);
    this.session.reset();
  }

  protected run(): void {
    if (!this.canRun()) {
      this.session.run(this.languageId(), this.code());
      return;
    }
    this.session.run(this.languageId(), this.code(), this.output()?.host);
  }

  protected stop(): void {
    this.session.stop();
  }

  protected reset(): void {
    const template =
      this.templates().find((t) => t.id === this.templateId()) ?? this.templates()[0];
    if (template) this.code.set(template.code);
    this.session.reset();
    this.editor()?.focus();
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1600);
    } catch {
      this.copied.set(false);
    }
  }

  protected toggleFullscreen(): void {
    this.fullscreen.update((value) => !value);
  }

  protected onKeydown(event: Event): void {
    const key = event as KeyboardEvent;
    if ((key.ctrlKey || key.metaKey) && key.key === 'Enter') {
      key.preventDefault();
      this.run();
    } else if (key.key === 'Escape' && this.fullscreen()) {
      this.fullscreen.set(false);
    }
  }
}
