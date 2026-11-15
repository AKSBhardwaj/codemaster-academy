import { Routes } from '@angular/router';

export const QUIZZES_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./quizzes-index').then((m) => m.QuizzesIndexPage),
    data: {
      seo: {
        title: 'Quizzes',
        description: 'Test what you have learned with scored quizzes, answer reviews and retries.',
      },
    },
  },
  {
    path: ':tech',
    loadComponent: () => import('./quiz').then((m) => m.QuizPage),
  },
];
