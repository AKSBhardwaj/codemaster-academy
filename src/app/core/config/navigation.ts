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
  link('Start here', '/start', { icon: 'house' }),
  {
    kind: 'group',
    label: 'Tutorials',
    links: [
      link('All tutorials', '/tutorials', { icon: 'book', description: 'Browse every technology' }),
      link('Learning paths', '/learning-paths', {
        icon: 'compass',
        description: 'Guided roadmaps',
      }),
    ],
  },
  link('Learning paths', '/learning-paths', { icon: 'compass' }),
  {
    kind: 'group',
    label: 'Practice',
    links: [
      link('Exercises', '/exercises', { icon: 'pencil-square' }),
      link('Quizzes', '/quizzes', { icon: 'patch-check' }),
      link('Examples', '/examples', { icon: 'file-earmark-code' }),
      link('References', '/references', { icon: 'journal-code' }),
    ],
  },
  link('Playground', '/playground', { icon: 'code-slash' }),
];

export const LEARNING_NAV: readonly NavLink[] = [
  link('My learning', '/dashboard', { icon: 'speedometer2' }),
  link('Bookmarks', '/bookmarks', { icon: 'bookmark' }),
  link('Learning settings', '/settings', { icon: 'gear' }),
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
    links: [
      link('Exercises', '/exercises'),
      link('Quizzes', '/quizzes'),
      link('Playground', '/playground'),
    ],
  },
  {
    kind: 'group',
    label: 'My learning',
    links: [
      link('My learning', '/dashboard'),
      link('Bookmarks', '/bookmarks'),
      link('Learning settings', '/settings'),
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
      link('Credits', '/credits'),
    ],
  },
];
