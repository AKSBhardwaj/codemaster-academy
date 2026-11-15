import type { Extension } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

export type LanguageModule = typeof import('@codemirror/language');
export type Tags = typeof import('@lezer/highlight').tags;

/** Theme + syntax colours for the requested colour scheme. Both keep every token at or above 4.5:1 contrast. */
export function editorTheme(
  dark: boolean,
  view: typeof EditorView,
  language: LanguageModule,
  t: Tags,
): Extension {
  return dark ? darkTheme(view, language, t) : lightTheme(view, language, t);
}

/** Light editor theme: 700 shades of the palette on the surface and on the highlighted active line. */
function lightTheme(view: typeof EditorView, language: LanguageModule, t: Tags): Extension {
  return [
    view.theme(
      {
        '&': { backgroundColor: 'var(--cma-surface)', color: 'var(--cma-text)' },
        '.cm-gutters': {
          backgroundColor: 'var(--cma-bg-secondary)',
          color: 'var(--cma-text-muted)',
          borderRight: '1px solid var(--cma-border)',
        },
        '.cm-activeLine': { backgroundColor: 'rgba(37, 99, 235, 0.06)' },
        '.cm-activeLineGutter': { backgroundColor: 'rgba(37, 99, 235, 0.08)' },
        '&.cm-focused': { outline: 'none' },
      },
      { dark: false },
    ),
    language.syntaxHighlighting(
      language.HighlightStyle.define([
        { tag: t.keyword, color: '#7c3aed' },
        { tag: [t.tagName, t.typeName, t.className, t.namespace], color: '#047857' },
        { tag: t.attributeName, color: '#b45309' },
        { tag: [t.string, t.special(t.string), t.regexp], color: '#b91c1c' },
        { tag: [t.number, t.bool, t.atom, t.null], color: '#0369a1' },
        {
          tag: [
            t.function(t.variableName),
            t.function(t.propertyName),
            t.propertyName,
            t.labelName,
          ],
          color: '#1d4ed8',
        },
        {
          tag: [t.comment, t.meta, t.documentMeta, t.processingInstruction],
          color: '#5b6b80',
          fontStyle: 'italic',
        },
        { tag: t.invalid, color: '#b91c1c', textDecoration: 'underline' },
        { tag: t.heading, fontWeight: 'bold' },
        { tag: t.emphasis, fontStyle: 'italic' },
        { tag: t.strong, fontWeight: 'bold' },
        { tag: t.link, color: '#1d4ed8', textDecoration: 'underline' },
      ]),
    ),
  ];
}

/** Dark editor theme on the shared code surface: 300 shades stay above 4.5:1 on the dark background. */
function darkTheme(view: typeof EditorView, language: LanguageModule, t: Tags): Extension {
  return [
    view.theme(
      {
        '&': { backgroundColor: 'var(--cma-code-bg)', color: 'var(--cma-code-text)' },
        '.cm-content': { caretColor: '#f8fafc' },
        '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#f8fafc' },
        '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
          {
            backgroundColor: 'rgba(96, 165, 250, 0.35)',
          },
        '.cm-gutters': {
          backgroundColor: '#111827',
          color: '#94a3b8',
          borderRight: '1px solid #273449',
        },
        '.cm-activeLine': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
        '.cm-activeLineGutter': { backgroundColor: 'rgba(255, 255, 255, 0.07)', color: '#e2e8f0' },
        '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
          backgroundColor: 'rgba(96, 165, 250, 0.25)',
        },
        '.cm-searchMatch': { backgroundColor: 'rgba(251, 191, 36, 0.3)' },
        '.cm-selectionMatch': { backgroundColor: 'rgba(96, 165, 250, 0.2)' },
        '.cm-foldPlaceholder': { backgroundColor: '#334155', color: '#e2e8f0', border: 'none' },
        '.cm-tooltip': {
          backgroundColor: '#1e293b',
          color: '#e2e8f0',
          border: '1px solid #273449',
        },
        '.cm-tooltip-autocomplete ul li[aria-selected]': {
          backgroundColor: '#334155',
          color: '#f8fafc',
        },
        '.cm-panels': { backgroundColor: '#111827', color: '#e2e8f0' },
        '&.cm-focused': { outline: 'none' },
      },
      { dark: true },
    ),
    language.syntaxHighlighting(
      language.HighlightStyle.define([
        { tag: t.keyword, color: '#c4b5fd' },
        { tag: [t.tagName, t.typeName, t.className, t.namespace], color: '#6ee7b7' },
        { tag: t.attributeName, color: '#fcd34d' },
        { tag: [t.string, t.special(t.string), t.regexp], color: '#fca5a5' },
        { tag: [t.number, t.bool, t.atom, t.null], color: '#7dd3fc' },
        {
          tag: [
            t.function(t.variableName),
            t.function(t.propertyName),
            t.propertyName,
            t.labelName,
          ],
          color: '#93c5fd',
        },
        {
          tag: [t.comment, t.meta, t.documentMeta, t.processingInstruction],
          color: '#94a3b8',
          fontStyle: 'italic',
        },
        { tag: t.invalid, color: '#fca5a5', textDecoration: 'underline' },
        { tag: t.heading, fontWeight: 'bold' },
        { tag: t.emphasis, fontStyle: 'italic' },
        { tag: t.strong, fontWeight: 'bold' },
        { tag: t.link, color: '#93c5fd', textDecoration: 'underline' },
      ]),
    ),
  ];
}
