import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { parseInlineMarkup, type InlineNode } from '../../../../content-schema/inline-markup';

interface InternalLink {
  path: string;
  fragment?: string;
}

/**
 * Renders inline markup (**bold**, *italic*, `code`, [text](href)) as real elements.
 * Internal links use the router; external links open in a new tab with rel="noopener".
 */
@Component({
  selector: 'cma-inline',
  imports: [RouterLink],
  template: `@for (node of resolved(); track $index) {@switch (node.kind) {@case ('text') {{{ node.text }}}@case ('code') {<code>{{ node.text }}</code>}@case ('strong') {<strong><cma-inline [nodes]="node.children" /></strong>}@case ('em') {<em><cma-inline [nodes]="node.children" /></em>}@case ('link') {@if (internal(node.href); as link) {<a [routerLink]="link.path" [fragment]="link.fragment">
        <cma-inline [nodes]="node.children" /></a>} @else if (node.href.startsWith('#')) {<a [href]="node.href"><cma-inline [nodes]="node.children" /></a>} @else {<a [href]="node.href" rel="noopener noreferrer" target="_blank"><cma-inline [nodes]="node.children" /></a>}}}}`,
})
export class InlineMarkupComponent {
  /** Raw markup string; parsed on the fly. */
  readonly text = input<string>();
  /** Already parsed nodes (used for recursion). */
  readonly nodes = input<InlineNode[]>();
  protected readonly resolved = computed(() => this.nodes() ?? parseInlineMarkup(this.text() ?? ''));

  protected internal(href: string): InternalLink | null {
    if (!href.startsWith('/')) return null;
    const [path, fragment] = href.split('#');
    return fragment ? { path, fragment } : { path };
  }
}
