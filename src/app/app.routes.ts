import { Routes } from '@angular/router';
import type { PageSeo } from './core/services/seo.service';

const seo = (title: string, description: string, robots?: PageSeo['robots']): { seo: PageSeo } => ({
  seo: { title, description, robots },
});

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home').then((m) => m.HomePage),
    data: {
      seo: {
        title: 'CodeMaster Academy – Learn to code with clear, practical tutorials',
        description:
          'Free, structured programming tutorials with runnable examples, exercises and quizzes covering 100+ languages, frameworks, databases and developer tools.',
        withBrandSuffix: false,
      } satisfies PageSeo,
    },
  },
  {
    path: 'tutorials',
    loadChildren: () => import('./features/tutorials/tutorials.routes').then((m) => m.TUTORIALS_ROUTES),
  },
  {
    path: 'references',
    loadChildren: () => import('./features/references/references.routes').then((m) => m.REFERENCES_ROUTES),
  },
  {
    path: 'examples',
    loadChildren: () => import('./features/examples/examples.routes').then((m) => m.EXAMPLES_ROUTES),
  },
  {
    path: 'exercises',
    loadChildren: () => import('./features/exercises/exercises.routes').then((m) => m.EXERCISES_ROUTES),
  },
  {
    path: 'quizzes',
    loadChildren: () => import('./features/quizzes/quizzes.routes').then((m) => m.QUIZZES_ROUTES),
  },
  {
    path: 'learning-paths',
    loadChildren: () =>
      import('./features/learning-paths/learning-paths.routes').then((m) => m.LEARNING_PATHS_ROUTES),
  },
  {
    path: 'playground',
    loadComponent: () => import('./features/playground/playground').then((m) => m.PlaygroundPage),
    data: seo(
      'Code Playground',
      'Write and run HTML, CSS, JavaScript and SQL directly in your browser with a safe, sandboxed playground.',
      'noindex,follow',
    ),
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search').then((m) => m.SearchPage),
    data: seo('Search', 'Search tutorials, lessons, examples and categories.', 'noindex,follow'),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/authentication/login').then((m) => m.LoginPage),
    data: seo('Log in', 'Log in to track your learning progress and bookmarks.', 'noindex,follow'),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/authentication/register').then((m) => m.RegisterPage),
    data: seo('Create account', 'Create an account to track your learning progress.', 'noindex,follow'),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage),
    data: seo('Dashboard', 'Your learning dashboard.', 'noindex,nofollow'),
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then((m) => m.ProfilePage),
    data: seo('Profile', 'Manage your profile and local data.', 'noindex,nofollow'),
  },
  {
    path: 'bookmarks',
    loadComponent: () => import('./features/bookmarks/bookmarks').then((m) => m.BookmarksPage),
    data: seo('Bookmarks', 'Your bookmarked tutorials and lessons.', 'noindex,nofollow'),
  },
  {
    path: 'about',
    loadComponent: () => import('./features/static-pages/about').then((m) => m.AboutPage),
    data: seo('About us', 'Who builds CodeMaster Academy and how the tutorials are written and reviewed.'),
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/static-pages/contact').then((m) => m.ContactPage),
    data: seo('Contact us', 'Get in touch about tutorials, corrections or partnerships.'),
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./features/static-pages/privacy').then((m) => m.PrivacyPage),
    data: seo('Privacy policy', 'How CodeMaster Academy handles your data.'),
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/static-pages/terms').then((m) => m.TermsPage),
    data: seo('Terms and conditions', 'Terms of use for CodeMaster Academy.'),
  },
  {
    path: '404',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFoundPage),
    data: seo('Page not found', 'The page you were looking for does not exist.', 'noindex,nofollow'),
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFoundPage),
    data: seo('Page not found', 'The page you were looking for does not exist.', 'noindex,nofollow'),
  },
];
