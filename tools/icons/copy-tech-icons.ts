/**
 * Copies the technology logos listed in tech-icon-map.json from the devicon package
 * (MIT licensed) into src/assets/icons/tech/<slug>.svg. Run: npm run icons:build
 */
import { copyFile, mkdir, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');
const DEVICON_DIR = resolve(ROOT, 'node_modules', 'devicon', 'icons');
const MAP_FILE = resolve(import.meta.dirname, 'tech-icon-map.json');
const OUT_DIR = resolve(ROOT, 'src', 'assets', 'icons', 'tech');

/** slug -> devicon file path without extension, e.g. "cpp": "cplusplus/cplusplus-original" */
type IconMap = Record<string, string>;

async function main(): Promise<void> {
  const map = JSON.parse(await readFile(MAP_FILE, 'utf8')) as IconMap;
  await mkdir(OUT_DIR, { recursive: true });
  let copied = 0;
  const missing: string[] = [];
  for (const [slug, file] of Object.entries(map)) {
    const source = resolve(DEVICON_DIR, `${file}.svg`);
    try {
      await stat(source);
    } catch {
      missing.push(`${slug} -> ${file}`);
      continue;
    }
    await copyFile(source, resolve(OUT_DIR, `${slug}.svg`));
    copied++;
  }
  console.log(`[icons] copied ${copied} technology logos -> ${OUT_DIR}`);
  if (missing.length) {
    console.error(`[icons] missing devicon files:\n  ${missing.join('\n  ')}`);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
