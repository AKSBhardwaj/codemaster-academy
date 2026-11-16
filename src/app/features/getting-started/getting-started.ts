import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { InteractiveBlockComponent } from '../../content/blocks/interactive-block';

@Component({
  selector: 'cma-getting-started',
  imports: [RouterLink, PageHeaderComponent, InteractiveBlockComponent],
  template: `
    <cma-page-header
      eyebrow="Start here"
      title="You can learn to code"
      lead="You do not need to know any code yet. Read one small part, try it, and take a break when you need one."
    />
    <div class="container-xxl py-4 py-lg-5">
      <div class="row g-4">
        <div class="col-lg-8 cma-prose">
          <section aria-labelledby="what-is-code">
            <h2 id="what-is-code">1. What is code?</h2>
            <p>
              Code is a set of instructions for a computer. Think of a recipe. Each step tells you
              what to do next. Code tells a computer what to do next.
            </p>
            <p>
              A browser is the app you use to open websites. Chrome, Edge and Firefox are browsers.
              This site lets you try simple code right in your browser.
            </p>
          </section>
          <section aria-labelledby="first-page">
            <h2 id="first-page">2. Make your first web page</h2>
            <p>
              HTML labels the parts of a web page. The label <code>&lt;h1&gt;</code> means a big
              heading. The label <code>&lt;p&gt;</code> means a paragraph, or a short piece of text.
              These labels are called <strong>tags</strong>.
            </p>
            <ol>
              <li>Press <strong>Run</strong> below. Look for the heading and the sentence.</li>
              <li>
                Change <strong>My first page</strong> to <strong>My favourite animal</strong>.
              </li>
              <li>Change the sentence to a fact about an animal you like.</li>
              <li>Press <strong>Run</strong> again to see your changes.</li>
            </ol>
            <cma-interactive-block [block]="firstPage" />
            <p>
              Keep the tags in place. A closing tag, such as <code>&lt;/p&gt;</code>, has a slash.
              It tells the browser where that part ends. If something looks wrong, check each tag
              and try again. Mistakes are part of learning.
            </p>
          </section>
          <section aria-labelledby="learning-order">
            <h2 id="learning-order">3. Learn in this order</h2>
            <ol>
              <li>
                <a routerLink="/tutorials/html/introduction">Start with HTML</a>. Add words,
                pictures and links to a page.
              </li>
              <li>
                <a routerLink="/tutorials/css/introduction">Then try CSS</a>. Choose colours, sizes
                and spaces for your page.
              </li>
              <li>
                <a routerLink="/tutorials/javascript/introduction">Next, learn JavaScript</a>. Make
                a button do something when you click it.
              </li>
            </ol>
            <p>
              You do not need to learn every topic today. Start with one lesson. Try its example,
              answer a question, and explain what you learned in your own words.
            </p>
          </section>
          <section aria-labelledby="keep-progress">
            <h2 id="keep-progress">4. Keep track of your learning</h2>
            <p>
              Press <strong>Mark as completed</strong> after a lesson. Press
              <strong>Bookmark</strong> to save a lesson you want to read again. Open
              <a routerLink="/dashboard">My learning</a>
              to see your progress. You never need to sign in.
            </p>
            <p>
              Your progress stays in this browser on this device. Clearing browser data removes it.
              You can save a copy from <a routerLink="/settings">Learning settings</a>.
            </p>
            <a class="btn btn-primary" routerLink="/tutorials/html/introduction"
              >Begin the first HTML lesson</a
            >
          </section>
        </div>
        <aside class="col-lg-4" aria-labelledby="word-help">
          <div class="cma-card p-4">
            <h2 id="word-help" class="h4">Small word helper</h2>
            <dl class="mb-0">
              @for (word of words; track word.name) {
                <dt>{{ word.name }}</dt>
                <dd class="cma-text-secondary mb-3">{{ word.meaning }}</dd>
              }
            </dl>
          </div>
          <div class="cma-card p-4 mt-3">
            <h2 class="h5">A little practice plan</h2>
            <p class="mb-0">
              Try ten minutes at a time. Read, try, and rest. Ask a teacher or a grown-up for help
              if a lesson asks you to install a tool. The first web lessons need no extra tools.
            </p>
          </div>
        </aside>
      </div>
    </div>
  `,
})
export class GettingStartedPage {
  protected readonly firstPage = {
    type: 'interactive' as const,
    language: 'html' as const,
    title: 'Your first web page',
    height: 160,
    code: '<h1>My first page</h1>\n<p>I am learning to code.</p>',
  };

  protected readonly words = [
    { name: 'Code', meaning: 'Instructions that a computer can follow.' },
    { name: 'Run', meaning: 'Ask the computer to follow your code.' },
    { name: 'Output', meaning: 'The result you see after code runs.' },
    { name: 'Bug', meaning: 'A mistake in code. You can find it and fix it.' },
    { name: 'File', meaning: 'A saved piece of work, such as a page or a picture.' },
    { name: 'Variable', meaning: 'A name for a value, such as a score or a word.' },
    { name: 'Function', meaning: 'A named set of steps that you can use again.' },
    { name: 'Loop', meaning: 'Code that repeats a step or a group of steps.' },
  ];
}
