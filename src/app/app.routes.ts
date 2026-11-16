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
        title: 'CodeMaster Academy – Learn to code, one small step at a time',
        description:
          'Learn to code with simple lessons, small examples and fun practice. Start with HTML, CSS and JavaScript. Free to use, with no account needed.',
        withBrandSuffix: false,
      } satisfies PageSeo,
    },
  },
  {
    path: 'start',
    loadComponent: () =>
      import('./features/getting-started/getting-started').then((m) => m.GettingStartedPage),
    data: seo(
      'Start coding step by step',
      'Learn what code is, try your first web page, and follow small steps through HTML, CSS and JavaScript. A free guide for complete beginners.',
    ),
  },
  {
    path: 'tutorials',
    loadChildren: () =>
      import('./features/tutorials/tutorials.routes').then((m) => m.TUTORIALS_ROUTES),
  },
  {
    path: 'references',
    loadChildren: () =>
      import('./features/references/references.routes').then((m) => m.REFERENCES_ROUTES),
  },
  {
    path: 'examples',
    loadChildren: () =>
      import('./features/examples/examples.routes').then((m) => m.EXAMPLES_ROUTES),
  },
  {
    path: 'exercises',
    loadChildren: () =>
      import('./features/exercises/exercises.routes').then((m) => m.EXERCISES_ROUTES),
  },
  {
    path: 'quizzes',
    loadChildren: () => import('./features/quizzes/quizzes.routes').then((m) => m.QUIZZES_ROUTES),
  },
  {
    path: 'learning-paths',
    loadChildren: () =>
      import('./features/learning-paths/learning-paths.routes').then(
        (m) => m.LEARNING_PATHS_ROUTES,
      ),
  },
  {
    path: 'playground',
    loadComponent: () =>
      import('./features/playground/playground-page').then((m) => m.PlaygroundRoutePage),
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
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage),
    data: seo(
      'My learning',
      'See your lessons, saved pages and quiz scores in this browser.',
      'noindex,nofollow',
    ),
  },
  {
    path: 'profile',
    pathMatch: 'full',
    redirectTo: 'settings',
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings').then((m) => m.SettingsPage),
    data: seo(
      'Learning settings',
      'Choose a nickname, save a copy of your progress or start again.',
      'noindex,nofollow',
    ),
  },
  {
    path: 'bookmarks',
    loadComponent: () => import('./features/bookmarks/bookmarks').then((m) => m.BookmarksPage),
    data: seo('Bookmarks', 'Your bookmarked tutorials and lessons.', 'noindex,nofollow'),
  },
  {
    path: 'about',
    loadComponent: () => import('./features/static-pages/about').then((m) => m.AboutPage),
    data: seo(
      'About us',
      'Who builds CodeMaster Academy and how the tutorials are written and reviewed.',
    ),
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/static-pages/contact').then((m) => m.ContactPage),
    data: seo(
      'Contact and feedback',
      'Prepare a note about a lesson, then copy or download it. This frontend app does not send messages or store your feedback.',
    ),
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./features/static-pages/privacy').then((m) => m.PrivacyPage),
    data: seo(
      'Privacy policy',
      'How CodeMaster Academy handles your data: learning progress stays in your browser, with no accounts, analytics or tracking cookies.',
    ),
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/static-pages/terms').then((m) => m.TermsPage),
    data: seo(
      'Terms and conditions',
      'Terms of use for CodeMaster Academy: how you may use the tutorials and playground, content accuracy and trademark notices.',
    ),
  },
  {
    path: 'credits',
    loadComponent: () => import('./features/static-pages/credits').then((m) => m.CreditsPage),
    data: seo(
      'Credits and licences',
      'Logo attributions, trademark notices and the open-source software CodeMaster Academy is built with.',
    ),
  },
  {
    path: '404',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFoundPage),
    data: seo(
      'Page not found',
      'The page you were looking for does not exist.',
      'noindex,nofollow',
    ),
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFoundPage),
    data: seo(
      'Page not found',
      'The page you were looking for does not exist.',
      'noindex,nofollow',
    ),
  },
];
