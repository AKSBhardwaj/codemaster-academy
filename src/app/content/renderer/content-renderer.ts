import { Component, input } from '@angular/core';
import type { ContentBlock } from '../../core/models/content';
import { AlertBlockComponent } from '../blocks/alert-block';
import { CalloutBlockComponent } from '../blocks/callout-block';
import { CodeBlockHostComponent } from '../blocks/code-block-host';
import { ExerciseBlockComponent } from '../blocks/exercise-block';
import { HeadingBlockComponent } from '../blocks/heading-block';
import { ImageBlockComponent } from '../blocks/image-block';
import { InteractiveBlockComponent } from '../blocks/interactive-block';
import { ListBlockComponent } from '../blocks/list-block';
import { OutputBlockComponent } from '../blocks/output-block';
import { ParagraphBlockComponent } from '../blocks/paragraph-block';
import { QuizBlockComponent } from '../blocks/quiz-block';
import { TableBlockComponent } from '../blocks/table-block';
import { VideoBlockComponent } from '../blocks/video-block';

/**
 * Generic lesson renderer: maps every content block type to its component.
 * Adding a block type = add a union member in content-schema/blocks.ts, a component and a case here.
 */
@Component({
  selector: 'cma-content-renderer',
  imports: [
    HeadingBlockComponent,
    ParagraphBlockComponent,
    ListBlockComponent,
    CodeBlockHostComponent,
    OutputBlockComponent,
    AlertBlockComponent,
    TableBlockComponent,
    ImageBlockComponent,
    VideoBlockComponent,
    CalloutBlockComponent,
    InteractiveBlockComponent,
    QuizBlockComponent,
    ExerciseBlockComponent,
  ],
  template: `
    <div class="cma-prose">
      @for (block of blocks(); track $index) {
        @switch (block.type) {
          @case ('heading') {
            <cma-heading-block [block]="block" />
          }
          @case ('paragraph') {
            <cma-paragraph-block [block]="block" />
          }
          @case ('list') {
            <cma-list-block [block]="block" />
          }
          @case ('code') {
            <cma-code-block-host [block]="block" />
          }
          @case ('output') {
            <cma-output-block [block]="block" />
          }
          @case ('alert') {
            <cma-alert-block [block]="block" />
          }
          @case ('table') {
            <cma-table-block [block]="block" />
          }
          @case ('image') {
            <cma-image-block [block]="block" />
          }
          @case ('video') {
            <cma-video-block [block]="block" />
          }
          @case ('callout') {
            <cma-callout-block [block]="block" />
          }
          @case ('interactive') {
            <cma-interactive-block [block]="block" />
          }
          @case ('quiz') {
            <cma-quiz-block [block]="block" />
          }
          @case ('exercise') {
            <cma-exercise-block [block]="block" />
          }
        }
      }
    </div>
  `,
})
export class ContentRendererComponent {
  readonly blocks = input.required<readonly ContentBlock[]>();
}
