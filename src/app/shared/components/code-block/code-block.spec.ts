import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CodeBlockComponent } from './code-block';

@Component({
  imports: [CodeBlockComponent],
  template: `<cma-code-block code="let a = 1;\nlet b = 2;" language="javascript" [highlightLines]="[2]" [showLineNumbers]="true" />`,
})
class HostComponent {}

describe('CodeBlockComponent', () => {
  it('renders plain lines when no tokens are given, with line numbers and highlighted lines', async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const lines = root.querySelectorAll('.cma-code__line');
    expect(lines.length).toBe(2);
    expect(lines[1].classList.contains('cma-code__line--highlight')).toBe(true);
    expect(root.querySelectorAll('.cma-code__ln').length).toBe(2);
    expect(root.querySelector('.cma-code__lang')?.textContent).toBe('JavaScript');
    expect(root.querySelector('pre')?.textContent).toContain('let a = 1;');
    expect(root.querySelector('button')?.textContent).toContain('Copy');
  });
});
