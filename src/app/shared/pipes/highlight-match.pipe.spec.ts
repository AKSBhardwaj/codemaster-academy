import { HighlightMatchPipe } from './highlight-match.pipe';

describe('HighlightMatchPipe', () => {
  const pipe = new HighlightMatchPipe();

  it('returns the whole text unmatched when there are no terms', () => {
    expect(pipe.transform('Angular Tutorial', [])).toEqual([{ text: 'Angular Tutorial', match: false }]);
  });

  it('marks case-insensitive matches and keeps surrounding text', () => {
    expect(pipe.transform('Learn Angular signals', ['angular'])).toEqual([
      { text: 'Learn ', match: false },
      { text: 'Angular', match: true },
      { text: ' signals', match: false },
    ]);
  });

  it('matches several terms and escapes regex characters', () => {
    const segments = pipe.transform('C++ and C# basics', ['c++', 'c#']);
    expect(segments.filter((s) => s.match).map((s) => s.text)).toEqual(['C++', 'C#']);
  });

  it('ignores single-character terms', () => {
    expect(pipe.transform('a b c', ['a'])).toEqual([{ text: 'a b c', match: false }]);
  });
});
