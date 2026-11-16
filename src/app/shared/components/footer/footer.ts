import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FOOTER_NAV } from '../../../core/config/navigation';
import { CREATOR_PROFILE } from '../../../core/config/creator-profile';
import { SITE_CONFIG } from '../../../core/config/site-config';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'cma-footer',
  imports: [RouterLink, NgOptimizedImage, IconComponent],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class FooterComponent {
  protected readonly site = inject(SITE_CONFIG);
  protected readonly creator = CREATOR_PROFILE;
  protected readonly groups = FOOTER_NAV;
  protected readonly year = new Date().getFullYear();
}
