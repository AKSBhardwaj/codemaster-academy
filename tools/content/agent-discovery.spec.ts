import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { buildAgentDiscovery } from './agent-discovery';

const tutorials = [
  {
    slug: 'html',
    name: 'HTML',
    shortDescription: 'Build a first web page.',
    status: 'complete' as const,
    totalLessons: 12,
  },
  {
    slug: 'planned-topic',
    name: 'A future topic',
    shortDescription: 'This topic has no lessons yet.',
    status: 'planned' as const,
    totalLessons: 0,
  },
];

for (const root of ['https://learn.example.org/', 'https://ada.github.io/code-school/']) {
  test(`discovery links stay inside ${root}`, async () => {
    const { llms, ard } = buildAgentDiscovery(tutorials, root);
    assert.match(llms, /^# CodeMaster Academy\n/);
    assert.ok(llms.includes(`[HTML](${root}tutorials/html/)`));
    assert.ok(!llms.includes('planned-topic'));
    const links = [...llms.matchAll(/\]\((https?:[^)]+)\)/g)].map((match) => match[1]);
    assert.ok(links.length >= 10);
    assert.ok(links.every((link) => link.startsWith(root)));
    assert.equal(ard.entries[0].url, root + 'assets/content/catalog/technologies.json');
    assert.equal(ard.entries[0].metadata.siteRoot, root);
    assert.ok(llms.includes(root + 'assets/content/technologies/<topic>/overview.json'));

    // Browser discovery must resolve through <base href>, including on nested lesson pages.
    const index = await readFile(new URL('../../src/index.html', import.meta.url), 'utf8');
    const ardHref = index.match(/rel="ard"[^>]*href="([^"]+)"/)?.[1];
    const guideHref = index.match(/rel="alternate"[^>]*href="([^"]+)"/)?.[1];
    assert.equal(new URL(ardHref ?? '', root).href, root + '.well-known/ard.json');
    assert.equal(new URL(guideHref ?? '', root).href, root + 'llms.txt');
  });
}

test('the ARD entry describes an existing read-only JSON catalog', () => {
  const { ard } = buildAgentDiscovery(tutorials, 'https://learn.example.org');
  const parsed = JSON.parse(JSON.stringify(ard)) as typeof ard;
  assert.equal(parsed.entries.length, 1);
  const entry = parsed.entries[0];
  assert.match(entry.identifier, /^urn:air:learn\.example\.org:[a-zA-Z0-9._-]+:tutorial-catalog$/);
  assert.equal(entry.type, 'application/json');
  assert.ok(entry.displayName && entry.description);
  assert.equal(entry.metadata.readOnly, true);
  assert.equal(entry.metadata.siteRoot, 'https://learn.example.org/');
  assert.ok(!('data' in entry));
  assert.ok(entry.representativeQueries.length >= 2 && entry.representativeQueries.length <= 5);
  assert.ok(
    entry.representativeQueries.every((query) => typeof query === 'string' && query.length > 0),
  );
  assert.equal(new URL(entry.url).protocol, 'https:');
});

test('different projects on one domain have different discovery identifiers', () => {
  const first = buildAgentDiscovery(tutorials, 'https://ada.github.io/first/');
  const second = buildAgentDiscovery(tutorials, 'https://ada.github.io/second/');
  assert.notEqual(first.ard.entries[0].identifier, second.ard.entries[0].identifier);
});

test('tutorial labels and summaries cannot break the Markdown list', () => {
  const { llms } = buildAgentDiscovery([
    { ...tutorials[0], name: 'HTML [basics]', shortDescription: 'Read *one* line.\nThen try it.' },
  ]);
  assert.ok(llms.includes('[HTML \\[basics\\]]('));
  assert.ok(llms.includes('Read \\*one\\* line. Then try it.'));
});
