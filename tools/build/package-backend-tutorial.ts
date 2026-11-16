import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { zipSync, type Zippable } from 'fflate';

const project = 'dotnet-oracle-backend';
const root = resolve(import.meta.dirname, '../..');
const source = join(root, 'examples', project);
const output = join(root, 'public/downloads');
const sourceExtensions = new Set([
  '.cs',
  '.csproj',
  '.sql',
  '.html',
  '.js',
  '.css',
  '.ps1',
  '.md',
  '.http',
]);

/** Package teaching sources only. No SDK, server process, credentials or build output is deployed. */
export async function packageBackendTutorial(): Promise<void> {
  const entries: Zippable = {};
  async function collect(folder: string): Promise<void> {
    for (const entry of (await readdir(folder, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const file = join(folder, entry.name);
      if (entry.isDirectory()) {
        if (!['bin', 'obj', '.git', '.vs', 'node_modules'].includes(entry.name))
          await collect(file);
      } else if (entry.isFile()) {
        const path = relative(source, file).replace(/\\/g, '/');
        if (
          !sourceExtensions.has(extname(file)) &&
          ![
            '.gitignore',
            'ReadingListApi/appsettings.json',
            'ReadingListApi/Properties/launchSettings.json',
          ].includes(path)
        )
          continue;
        if (/appsettings\.json$/i.test(path)) {
          const config = JSON.parse(await readFile(file, 'utf8')) as {
            ConnectionStrings?: Record<string, unknown>;
          };
          if (Object.values(config.ConnectionStrings ?? {}).some(Boolean)) {
            throw new Error(
              'Keep database credentials in user-secrets, not the downloadable appsettings.json.',
            );
          }
        }
        entries[`${project}/${path}`] = [await readFile(file), { mtime: new Date(1980, 0, 1) }];
      }
    }
  }
  await collect(source);
  if (!entries[`${project}/ReadingListApi/Program.cs`] || !entries[`${project}/README.md`]) {
    throw new Error('The backend tutorial source project is incomplete.');
  }
  await mkdir(output, { recursive: true });
  await writeFile(join(output, `${project}.zip`), zipSync(entries, { level: 9 }));
  console.log(`[downloads] packed ${Object.keys(entries).length} backend tutorial source files`);
}
