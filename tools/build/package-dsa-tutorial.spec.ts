import { strict as assert } from 'node:assert';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { strFromU8, unzipSync } from 'fflate';
import { lessonSourceSchema, type LessonSource } from '../../src/content-schema/technology';
import { dsaSourceArchive } from './package-dsa-tutorial';

const sourceFilenames: Record<string, string> = {
  javascript: 'main.js',
  c: 'main.c',
  cpp: 'main.cpp',
  python: 'main.py',
  csharp: 'Program.cs',
  java: 'Main.java',
};

async function readLessons(): Promise<LessonSource[]> {
  const folder = resolve(
    import.meta.dirname,
    '../../src/assets/content/technologies/data-structures-algorithms/lessons',
  );
  const files = (await readdir(folder)).filter((name) => name.endsWith('.json')).sort();
  return Promise.all(
    files.map(async (name) =>
      lessonSourceSchema.parse(JSON.parse(await readFile(join(folder, name), 'utf8'))),
    ),
  );
}

const lessonsPromise = readLessons();

test('packages all 168 displayed DSA programs and their exact expected outputs', async () => {
  const lessons = await lessonsPromise;
  assert.equal(lessons.length, 28);
  const entries = unzipSync(dsaSourceArchive(lessons));
  const expectedPaths = new Set(['dsa-six-languages/README.md']);
  let programCount = 0;

  for (const lesson of lessons) {
    const tabs = lesson.blocks.filter((block) => block.type === 'code-tabs');
    assert.equal(tabs.length, 1, `${lesson.slug} needs one example group`);
    assert.deepEqual(
      tabs[0].variants.map((variant) => variant.language).sort(),
      Object.keys(sourceFilenames).sort(),
      `${lesson.slug} needs all six languages`,
    );
    const output = lesson.blocks.find((block) => block.type === 'output');
    assert(output, `${lesson.slug} needs an expected output`);

    for (const variant of tabs[0].variants) {
      const folder = `dsa-six-languages/${variant.language}/${lesson.slug}`;
      const sourcePath = `${folder}/${sourceFilenames[variant.language]}`;
      const outputPath = `${folder}/expected-output.txt`;
      expectedPaths.add(sourcePath);
      expectedPaths.add(outputPath);
      assert(entries[sourcePath], `missing ${sourcePath}`);
      assert(entries[outputPath], `missing ${outputPath}`);
      assert.equal(strFromU8(entries[sourcePath]), `${variant.code.trimEnd()}\n`, sourcePath);
      assert.equal(strFromU8(entries[outputPath]), `${output.content.trimEnd()}\n`, outputPath);
      programCount++;

      if (variant.language === 'csharp') {
        const projectPath = `${folder}/DsaPractice.csproj`;
        expectedPaths.add(projectPath);
        assert(entries[projectPath], `missing ${projectPath}`);
        const project = strFromU8(entries[projectPath]);
        assert.match(project, /<Project Sdk="Microsoft\.NET\.Sdk">/);
        assert.match(project, /<OutputType>Exe<\/OutputType>/);
        assert.match(project, /<TargetFramework>net8\.0<\/TargetFramework>/);
        assert.match(project, /<RollForward>LatestMajor<\/RollForward>/);
      }
    }
  }

  assert.equal(programCount, 168);
  assert.equal(
    Object.keys(entries).filter((name) =>
      /\/(?:main\.(?:js|c|cpp|py)|Program\.cs|Main\.java)$/.test(name),
    ).length,
    168,
  );
  // An exact allowlist excludes executables, compiled classes, build folders, and other extras.
  assert.deepEqual(Object.keys(entries).sort(), [...expectedPaths].sort());
  assert.match(strFromU8(entries['dsa-six-languages/README.md']), /Extract \(unzip\)/);
});

test('produces identical archive bytes when the build date changes', async (context) => {
  const lessons = await lessonsPromise;
  context.mock.timers.enable({ apis: ['Date'], now: new Date('2020-01-01T00:00:00Z') });
  const first = dsaSourceArchive(lessons);
  context.mock.timers.setTime(new Date('2035-06-01T12:00:00Z').getTime());
  assert.deepEqual(first, dsaSourceArchive(structuredClone(lessons)));
});

test('rejects a lesson missing one of the six language variants', async () => {
  const lesson = structuredClone((await lessonsPromise)[0]);
  const tabs = lesson.blocks.find((block) => block.type === 'code-tabs');
  assert(tabs);
  tabs.variants = tabs.variants.filter((variant) => variant.language !== 'java');
  assert.throws(() => dsaSourceArchive([lesson]), /missing a language/);
});

test('rejects a lesson without its expected output', async () => {
  const lesson = structuredClone((await lessonsPromise)[0]);
  lesson.blocks = lesson.blocks.filter((block) => block.type !== 'output');
  assert.throws(() => dsaSourceArchive([lesson]), /needs an expected output/);
});
