import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'cma-home-code-preview',
  imports: [RouterLink, IconComponent],
  templateUrl: './home-code-preview.html',
  styleUrl: './home-code-preview.scss',
})
export class HomeCodePreviewComponent {}
