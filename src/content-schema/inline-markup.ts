/**
 * Minimal inline markup used inside lesson text: **bold**, *italic*, `code` and [text](href).
 * Parsed into a small AST that the application renders as real elements (never innerHTML)
 * and that the compiler inspects to validate links. No dependencies on purpose.
 */
export type InlineNode =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'strong'; children: InlineNode[] }
  | { kind: 'em'; children: InlineNode[] }
  | { kind: 'link'; href: string; children: InlineNode[] };

const LINK_PATTERN = /^\[([^\]\n]+)\]\(([^)\s]+)\)/;

export function parseInlineMarkup(input: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let buffer = '';
  const flush = (): void => {
    if (buffer) {
      nodes.push({ kind: 'text', text: buffer });
      buffer = '';
    }
  };
  let i = 0;
  while (i < input.length) {
    const rest = input.slice(i);
    if (rest.startsWith('`')) {
      const end = input.indexOf('`', i + 1);
      if (end > i + 1) {
        flush();
        nodes.push({ kind: 'code', text: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (rest.startsWith('**')) {
      const end = input.indexOf('**', i + 2);
      if (end > i + 2) {
        flush();
        nodes.push({ kind: 'strong', children: parseInlineMarkup(input.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    if (rest.startsWith('*') && !rest.startsWith('**')) {
      const end = input.indexOf('*', i + 1);
      if (end > i + 1 && input[end + 1] !== '*') {
        flush();
        nodes.push({ kind: 'em', children: parseInlineMarkup(input.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }
    if (rest.startsWith('[')) {
      const match = LINK_PATTERN.exec(rest);
      if (match) {
        flush();
        nodes.push({ kind: 'link', href: match[2], children: parseInlineMarkup(match[1]) });
        i += match[0].length;
        continue;
      }
    }
    buffer += input[i];
    i++;
  }
  flush();
  return nodes;
}

/** All link targets contained in a markup string (including nested ones). */
export function collectInlineLinks(input: string): string[] {
  const links: string[] = [];
  const walk = (nodes: InlineNode[]): void => {
    for (const node of nodes) {
      if (node.kind === 'link') links.push(node.href);
      if ('children' in node) walk(node.children);
    }
  };
  walk(parseInlineMarkup(input));
  return links;
}

/** Plain text with the markup removed (used for excerpts, search and reading time). */
export function stripInlineMarkup(input: string): string {
  const walk = (nodes: InlineNode[]): string =>
    nodes.map((node) => ('children' in node ? walk(node.children) : node.text)).join('');
  return walk(parseInlineMarkup(input));
}
