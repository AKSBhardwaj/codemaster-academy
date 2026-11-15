/**
 * Content pipeline CLI.
 *
 *   npm run content:validate   validate every authored file, report problems, write nothing
 *   npm run content:build      validate + emit compiled content to .generated/content + refresh JSON schemas
 */
import { ContentError, OUTPUT_DIR, compile, emit, emitJsonSchemas, type CompileResult } from './compile';

function summary(result: CompileResult): string {
  const statuses = result.technologies.reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.status]: (acc[t.status] ?? 0) + 1 }), {});
  const lessons = [...result.compiled.values()].reduce((sum, b) => sum + b.lessons.length, 0);
  return `${result.technologies.length} technologies (${Object.entries(statuses)
    .map(([k, v]) => `${v} ${k}`)
    .join(', ')}), ${lessons} lessons, ${result.paths.length} learning paths, ${result.searchCore.length + result.searchLessons.length} search documents`;
}

async function validate(): Promise<void> {
  const result = await compile();
  for (const warning of result.warnings) console.warn(`[content] WARN ${warning}`);
  console.log(`[content] valid: ${summary(result)}`);
}

async function build(): Promise<void> {
  const result = await compile();
  await emit(result);
  await emitJsonSchemas();
  for (const warning of result.warnings) console.warn(`[content] WARN ${warning}`);
  console.log(`[content] built ${summary(result)} -> ${OUTPUT_DIR}`);
}

const commands: Record<string, () => Promise<void>> = { build, validate };
const command = process.argv[2] ?? 'build';
const run = commands[command];
if (!run) {
  console.error(`Unknown command "${command}". Use one of: ${Object.keys(commands).join(', ')}`);
  process.exit(1);
}
run().catch((error: unknown) => {
  if (error instanceof ContentError) console.error(`[content] ERROR ${error.message}`);
  else console.error(error);
  process.exit(1);
});
