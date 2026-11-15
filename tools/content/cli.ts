/**
 * Content pipeline CLI.
 *
 *   npm run content:validate   validate every authored file, report problems, write nothing
 *   npm run content:build      validate + emit compiled content to .generated/content + refresh JSON schemas
 */
import { ContentError, OUTPUT_DIR, compile, emit, emitJsonSchemas } from './compile';

async function validate(): Promise<void> {
  const result = await compile();
  console.log(
    `[content] valid: ${result.categories.length} categories, ${result.technologies.length} technologies, ${result.paths.length} learning paths, ${result.searchDocuments.length} search documents`,
  );
}

async function build(): Promise<void> {
  const result = await compile();
  await emit(result);
  await emitJsonSchemas();
  const statuses = result.technologies.reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.status]: (acc[t.status] ?? 0) + 1 }), {});
  console.log(
    `[content] built ${result.technologies.length} technologies (${Object.entries(statuses)
      .map(([k, v]) => `${v} ${k}`)
      .join(', ')}), ${result.paths.length} learning paths -> ${OUTPUT_DIR}`,
  );
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
