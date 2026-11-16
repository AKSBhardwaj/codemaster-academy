import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { format } from 'node:util';
import { runInNewContext } from 'node:vm';
import initSqlJs from 'sql.js';
import { exampleSetSourceSchema, lessonSourceSchema } from '../../src/content-schema/technology';

const root = resolve(import.meta.dirname, '../../src/assets/content/technologies/system-design');
const lessons = readdirSync(resolve(root, 'lessons'))
  .filter((file) => file.endsWith('.json'))
  .map((file) =>
    lessonSourceSchema.parse(JSON.parse(readFileSync(resolve(root, 'lessons', file), 'utf8'))),
  );
const sqlReady = initSqlJs({
  locateFile: (file) => resolve(import.meta.dirname, '../../node_modules/sql.js/dist', file),
});

for (const lesson of lessons) {
  for (const [index, block] of lesson.blocks.entries()) {
    if (block.type !== 'code' || !block.runnable) continue;
    test(`${lesson.slug}: the ${block.language} model produces its stated result`, async () => {
      const expected = lesson.blocks.slice(index + 1).find((next) => next.type === 'output');
      assert.ok(expected && expected.type === 'output', 'Runnable models need a worked result.');
      let result: string;
      if (block.language === 'javascript') {
        const lines: string[] = [];
        runInNewContext(
          block.code,
          { console: { log: (...values: unknown[]) => lines.push(format(...values)) } },
          { timeout: 1000 },
        );
        result = lines.join('\n');
      } else {
        assert.equal(block.language, 'sql', 'System Design models run in JavaScript or SQLite.');
        const sql = await sqlReady;
        const db = new sql.Database();
        try {
          result = db
            .exec(block.code)
            .map((table) =>
              [table.columns.join(' | '), ...table.values.map((row) => row.join(' | '))].join('\n'),
            )
            .join('\n');
        } finally {
          db.close();
        }
      }
      assert.equal(result.trim(), expected.content.trim());
    });
  }
}

test('the examples collection uses the same models and plans as its lessons', async () => {
  const set = exampleSetSourceSchema.parse(
    JSON.parse(await readFile(resolve(root, 'examples.json'), 'utf8')),
  );
  for (const example of set.examples) {
    const lesson = lessons.find((lesson) => lesson.slug === example.lessonSlug);
    assert.ok(lesson, `${example.id} must link to a lesson.`);
    const code = lesson.blocks.find(
      (block) =>
        block.type === 'code' && block.code === example.code && block.language === example.language,
    );
    assert.ok(code && code.type === 'code', `${example.id} must stay in sync with its lesson.`);
    assert.equal(example.runnable, code.runnable ?? false);
    if (example.output) {
      assert.ok(
        lesson.blocks.some((block) => block.type === 'output' && block.content === example.output),
        `${example.id} must use its lesson's worked result.`,
      );
    }
  }
});
