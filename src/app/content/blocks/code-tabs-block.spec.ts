import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { CodeTabsBlock } from '../../core/models/content';
import { PlaygroundHandoffService } from '../../features/playground/playground-handoff.service';
import { CodeTabsBlockComponent } from './code-tabs-block';

const BLOCK: CodeTabsBlock = {
  type: 'code-tabs',
  title: 'Add two scores',
  defaultLanguage: 'javascript',
  variants: [
    {
      type: 'code',
      language: 'javascript',
      code: 'console.log(3 + 4);',
      tokens: [[['console', 'tk-keyword'], ['.log(3 + 4);']]],
      runnable: true,
    },
    {
      type: 'code',
      language: 'c',
      code: 'printf("%d\\n", 3 + 4);',
      tokens: [[['printf("%d\\n", 3 + 4);']]],
    },
    {
      type: 'code',
      language: 'cpp',
      code: 'std::cout << 3 + 4;',
      tokens: [[['std::cout << 3 + 4;']]],
    },
    {
      type: 'code',
      language: 'python',
      code: 'print(3 + 4)',
      tokens: [[['print(3 + 4)']]],
      caption: 'Run with Python on your computer.',
    },
    {
      type: 'code',
      language: 'csharp',
      code: 'Console.WriteLine(3 + 4);',
      tokens: [[['Console.WriteLine(3 + 4);']]],
    },
    {
      type: 'code',
      language: 'java',
      code: 'System.out.println(3 + 4);',
      tokens: [[['System.out.println(3 + 4);']]],
    },
  ],
};

@Component({
  imports: [CodeTabsBlockComponent],
  template: `<cma-code-tabs-block [block]="block()" blockId="dsa-add-code-3" />
    <p class="shared-output">The result is 7 in every language.</p>`,
})
class HostComponent {
  readonly block = signal(BLOCK);
}

describe('CodeTabsBlockComponent', () => {
  const open = vi.fn();

  beforeEach(async () => {
    open.mockReset();
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([]), { provide: PlaygroundHandoffService, useValue: { open } }],
    }).compileComponents();
  });

  it('shows one highlighted default example and associates every tab with a stable panel', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual([
      'JavaScript',
      'C',
      'C++',
      'Python',
      'C#',
      'Java',
    ]);
    expect(tabs.every((tab) => !tab.disabled)).toBe(true);
    expect(root.querySelectorAll('.cma-code').length).toBe(1);
    expect(root.querySelector('.tk-keyword')?.textContent).toBe('console');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].tabIndex).toBe(0);
    expect(tabs.slice(1).every((tab) => tab.tabIndex === -1)).toBe(true);
    for (const tab of tabs) {
      const panel = root.querySelector<HTMLElement>('#' + tab.getAttribute('aria-controls'))!;
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
      expect(panel.hidden).toBe(tab.getAttribute('aria-selected') !== 'true');
    }
    expect(tabs[0].id).toBe('dsa-add-code-3-tab-0');
  });

  it('switches and copies the chosen code, retaining shared output and limiting playground access', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    try {
      const fixture = TestBed.createComponent(HostComponent);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      const tabs = root.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      root
        .querySelector<HTMLButtonElement>(
          '[aria-label="Try it: open this example in the playground"]',
        )!
        .click();
      expect(open).toHaveBeenCalledWith({
        language: 'javascript',
        code: BLOCK.variants[0].code,
        title: undefined,
      });
      tabs[3].click();
      await fixture.whenStable();
      expect(root.querySelector('pre')?.textContent).toBe('print(3 + 4)');
      expect(root.querySelector('.cma-code__caption')?.textContent).toContain(
        'Python on your computer',
      );
      expect(root.querySelector('[aria-label^="Try it"]')).toBeNull();
      expect(root.querySelectorAll('.cma-code').length).toBe(1);
      expect(root.querySelector('.shared-output')?.textContent).toBe(
        'The result is 7 in every language.',
      );
      root.querySelector<HTMLButtonElement>('[aria-label="Copy code to clipboard"]')!.click();
      await fixture.whenStable();
      expect(writeText).toHaveBeenCalledWith('print(3 + 4)');
      for (const index of [1, 2, 4, 5]) {
        tabs[index].click();
        await fixture.whenStable();
        expect(root.querySelector('[aria-label^="Try it"]')).toBeNull();
      }
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('supports arrow, Home and End keys and resets to the next lesson default', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const tabs = root.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    for (const [from, key, to] of [
      [0, 'ArrowLeft', 5],
      [5, 'ArrowRight', 0],
      [0, 'End', 5],
      [5, 'Home', 0],
    ] as const) {
      tabs[from].dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
      await fixture.whenStable();
      expect(tabs[to].getAttribute('aria-selected')).toBe('true');
      expect(tabs[to].tabIndex).toBe(0);
      expect(document.activeElement).toBe(tabs[to]);
    }
    fixture.componentInstance.block.set({ ...BLOCK, defaultLanguage: 'python' });
    await fixture.whenStable();
    expect(tabs[3].getAttribute('aria-selected')).toBe('true');
    expect(root.querySelector('pre')?.textContent).toBe('print(3 + 4)');
  });
});
