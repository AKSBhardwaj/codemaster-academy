import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { strToU8, zipSync, type Zippable } from 'fflate';
import { lessonSourceSchema, type LessonSource } from '../../src/content-schema/technology';

const filenames: Record<string, string> = {
  javascript: 'main.js',
  c: 'main.c',
  cpp: 'main.cpp',
  python: 'main.py',
  csharp: 'Program.cs',
  java: 'Main.java',
};
const instructions = `# DSA in six languages

Each lesson teaches the same idea in JavaScript, C, C++, Python, C#, and Java.
Extract (unzip) the download first. Pick one language. Open its folder, then open a lesson folder.
The program in that folder is complete. Compare its result with expected-output.txt.
Try changing one small value, then run it again.

## Tools and commands

Install the tool for your language first. Open a terminal in the lesson folder.

| Language | Tool | Command |
| --- | --- | --- |
| JavaScript | Node.js (a current supported version) | node main.js |
| Python | Python 3 | python main.py (or python3 main.py) |
| C | GCC or Clang with C11 | gcc -std=c11 main.c -o main |
| C++ | GCC or Clang with C++17 | g++ -std=c++17 main.cpp -o main |
| Java | JDK 17 or newer | First: javac Main.java. Next: java Main. |
| C# | .NET SDK 8 or newer | dotnet run --project DsaPractice.csproj |

After compiling C or C++, run ./main on macOS/Linux or .\\main.exe in Windows PowerShell.
For Java, enter javac Main.java and press Enter. Then enter java Main and press Enter.
You can replace gcc with clang, or g++ with clang++, if you installed Clang.
Python on Windows may use py instead of python.
The C# projects target .NET 8 and allow a newer installed runtime. The first build may
download .NET reference files. Install the SDK, not just the runtime.

## Read before you begin

The website can run the JavaScript examples. The other five languages run on your computer.
No accounts, web server, database, or paid service are needed for these DSA examples.
These are small teaching programs. Read each lesson's limits before using the ideas in a larger app.
C arrays have fixed limits in several examples; stay within the sizes explained in the lesson.
Run one program at a time. In Java, each folder has its own class named Main.

The source files and expected results are generated from the website lessons during the build.
`;

/** Keep the downloadable programs identical to the displayed lesson variants. */
export function dsaSourceArchive(lessons: LessonSource[]): Uint8Array {
  const entries: Zippable = {};
  const add = (path: string, text: string): void => {
    entries[`dsa-six-languages/${path}`] = [strToU8(text), { mtime: new Date(1980, 0, 1) }];
  };
  if (!lessons.length) throw new Error('The DSA source download needs at least one lesson.');
  add('README.md', instructions);
  for (const lesson of lessons) {
    const tabs = lesson.blocks.filter((block) => block.type === 'code-tabs');
    if (tabs.length !== 1)
      throw new Error(`DSA lesson ${lesson.slug} needs one six-language example.`);
    const variants = tabs[0].variants;
    if (
      variants.length !== 6 ||
      Object.keys(filenames).some((key) => !variants.some((v) => v.language === key))
    )
      throw new Error(`DSA lesson ${lesson.slug} is missing a language.`);
    const output = lesson.blocks.find((block) => block.type === 'output');
    if (!output) throw new Error(`DSA lesson ${lesson.slug} needs an expected output.`);
    for (const variant of variants) {
      const folder = `${variant.language}/${lesson.slug}`;
      add(`${folder}/${filenames[variant.language]}`, `${variant.code.trimEnd()}\n`);
      add(`${folder}/expected-output.txt`, `${output.content.trimEnd()}\n`);
      if (variant.language === 'csharp') {
        add(
          `${folder}/DsaPractice.csproj`,
          `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <RollForward>LatestMajor</RollForward>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>
`,
        );
      }
    }
  }
  return zipSync(entries, { level: 9 });
}

export async function packageDsaTutorial(): Promise<void> {
  const root = resolve(import.meta.dirname, '../..');
  const source = join(root, 'src/assets/content/technologies/data-structures-algorithms/lessons');
  const lessons: LessonSource[] = [];
  for (const file of (await readdir(source)).filter((file) => file.endsWith('.json')).sort()) {
    lessons.push(lessonSourceSchema.parse(JSON.parse(await readFile(join(source, file), 'utf8'))));
  }
  const archive = dsaSourceArchive(lessons);
  await mkdir(join(root, 'public/downloads'), { recursive: true });
  await writeFile(join(root, 'public/downloads/dsa-six-languages.zip'), archive);
  console.log(`[downloads] packed ${lessons.length * 6} DSA source programs`);
}
