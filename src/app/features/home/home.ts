import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/config/site-config';
import { IconComponent } from '../../shared/components/icon/icon';
import { WorkInProgressComponent } from '../../shared/components/work-in-progress/work-in-progress';

@Component({
  selector: 'cma-home',
  imports: [RouterLink, ReactiveFormsModule, IconComponent, WorkInProgressComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage {
  protected readonly site = inject(SITE_CONFIG);
  protected readonly query = new FormControl('', { nonNullable: true });
  private readonly router = inject(Router);

  protected submitSearch(): void {
    const q = this.query.value.trim();
    void this.router.navigate(['/search'], q ? { queryParams: { q } } : {});
  }
}
