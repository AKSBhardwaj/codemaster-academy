import type { UiIconName } from '../../shared/icons/ui-icons.generated';

export interface NavLink {
  readonly kind: 'link';
  readonly label: string;
  readonly path: string;
  readonly exact?: boolean;
  readonly icon?: UiIconName;
  readonly description?: string;
}

export interface NavGroup {
  readonly kind: 'group';
  readonly label: string;
  readonly links: readonly NavLink[];
}

export type NavItem = NavLink | NavGroup;

const link = (
  label: string,
  path: string,
  extra: Partial<Omit<NavLink, 'kind' | 'label' | 'path'>> = {},
): NavLink => ({ kind: 'link', label, path, ...extra });

/** Primary navigation. Technology categories are appended to the Tutorials group at runtime from the catalog. */
export const PRIMARY_NAV: readonly NavItem[] = [
  link('Home', '/', { exact: true, icon: 'house' }),
  {
    kind: 'group',
    label: 'Tutorials',
    links: [
      link('All tutorials', '/tutorials', { icon: 'book', description: 'Browse every technology' }),
      link('Learning paths', '/learning-paths', { icon: 'compass', description: 'Guided roadmaps' }),
    ],
  },
  link('References', '/references', { icon: 'journal-code' }),
  link('Examples', '/examples', { icon: 'file-earmark-code' }),
  link('Exercises', '/exercises', { icon: 'pencil-square' }),
  link('Quizzes', '/quizzes', { icon: 'patch-check' }),
  link('Playground', '/playground', { icon: 'code-slash' }),
];

export const ACCOUNT_NAV_GUEST: readonly NavLink[] = [
  link('Log in', '/login', { icon: 'person-circle' }),
  link('Create account', '/register', { icon: 'plus-circle' }),
];

export const ACCOUNT_NAV_USER: readonly NavLink[] = [
  link('Dashboard', '/dashboard', { icon: 'speedometer2' }),
  link('Bookmarks', '/bookmarks', { icon: 'bookmark' }),
  link('Profile', '/profile', { icon: 'gear' }),
];

export const FOOTER_NAV: readonly NavGroup[] = [
  {
    kind: 'group',
    label: 'Learn',
    links: [
      link('All tutorials', '/tutorials'),
      link('Learning paths', '/learning-paths'),
      link('References', '/references'),
      link('Examples', '/examples'),
    ],
  },
  {
    kind: 'group',
    label: 'Practice',
    links: [link('Exercises', '/exercises'), link('Quizzes', '/quizzes'), link('Playground', '/playground')],
  },
  {
    kind: 'group',
    label: 'Account',
    links: [
      link('Dashboard', '/dashboard'),
      link('Bookmarks', '/bookmarks'),
      link('Log in', '/login'),
      link('Create account', '/register'),
    ],
  },
  {
    kind: 'group',
    label: 'Company',
    links: [
      link('About us', '/about'),
      link('Contact', '/contact'),
      link('Privacy policy', '/privacy-policy'),
      link('Terms and conditions', '/terms'),
    ],
  },
];
