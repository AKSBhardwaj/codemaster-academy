import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon';

@Component({
  selector: 'cma-not-found',
  imports: [RouterLink, IconComponent],
  template: `
    <div class="container-xxl py-6 text-center">
      <p class="cma-eyebrow mb-2">Error 404</p>
      <h1 class="mb-3">Page not found</h1>
      <p class="lead cma-text-secondary mx-auto mb-4" style="max-width: 36rem">
        The page you are looking for was moved, renamed or never existed. Try one of these instead.
      </p>
      <div class="d-flex flex-wrap justify-content-center gap-2">
        <a class="btn btn-primary d-inline-flex align-items-center gap-2" routerLink="/">
          <cma-icon name="house" /> Home
        </a>
        <a class="btn btn-outline-secondary d-inline-flex align-items-center gap-2" routerLink="/tutorials">
          <cma-icon name="book" /> All tutorials
        </a>
        <a class="btn btn-outline-secondary d-inline-flex align-items-center gap-2" routerLink="/search">
          <cma-icon name="search" /> Search
        </a>
      </div>
    </div>
  `,
})
export class NotFoundPage {}
