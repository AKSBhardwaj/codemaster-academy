import { Routes } from '@angular/router';

export const LEARNING_PATHS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./paths-index').then((m) => m.PathsIndexPage),
    data: {
      seo: {
        title: 'Learning Paths',
        description:
          'Guided roadmaps for frontend, backend, full-stack, Python and AI engineering careers with ordered tutorials.',
      },
    },
  },
  {
    path: ':slug',
    loadComponent: () => import('./path-detail').then((m) => m.PathDetailPage),
  },
];
