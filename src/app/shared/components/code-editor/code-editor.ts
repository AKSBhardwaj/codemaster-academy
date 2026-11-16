import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import type { EditorView } from '@codemirror/view';
import type { Compartment } from '@codemirror/state';
import { PlatformService } from '../../../core/services/platform.service';
import { ThemeStore } from '../../../core/services/theme.store';

import { editorTheme, type LanguageModule, type Tags } from './code-editor-themes';

type Extension = import('@codemirror/state').Extension;

const LANGUAGE_LOADERS: Record<string, () => Promise<Extension>> = {
  html: () => import('@codemirror/lang-html').then((m) => m.html()),
  css: () => import('@codemirror/lang-css').then((m) => m.css()),
  javascript: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
  typescript: () =>
    import('@codemirror/lang-javascript').then((m) => m.javascript({ typescript: true })),
  jsx: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ jsx: true })),
  json: () => import('@codemirror/lang-json').then((m) => m.json()),
  sql: () => import('@codemirror/lang-sql').then((m) => m.sql({ dialect: m.SQLite })),
  python: () => import('@codemirror/lang-python').then((m) => m.python()),
  java: () => import('@codemirror/lang-java').then((m) => m.java()),
  cpp: () => import('@codemirror/lang-cpp').then((m) => m.cpp()),
  c: () => import('@codemirror/lang-cpp').then((m) => m.cpp()),
  csharp: () => import('@codemirror/lang-cpp').then((m) => m.cpp()),
  php: () => import('@codemirror/lang-php').then((m) => m.php()),
  go: () => import('@codemirror/lang-go').then((m) => m.go()),
  rust: () => import('@codemirror/lang-rust').then((m) => m.rust()),
  markdown: () => import('@codemirror/lang-markdown').then((m) => m.markdown()),
};

/**
 * CodeMirror 6 editor loaded lazily on the client. The prerendered textarea is readable but read-only
 * until its input handler is attached. Edits made while CodeMirror loads are kept in the value model.
 */
@Component({
  selector: 'cma-code-editor',
  template: `
    <div class="cma-editor" [class.cma-editor--ready]="ready()" [style.min-height.px]="minHeight()">
      <textarea
        #fallback
        class="cma-editor__fallback"
        [class.d-none]="ready()"
        [attr.aria-label]="label()"
        [value]="value()"
        [readonly]="!interactive() || readOnly()"
        (input)="onFallbackInput($event)"
        spellcheck="false"
      ></textarea>
      <div #host class="cma-editor__host"></div>
    </div>
  `,
  styles: `
    .cma-editor {
      position: relative;
      border: 1px solid var(--cma-border);
      border-radius: var(--cma-radius);
      overflow: hidden;
      background: var(--cma-surface);
    }
    .cma-editor__fallback {
      display: block;
      width: 100%;
      min-height: inherit;
      border: 0;
      padding: 0.75rem;
      font-family: var(--bs-font-monospace);
      font-size: 0.875rem;
      line-height: 1.6;
      background: transparent;
      color: var(--cma-text);
      resize: vertical;
    }
    .cma-editor__host :global(.cm-editor) {
      height: 100%;
    }
  `,
})
export class CodeEditorComponent {
  readonly value = model('');
  readonly language = input('html');
  readonly readOnly = input(false);
  readonly minHeight = input(240);
  readonly label = input('Code editor');
  protected readonly ready = signal(false);
  protected readonly interactive = signal(false);

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private readonly fallback = viewChild.required<ElementRef<HTMLTextAreaElement>>('fallback');
  private readonly platform = inject(PlatformService);
  private readonly theme = inject(ThemeStore);
  private readonly injector = inject(Injector);
  private view: EditorView | undefined;
  private languageCompartment: Compartment | undefined;
  private themeCompartment: Compartment | undefined;
  private inputOptionsCompartment: Compartment | undefined;
  private modules:
    | {
        EditorView: typeof EditorView;
        EditorState: typeof import('@codemirror/state').EditorState;
        language: LanguageModule;
        tags: Tags;
      }
    | undefined;
  private lastExternalValue = '';

  constructor() {
    if (this.platform.isBrowser) {
      afterNextRender(
        () => {
          this.interactive.set(true);
          void this.mount();
        },
        { injector: this.injector },
      );
    }
    inject(DestroyRef).onDestroy(() => this.view?.destroy());
    // Keep the editor in sync with programmatic value changes (template switch, reset).
    effect(() => {
      const value = this.value();
      if (!this.view || value === this.lastExternalValue) return;
      const current = this.view.state.doc.toString();
      if (current !== value) {
        this.view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
      }
      this.lastExternalValue = value;
    });
    effect(() => {
      const language = this.language();
      if (this.view && this.languageCompartment) void this.setLanguage(language);
    });
    effect(() => {
      const dark = this.theme.resolved() === 'dark';
      if (this.view && this.themeCompartment && this.modules) {
        this.view.dispatch({
          effects: this.themeCompartment.reconfigure(
            editorTheme(dark, this.modules.EditorView, this.modules.language, this.modules.tags),
          ),
        });
      }
    });
    effect(() => {
      const readOnly = this.readOnly();
      const label = this.label();
      if (this.view && this.inputOptionsCompartment && this.modules) {
        this.view.dispatch({
          effects: this.inputOptionsCompartment.reconfigure([
            this.modules.EditorState.readOnly.of(readOnly),
            this.modules.EditorView.contentAttributes.of({
              'aria-label': label,
              'aria-readonly': String(readOnly),
              tabindex: '0',
            }),
          ]),
        });
      }
    });
  }

  /** Focuses the editor (or the fallback textarea). */
  focus(): void {
    if (this.view) this.view.focus();
    else this.fallback().nativeElement.focus();
  }

  protected onFallbackInput(event: Event): void {
    if (!this.interactive() || this.readOnly()) return;
    this.value.set((event.target as HTMLTextAreaElement).value);
  }

  private async mount(): Promise<void> {
    const [{ EditorView, basicSetup }, { Compartment, EditorState }, languageModule, { tags }] =
      await Promise.all([
        import('codemirror'),
        import('@codemirror/state'),
        import('@codemirror/language'),
        import('@lezer/highlight'),
      ]);
    this.modules = { EditorView, EditorState, language: languageModule, tags };
    this.languageCompartment = new Compartment();
    this.themeCompartment = new Compartment();
    this.inputOptionsCompartment = new Compartment();
    const language = await this.loadLanguage(this.language());
    const dark = this.theme.resolved() === 'dark';
    this.lastExternalValue = this.value();
    this.view = new EditorView({
      parent: this.host().nativeElement,
      state: EditorState.create({
        doc: this.value(),
        extensions: [
          basicSetup,
          this.languageCompartment.of(language),
          this.themeCompartment.of(editorTheme(dark, EditorView, languageModule, tags)),
          // Name the actual textbox, matching the native textarea shown before CodeMirror loads.
          this.inputOptionsCompartment.of([
            EditorState.readOnly.of(this.readOnly()),
            EditorView.contentAttributes.of({
              'aria-label': this.label(),
              'aria-readonly': String(this.readOnly()),
              tabindex: '0',
            }),
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const text = update.state.doc.toString();
              this.lastExternalValue = text;
              this.value.set(text);
            }
          }),
          EditorView.theme({
            '&': { fontSize: '0.875rem' },
            '.cm-scroller': { fontFamily: 'var(--bs-font-monospace)', lineHeight: '1.6' },
            '.cm-content': { minHeight: `${this.minHeight()}px` },
          }),
        ],
      }),
    });
    this.ready.set(true);
  }

  private async loadLanguage(language: string): Promise<Extension> {
    const loader = LANGUAGE_LOADERS[language.toLowerCase()];
    return loader ? loader() : [];
  }

  private async setLanguage(language: string): Promise<void> {
    const extension = await this.loadLanguage(language);
    if (this.view && this.languageCompartment)
      this.view.dispatch({ effects: this.languageCompartment.reconfigure(extension) });
  }
}
