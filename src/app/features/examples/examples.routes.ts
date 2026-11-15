import { Routes } from '@angular/router';

export const EXAMPLES_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./examples-index').then((m) => m.ExamplesIndexPage),
    data: {
      seo: {
        title: 'Code Examples',
        description: 'Copy-ready, runnable code examples for every technology on the platform.',
      },
    },
  },
  {
    path: ':tech',
    loadComponent: () => import('./examples-tech').then((m) => m.ExamplesTechPage),
  },
];
