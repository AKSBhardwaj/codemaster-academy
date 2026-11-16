/**
 * Build-time syntax highlighting with Shiki. Tokens are emitted as [text, cssClass] tuples so the
 * application renders highlighted code from data (no runtime highlighter, no innerHTML, identical
 * output during prerendering and client navigation). Colours come from CSS classes defined in
 * src/styles/_code.scss, so light and dark themes switch without re-tokenising.
 */
import { createCssVariablesTheme, createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import type { CodeToken } from '../../src/content-schema/blocks';

const ALIASES: Record<string, string> = {
  js: 'javascript',
  mjs: 'javascript',
  ts: 'typescript',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  console: 'bash',
  'c++': 'cpp',
  cs: 'csharp',
  py: 'python',
  yml: 'yaml',
  md: 'markdown',
  plaintext: 'text',
  plain: 'text',
  txt: 'text',
  output: 'text',
  'objective-c': 'objective-c',
  htm: 'html',
  fortran: 'fortran-free-form',
};

const theme = createCssVariablesTheme({
  name: 'css-variables',
  variablePrefix: '--shiki-',
  fontStyle: true,
});

let highlighterPromise: Promise<HighlighterCore> | undefined;
const loadedLanguages = new Set<string>();
const unavailableLanguages = new Set<string>();

function highlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    themes: [theme],
    langs: [],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighterPromise;
}

export function normaliseLanguage(language: string): string {
  const lower = language.trim().toLowerCase();
  return ALIASES[lower] ?? lower;
}

async function ensureLanguage(lang: string): Promise<boolean> {
  if (lang === 'text') return false;
  if (loadedLanguages.has(lang)) return true;
  if (unavailableLanguages.has(lang)) return false;
  try {
    const grammar = (await import(`@shikijs/langs/${lang}`)) as { default: unknown };
    const core = await highlighter();
    await core.loadLanguage(grammar.default as never);
    loadedLanguages.add(lang);
    return true;
  } catch {
    unavailableLanguages.add(lang);
    return false;
  }
}

/** Languages that could not be highlighted (reported once at the end of the build). */
export function unavailableHighlightLanguages(): string[] {
  return [...unavailableLanguages].sort();
}

const FONT_ITALIC = 1;
const FONT_BOLD = 2;
const FONT_UNDERLINE = 4;

function classFor(color: string | undefined, fontStyle: number | undefined): string | undefined {
  const classes: string[] = [];
  const match = color ? /--shiki-token-([a-z-]+)/.exec(color) : null;
  if (match) classes.push(`tk-${match[1]}`);
  if (fontStyle) {
    if (fontStyle & FONT_ITALIC) classes.push('tk-i');
    if (fontStyle & FONT_BOLD) classes.push('tk-b');
    if (fontStyle & FONT_UNDERLINE) classes.push('tk-u');
  }
  return classes.length ? classes.join(' ') : undefined;
}

function plainTokens(code: string): CodeToken[][] {
  return code.split('\n').map((line) => (line ? [[line]] : []));
}

/** Tokenises code into lines of [text, class?] tuples; unknown languages fall back to plain text. */
export async function tokenise(code: string, language: string): Promise<CodeToken[][]> {
  const lang = normaliseLanguage(language);
  if (!(await ensureLanguage(lang))) return plainTokens(code);
  const core = await highlighter();
  const { tokens } = core.codeToTokens(code, { lang, theme: 'css-variables' });
  return tokens.map((line) =>
    line.map((token) => {
      const cls = classFor(token.color, token.fontStyle);
      return cls ? [token.content, cls] : [token.content];
    }),
  );
}
