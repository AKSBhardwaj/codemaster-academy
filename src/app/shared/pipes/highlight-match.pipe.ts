import { Pipe, PipeTransform } from '@angular/core';

export interface TextSegment {
  text: string;
  match: boolean;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Splits text into matched / unmatched segments for the given terms so templates can render <mark>
 * elements without innerHTML. Matching is case-insensitive and prefix-based (like the search itself).
 */
@Pipe({ name: 'highlightMatch' })
export class HighlightMatchPipe implements PipeTransform {
  transform(text: string, terms: readonly string[] | null | undefined): TextSegment[] {
    const cleaned = (terms ?? []).map((term) => term.trim()).filter((term) => term.length > 1);
    if (!text || cleaned.length === 0) return [{ text, match: false }];
    const pattern = new RegExp(`(${cleaned.map(escapeRegExp).join('|')})`, 'gi');
    const segments: TextSegment[] = [];
    let last = 0;
    for (const found of text.matchAll(pattern)) {
      const index = found.index ?? 0;
      if (index > last) segments.push({ text: text.slice(last, index), match: false });
      segments.push({ text: found[0], match: true });
      last = index + found[0].length;
    }
    if (last < text.length) segments.push({ text: text.slice(last), match: false });
    return segments;
  }
}
