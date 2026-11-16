import { Routes } from '@angular/router';

export const TUTORIALS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./catalog/catalog').then((m) => m.CatalogPage),
    data: {
      seo: {
        title: 'All Tutorials',
        description:
          'Browse free tutorials for 100+ programming languages, web technologies, frameworks, databases, DevOps tools and AI topics.',
      },
    },
  },
  {
    path: 'category/:category',
    loadComponent: () => import('./category/category').then((m) => m.CategoryPage),
  },
  {
    path: ':tech',
    loadComponent: () =>
      import('../technology/tutorial-layout').then((m) => m.TutorialLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('../technology/overview').then((m) => m.TechnologyOverviewPage),
      },
      {
        path: ':lesson',
        loadComponent: () => import('../lesson/lesson').then((m) => m.LessonPage),
      },
    ],
  },
];
