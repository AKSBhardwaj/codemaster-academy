import { Routes } from '@angular/router';

export const EXERCISES_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./exercises-index').then((m) => m.ExercisesIndexPage),
    data: {
      seo: {
        title: 'Exercises',
        description:
          'Practice with multiple-choice, fill-in-the-blank, output prediction, find-the-error and coding exercises.',
      },
    },
  },
  {
    path: ':tech',
    loadComponent: () => import('./exercises-tech').then((m) => m.ExercisesTechPage),
  },
];
