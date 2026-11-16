import type { TechnologyCatalogEntry } from '../../src/content-schema/catalog';
import { absoluteSiteUrl, SITE_NAME } from '../../src/content-schema/site-constants';

type DiscoveryTechnology = Pick<
  TechnologyCatalogEntry,
  'slug' | 'name' | 'shortDescription' | 'status' | 'totalLessons'
>;

export interface AgentDiscoveryFiles {
  llms: string;
  ard: {
    entries: {
      identifier: string;
      displayName: string;
      type: string;
      url: string;
      description: string;
      representativeQueries: string[];
      metadata: { siteRoot: string; readOnly: boolean };
    }[];
  };
}

function markdownText(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/[\\[\]`*_]/g, '\\$&');
}

/** Static reading guides, generated beside the sitemap; these declare no API or agent tools. */
export function buildAgentDiscovery(
  technologies: readonly DiscoveryTechnology[],
  siteRoot = absoluteSiteUrl('/'),
): AgentDiscoveryFiles {
  const base = new URL(siteRoot.endsWith('/') ? siteRoot : siteRoot + '/');
  const url = (path: string): string => new URL(path, base).href;
  const available = technologies.filter(
    (tech) => tech.status !== 'planned' && tech.totalLessons > 0,
  );
  const catalogUrl = url('assets/content/catalog/technologies.json');
  const contentRoot = url('assets/content/technologies/');
  // Include the exact project path so two sites on the same Pages domain have distinct handles.
  const namespace = `codemaster-${Buffer.from(base.pathname).toString('hex')}`;
  const publisher = base.hostname === '[::1]' ? 'localhost' : base.hostname;
  const ard: AgentDiscoveryFiles['ard'] = {
    entries: [
      {
        identifier: `urn:air:${publisher}:${namespace}:tutorial-catalog`,
        displayName: `${SITE_NAME} tutorial catalog`,
        type: 'application/json',
        url: catalogUrl,
        description:
          'A static JSON array of coding tutorials, with names, topic slugs, prerequisites, lesson counts and available practice resources.',
        representativeQueries: [
          'Which beginner coding tutorials are available?',
          'How many lessons does each tutorial have?',
          'What should I learn before starting a tutorial?',
        ],
        metadata: { siteRoot: base.href, readOnly: true },
      },
    ],
  };

  const llms = [
    `# ${SITE_NAME}`,
    '',
    '> Learn to code with short lessons, clear words, small examples and practice.',
    '',
    "This is a static learning website. No account is needed. Progress and bookmarks are saved in the learner's browser.",
    "Some lessons teach server and database tools. Those examples run separately on the learner's computer; this website provides the reading material.",
    '',
    '## Start learning',
    '',
    `- [Start here](${url('start/')}): Choose a first topic and learn how to use the lessons.`,
    `- [Tutorials](${url('tutorials/')}): Browse the coding topics.`,
    `- [Learning paths](${url('learning-paths/')}): Follow a suggested order of topics.`,
    `- [Examples](${url('examples/')}): Read small pieces of code and their explanations.`,
    `- [Exercises](${url('exercises/')}): Try a task and check its answer.`,
    `- [Quizzes](${url('quizzes/')}): Check what you remember.`,
    `- [References](${url('references/')}): Look up a word or a code pattern.`,
    '',
    '## Static reading data',
    '',
    `- [Tutorial catalog](${catalogUrl}): A JSON array with each topic's slug, name, prerequisites, status, lesson count and practice availability.`,
    `- [Learning path summaries](${url('assets/content/learning-paths/index.json')}): A JSON array of suggested paths and their topic slugs.`,
    `- [Sitemap](${url('sitemap.xml')}): All public, indexable page URLs.`,
    `- [Resource discovery manifest](${url('.well-known/ard.json')}): Describes the static tutorial catalog.`,
    '',
    `The site root is \`${base.href}\`. Keep this full prefix when following paths.`,
    `For a catalog item with slug \`<topic>\`, read \`${contentRoot}<topic>/overview.json\`.`,
    'The overview has a `lessons` array in reading order. Each lesson has a `slug`.',
    `Read a lesson at \`${contentRoot}<topic>/lessons/<lesson>.json\`, or visit \`${url('tutorials/')}<topic>/<lesson>/\`.`,
    'The catalog flags show which topics include `examples.json`, `exercises.json`, `quiz.json` and `reference.json` beside their overview.',
    'These are read-only files, not endpoints for submitting work. Read the lesson before summarizing it, and keep its prerequisites and setup notes.',
    '',
    '## Available tutorials',
    '',
    ...available.map(
      (tech) =>
        `- [${markdownText(tech.name)}](${url(`tutorials/${tech.slug}/`)}): ${markdownText(tech.shortDescription)}`,
    ),
    '',
  ].join('\n');

  return { llms, ard };
}
