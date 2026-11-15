import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { ContentBlock } from '../../core/models/content';
import { TutorialContext } from '../../features/technology/tutorial-context';
import { provideTestContent } from '../../testing/content-testing';
import { ContentRendererComponent } from './content-renderer';

const BLOCKS: ContentBlock[] = [
  { type: 'heading', level: 2, text: 'What is HTML?', id: 'what-is-html' },
  { type: 'paragraph', text: 'HTML stands for **HyperText Markup Language**. See [MDN](https://developer.mozilla.org).' },
  { type: 'list', ordered: false, items: ['One', 'Two `code`'] },
  { type: 'code', language: 'html', code: '<p>Hi</p>', tokens: [[['<p>', 'tk-punctuation'], ['Hi'], ['</p>', 'tk-punctuation']]], title: 'index.html' },
  { type: 'output', content: 'Hi' },
  { type: 'output', content: '<p>Hi</p>', kind: 'html' },
  { type: 'alert', variant: 'warning', text: 'Do not forget the doctype.' },
  { type: 'table', headers: ['Term', 'Meaning'], rows: [['Tag', '`<p>`']] },
  { type: 'image', src: '/assets/images/example.png', alt: 'An example image', width: 320, height: 200 },
  { type: 'video', provider: 'youtube', videoId: 'dQw4w9WgXcQ', title: 'Intro video' },
  { type: 'callout', title: 'Tip', text: 'Use semantic elements.' },
  { type: 'interactive', language: 'html', code: '<h1>Edit me</h1>' },
  { type: 'quiz', questions: [{ id: 'q1', type: 'true-false', lessonSlug: 'intro', difficulty: 'beginner', question: 'HTML is a programming language.', explanation: 'HTML is a markup language, not a programming language.', correct: false }] },
  { type: 'exercise', exerciseId: 'html-intro-1' },
];

@Component({
  imports: [ContentRendererComponent],
  template: `<cma-content-renderer [blocks]="blocks()" />`,
})
class HostComponent {
  readonly blocks = signal(BLOCKS);
}

describe('ContentRendererComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([]), provideTestContent(), TutorialContext],
    }).compileComponents();
  });

  it('renders every block type as the expected element', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h2#what-is-html')?.textContent).toContain('What is HTML?');
    expect(root.querySelector('p strong')?.textContent).toBe('HyperText Markup Language');
    expect(root.querySelector('p a[target="_blank"]')?.getAttribute('rel')).toContain('noopener');
    expect(root.querySelectorAll('ul li').length).toBe(2);
    expect(root.querySelector('ul li code')?.textContent).toBe('code');
    expect(root.querySelector('figure.cma-code .tk-punctuation')?.textContent).toBe('<p>');
    expect(root.querySelector('.cma-code__title')?.textContent).toBe('index.html');
    expect(root.querySelectorAll('.cma-output').length).toBe(2);
    expect(root.querySelector('.cma-output iframe')?.getAttribute('sandbox')).toBe('');
    expect(root.querySelector('.alert-warning .alert__title')?.textContent).toBe('Common mistake');
    expect(root.querySelector('table th')?.textContent).toBe('Term');
    expect(root.querySelector('table td code')?.textContent).toBe('<p>');
    expect(root.querySelector('figure img')?.getAttribute('alt')).toBe('An example image');
    expect(root.querySelector('.cma-video button')).not.toBeNull();
    expect(root.querySelector('.cma-video iframe')).toBeNull();
    expect(root.querySelectorAll('aside.cma-callout').length).toBe(3);
    expect(root.querySelectorAll('figure.cma-code').length).toBe(2);
    expect(root.innerHTML).not.toContain('innerHTML');
  });
});
