/**
 * Content pipeline CLI (Phase 2 stub).
 *
 * `build`    – copies authored content from src/assets/content to .generated/content.
 * `validate` – currently only checks that the authoring directory exists.
 *
 * Phase 4 replaces the copy step with validation, enrichment, syntax highlighting,
 * manifest, search-index and sitemap generation.
 */
import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');
const SOURCE_DIR = resolve(ROOT, 'src', 'assets', 'content');
const OUTPUT_DIR = resolve(ROOT, '.generated', 'content');

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function validate(): Promise<void> {
  if (!(await exists(SOURCE_DIR))) {
    throw new Error(`Content source directory not found: ${SOURCE_DIR}`);
  }
  console.log(`[content] validate: ok (${SOURCE_DIR})`);
}

async function build(): Promise<void> {
  await validate();
  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });
  await cp(SOURCE_DIR, OUTPUT_DIR, { recursive: true });
  console.log(`[content] build: copied ${SOURCE_DIR} -> ${OUTPUT_DIR}`);
}

const command = process.argv[2] ?? 'build';
const commands: Record<string, () => Promise<void>> = { build, validate };
const run = commands[command];
if (!run) {
  console.error(`Unknown command "${command}". Use one of: ${Object.keys(commands).join(', ')}`);
  process.exit(1);
}
run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
