import { Routes } from '@angular/router';

export const REFERENCES_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./references-index').then((m) => m.ReferencesIndexPage),
    data: {
      seo: {
        title: 'References',
        description:
          'Quick references for HTML tags, CSS properties, JavaScript methods, SQL statements and more.',
      },
    },
  },
  {
    path: ':tech',
    loadComponent: () => import('./reference').then((m) => m.ReferencePage),
  },
];
