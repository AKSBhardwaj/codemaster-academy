import { Component, input } from '@angular/core';
import type { TableBlock } from '../../core/models/content';
import { InlineMarkupComponent } from '../../shared/components/inline-markup/inline-markup';

@Component({
  selector: 'cma-table-block',
  imports: [InlineMarkupComponent],
  template: `
    <div class="table-responsive">
      <table class="table table-bordered align-top">
        @if (block().caption) {
          <caption>{{ block().caption }}</caption>
        }
        <thead>
          <tr>
            @for (header of block().headers; track $index) {
              <th scope="col">{{ header }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of block().rows; track $index) {
            <tr>
              @for (cell of row; track $index) {
                <td><cma-inline [text]="cell" /></td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class TableBlockComponent {
  readonly block = input.required<TableBlock>();
}
