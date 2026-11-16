import { spawn } from 'node:child_process';
import { configureSite } from './configure-site';

async function run(args: string[]): Promise<void> {
  await new Promise<void>((done, fail) => {
    const child = spawn(process.execPath, args, { stdio: 'inherit', env: process.env });
    child.on('error', fail);
    child.on('exit', (code) =>
      code === 0 ? done() : fail(new Error(`Build step failed (${code}).`)),
    );
  });
}

async function main(): Promise<void> {
  if (process.env['CONTENT_ONLY'])
    throw new Error('A Pages release must include every tutorial. Unset CONTENT_ONLY.');
  const { baseHref } = await configureSite();
  await run(['node_modules/tsx/dist/cli.mjs', 'tools/content/cli.ts', 'build']);
  await run(['node_modules/@angular/cli/bin/ng.js', 'build', '--base-href', baseHref]);
  await run(['node_modules/tsx/dist/cli.mjs', 'tools/build/postbuild.ts']);
  await run(['node_modules/tsx/dist/cli.mjs', 'tools/build/seo-audit.ts']);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
