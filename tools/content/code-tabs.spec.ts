import { strict as assert } from 'node:assert';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  codeTabsBlockSchema,
  codeTabsBlockSourceSchema,
  contentBlockSourceSchema,
  lessonSchema,
  type ContentBlockSource,
  type TechnologySource,
} from '../../src/content-schema/index';
import { codeTabSearchKeywords, compileTechnologyFolder } from './technology';

const variants = [
  { type: 'code' as const, language: 'javascript', code: 'console.log(3 + 4);', runnable: true },
  {
    type: 'code' as const,
    language: 'c',
    code: '#include <stdio.h>\nint main(void) { printf("7\\n"); return 0; }',
  },
  {
    type: 'code' as const,
    language: 'cpp',
    code: '#include <iostream>\nint main() { std::cout << 7 << "\\n"; }',
  },
  { type: 'code' as const, language: 'python', code: 'print(3 + 4)' },
  { type: 'code' as const, language: 'csharp', code: 'using System;\nConsole.WriteLine(3 + 4);' },
  {
    type: 'code' as const,
    language: 'java',
    code: 'class Main { public static void main(String[] args) { System.out.println(3 + 4); } }',
  },
];
const tabs = {
  type: 'code-tabs' as const,
  title: 'Add two scores',
  defaultLanguage: 'javascript',
  variants,
};

const technology: TechnologySource = {
  slug: 'sample',
  name: 'Sample',
  categorySlug: 'foundations',
  difficulty: 'beginner',
  featured: false,
  popular: false,
  icon: { kind: 'glyph', src: 'code' },
  tags: ['examples'],
  prerequisites: [],
  shortDescription:
    'Use a small example to learn the same coding idea in several languages, one clear step at a time.',
  highlights: ['Read small examples', 'Compare code languages', 'Check a shared output'],
};

/** Exercise the real folder compiler without changing authored lessons or generated assets. */
async function withLesson(
  block: ContentBlockSource,
  check: (
    compile: (next?: ContentBlockSource) => ReturnType<typeof compileTechnologyFolder>,
  ) => Promise<void>,
): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'cma-code-tabs-'));
  try {
    const folder = join(root, 'technologies', 'sample');
    await mkdir(join(folder, 'lessons'), { recursive: true });
    await writeFile(
      join(folder, 'overview.json'),
      JSON.stringify({
        slug: 'sample',
        description:
          'Read one tiny example in several languages. Each version adds the same two scores and shows the same answer. Choose a language that you know and follow each step carefully.',
        whatYouWillLearn: [
          'Add two small scores',
          'Read the shared answer',
          'Choose a code language',
        ],
        learningObjectives: [
          'Add two small scores',
          'Read the shared answer',
          'Choose a code language',
        ],
        sidebarCategories: [{ id: 'basics', title: 'Basics', lessonSlugs: ['add-scores'] }],
        seo: {
          title: 'Adding two small scores',
          description:
            'Learn how a tiny example adds two scores and prints the result in several coding languages.',
        },
      }),
    );
    const compile = async (next: ContentBlockSource = block) => {
      await writeFile(
        join(folder, 'lessons', 'add-scores.json'),
        JSON.stringify({
          schemaVersion: 1,
          slug: 'add-scores',
          title: 'Add two scores',
          summary: 'Add two small scores and read the same result in several languages.',
          introduction:
            'Two friends earned points in a game. Add their points to find the team score. This small program does the work for us.',
          learningObjectives: ['Add two small scores', 'Read the shared answer'],
          blocks: [
            { type: 'heading', level: 2, text: 'Add the points' },
            next,
            { type: 'output', content: '7' },
          ],
          relatedLessons: [],
          updatedOn: '2026-11-16',
          seo: {
            title: 'Adding two small scores',
            description:
              'Learn how a tiny example adds two scores and prints the result in several coding languages.',
          },
        }),
      );
      return compileTechnologyFolder(technology, { ...technology, id: 'sample' }, root, root);
    };
    await check(compile);
  } finally {
    // root is the exact directory returned by mkdtemp above, never an authored-content path.
    await rm(root, { recursive: true, force: true });
  }
}

test('code tabs require distinct variants, an available default and valid nested code', () => {
  assert.equal(contentBlockSourceSchema.safeParse(tabs).success, true);
  assert.equal(
    codeTabsBlockSourceSchema.safeParse({ ...tabs, defaultLanguage: undefined }).success,
    true,
  );
  for (const invalid of [
    { ...tabs, variants: variants.slice(0, 1) },
    { ...tabs, variants: [...variants, ...variants.slice(0, 3)] },
    { ...tabs, variants: [variants[0], variants[0]] },
    { ...tabs, defaultLanguage: 'rust' },
    { ...tabs, variants: [variants[0], { ...variants[1], code: '' }] },
    { ...tabs, variants: [variants[0], { ...variants[1], tokens: [] }] },
  ])
    assert.equal(codeTabsBlockSourceSchema.safeParse(invalid).success, false);
  assert.equal(
    codeTabsBlockSchema.safeParse(tabs).success,
    false,
    'compiled variants must have tokens',
  );
});

test('all six variants receive tokens, preserve captions and expose compact language search terms', async () => {
  const source = {
    ...tabs,
    variants: variants.map((variant) => ({
      ...variant,
      caption: `See the [${variant.language} guide](/tutorials/${variant.language}).`,
    })),
  };
  await withLesson(source, async (compile) => {
    const bundle = await compile();
    assert.ok(bundle);
    const lesson = bundle.lessons[0];
    assert.equal(lessonSchema.safeParse(lesson).success, true);
    const result = lesson.blocks[1];
    assert.equal(result.type, 'code-tabs');
    if (result.type !== 'code-tabs') throw new Error('Missing code tabs');
    assert.equal(result.defaultLanguage, 'javascript');
    assert.deepEqual(
      result.variants.map((variant) => variant.language),
      variants.map((variant) => variant.language),
    );
    for (const variant of result.variants) {
      assert.equal(
        variant.tokens.map((line) => line.map((token) => token[0]).join('')).join('\n'),
        variant.code,
      );
      assert.ok(
        variant.tokens.flat().some((token) => token[1]),
        `${variant.language} should be highlighted`,
      );
      assert.ok(bundle.links.some((link) => link.href === `/tutorials/${variant.language}`));
    }
    const terms = codeTabSearchKeywords(lesson.blocks);
    for (const label of ['JavaScript', 'C', 'C++', 'Python', 'C#', 'Java'])
      assert.ok(terms.includes(label));
    assert.equal(terms.length, new Set(terms).size);
    assert.ok(!terms.includes(variants[0].code));
  });
});

test('the compiler defaults to the first variant and counts one program for reading time', async () => {
  const code = Array.from({ length: 240 }, () => 'console.log(7);').join('\n');
  const longTabs = {
    ...tabs,
    defaultLanguage: undefined,
    variants: variants.map((variant) => ({ ...variant, code })),
  };
  await withLesson(longTabs, async (compile) => {
    const bundle = await compile();
    const block = bundle!.lessons[0].blocks[1];
    assert.equal(block.type, 'code-tabs');
    if (block.type !== 'code-tabs') throw new Error('Missing code tabs');
    assert.equal(block.defaultLanguage, 'javascript');
    const single = await compile(longTabs.variants[0]);
    assert.equal(bundle!.lessons[0].readingTimeMinutes, single!.lessons[0].readingTimeMinutes);
  });
});

test('nested C, C++, Python, C# and Java examples cannot request browser execution', async () => {
  await withLesson(tabs, async (compile) => {
    for (const language of ['c', 'cpp', 'python', 'csharp', 'java']) {
      await assert.rejects(
        compile({
          ...tabs,
          variants: variants.map((variant) => ({
            ...variant,
            runnable: variant.language === language,
          })),
        }),
        new RegExp(
          `runnable code blocks must be html, css, javascript or sql \\(got "${language}"\\)`,
        ),
      );
    }
  });
});
