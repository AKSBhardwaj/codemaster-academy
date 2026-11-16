# Content authoring guide

## Write for a class 5 reader

This is the writing standard for every new or revised tutorial, exercise, quiz and example.

- Use short sentences and familiar words. Teach one idea in each paragraph.
- Explain a new word the first time you use it. Example: "A loop repeats a step."
- Begin with something familiar, such as a school bag, fruit, a score or a recipe.
- Give small numbered steps. Show a tiny correct example and explain its result.
- Invite one small change the learner can try. Explain mistakes kindly and show how to fix them.
- Keep answers and explanations just as clear as the lesson. Avoid unexplained technical words.
- Do not add login, accounts, a server, a hosted database or secret keys to the application.
  Lessons can explain these topics using local examples, with any separate tools clearly named.
- The browser can run HTML, CSS, JavaScript and SQL. Say clearly when a separate tool is needed.
- Do not pad lessons to reach a reading-time target. Clarity matters more than length.

Read the whole lesson aloud before publishing. A short introduction alone does not make a dense
lesson suitable for a young reader. Later technical detail should build on clearly explained basics.

Every tutorial is plain JSON under `src/assets/content/technologies/<slug>/`, validated and compiled by
`npm run content:build` (Zod schemas in `src/content-schema/`, compiler in `tools/content/`). The HTML tutorial
(`technologies/html/`) is the reference implementation: copy its structure, not its sentences.

## Files per technology

| File                  | Purpose                                              | Required for status `complete` |
| --------------------- | ---------------------------------------------------- | ------------------------------ |
| `overview.json`       | Description, what you will learn, sidebar order, SEO | yes                            |
| `lessons/<slug>.json` | One file per lesson; the file name must equal `slug` | ≥ 12 lessons                   |
| `exercises.json`      | Graded exercises referenced by lessons               | ≥ 10 exercises                 |
| `quiz.json`           | End-of-tutorial quiz                                 | ≥ 10 questions                 |
| `reference.json`      | Grouped quick reference                              | ≥ 1 entry                      |
| `examples.json`       | Copy-ready examples                                  | ≥ 1 example                    |

Status is derived by the compiler, never hand-set: `complete` needs all thresholds above, otherwise `in-progress`
(≥ 1 lesson) or `planned`. The catalog entry (`catalog/technologies/*.json`) already exists for every technology;
do not edit it.

## overview.json

```json
{
  "slug": "css",
  "description": "150–900 characters. What the technology is, what the tutorial covers, why it matters.",
  "versionNote": "optional, 10–200 characters, e.g. the version the lessons target",
  "whatYouWillLearn": ["3–10 items, 10–140 characters each"],
  "learningObjectives": ["3–10 items, 10–160 characters each, start with a verb"],
  "sidebarCategories": [
    { "id": "basics", "title": "Basics", "lessonSlugs": ["introduction", "..."] }
  ],
  "seo": { "title": "10–70 chars, keep ≤ 60", "description": "50–170 chars, keep 120–160" }
}
```

Every lesson file must appear in exactly one `sidebarCategories` entry; the order there is the reading order
(previous/next links come from it). 1–10 categories.

## lessons/<slug>.json

```json
{
  "schemaVersion": 1,
  "slug": "introduction",
  "title": "3–90 chars, e.g. \"CSS Introduction\"",
  "summary": "40–200 chars, one or two sentences for lists and search.",
  "introduction": "60–600 chars. Why this matters and what the reader will do.",
  "learningObjectives": ["2–6 items, 10–140 chars, start with a verb"],
  "blocks": [],
  "exerciseIds": ["optional, up to 10 ids from exercises.json"],
  "relatedLessons": [{ "technologySlug": "css", "slug": "selectors" }],
  "seo": {
    "title": "10–70 chars, keep ≤ 60 (the site adds the brand)",
    "description": "120–160 chars"
  },
  "updatedOn": "2026-11-15"
}
```

`relatedLessons` (0–6) may only reference lessons that exist: your own technology or the HTML tutorial
(`html/introduction`, `editors`, `basic-examples`, `elements`, `attributes`, `headings`, `paragraphs`, `formatting`,
`links`, `images`, `tables`, `lists`, `forms`, `input-types`, `semantic-elements`, `audio-video`, `apis`, `seo`).

### Block types (`blocks`, 3–80 per lesson)

| type          | fields                                                                                                    | notes                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `heading`     | `level` 2/3/4, `text` 2–120                                                                               | Level 2 and 3 headings build the table of contents; ids are generated         |
| `paragraph`   | `text` 1–2000                                                                                             | Inline markup allowed                                                         |
| `list`        | `ordered`, `items[]` 1–30                                                                                 | Items allow inline markup                                                     |
| `code`        | `language`, `code` ≤ 20000, `title?` ≤ 80, `caption?`, `highlightLines?`, `showLineNumbers?`, `runnable?` | `runnable: true` only for html, css, javascript, sql                          |
| `output`      | `content` ≤ 10000, `kind?` `text` or `html`, `title?`                                                     | `text` = terminal style; `html` renders in a sandboxed frame                  |
| `alert`       | `variant` info/warning/success/danger, `title?`, `text`                                                   | Use `warning` for common mistakes                                             |
| `table`       | `headers[]` 2–6, `rows[][]`, `caption?`                                                                   | Every row needs one cell per header                                           |
| `image`       | `src`, `alt` 3–200, `width`, `height`, `caption?`                                                         | Only for assets that exist under `src/assets/images/`; prefer code and tables |
| `video`       | `provider: "youtube"`, `videoId`, `title`                                                                 | Click-to-load; avoid unless essential                                         |
| `callout`     | `icon?`, `title` 2–80, `text`                                                                             | Tips, "try it" nudges. Icon names come from the UI icon set, e.g. `lightbulb` |
| `interactive` | `language` html or sql, `code`, `title?`, `height?` 80–800                                                | Editable runner inside the lesson                                             |
| `quiz`        | `title?`, `questions[]` 1–5                                                                               | Inline quick check; same question shapes as quiz.json (no coding tasks)       |
| `exercise`    | `exerciseId`                                                                                              | Embeds an exercise from exercises.json                                        |

Inline markup in text: `**bold**`, `*italic*`, `` `code` ``, `[text](/absolute/site/path)` or `[text](https://…)`.
Internal links must be real routes: `/tutorials/<any catalog slug>`, `/tutorials/<slug>/<existing lesson>`,
`/playground`, `/references/<slug>` etc. The compiler fails on broken internal links. Never use raw HTML in text.

### Runnable code

- `html`: rendered as a page in a sandboxed frame; CSS and JS inside `<style>`/`<script>` run.
- `css`: wrapped around a fixed sample page (`h1`, `p` with link/strong/code, `ul` with three `li`, `div.card` with
  `h2`, `p`, `button`). Write CSS that styles those elements.
- `javascript`: runs in a sandboxed page; `console.log` output appears in the console panel.
- `sql`: runs in SQLite (sql.js) seeded with the sample tables defined by `sqlSetup` in
  `src/assets/content/site/playground.json` (`customers`, `products`, `orders`, with the rows listed there).
  Statements may also create their own tables.
- Everything else (python, java, …) is syntax-highlighted only. Never mark it runnable and never claim it runs here.

Use the `interactive` block (html/sql) for "try it yourself" moments. Pair important `code` blocks with an `output`
block showing exactly what the code produces.

### One example in several languages

Use `code-tabs` when several programs teach the same idea. Explain the idea once, then place a shared `output`
block after the group. The first language is shown unless `defaultLanguage` names another variant.

```json
{
  "type": "code-tabs",
  "title": "Add two scores",
  "defaultLanguage": "javascript",
  "variants": [
    { "type": "code", "language": "javascript", "code": "console.log(3 + 4);", "runnable": true },
    { "type": "code", "language": "python", "code": "print(3 + 4)", "caption": "Run this with Python on your computer." }
  ]
}
```

A group needs 2 to 8 variants with different language ids. Each variant accepts the same fields as `code`,
including a caption, line numbers and highlighted lines. Use `javascript`, `c`, `cpp`, `python`, `csharp` and
`java` for the six DSA languages. The chooser shows their familiar names, including C++ and C#.
Only HTML, CSS, JavaScript and SQL may be runnable. Other languages need local tools.
The compiler highlights every variant, checks links in every caption, and counts the selected default code
for reading time. The default example is readable before JavaScript loads; language switching becomes
available after the page is ready.

## exercises.json

```json
{ "title": "CSS Exercises", "description": "40–300 chars", "exercises": [] }
```

Shared fields: `id` (kebab-case, unique, prefix with the technology, e.g. `css-box-model-padding`), `lessonSlug`
(must exist), `difficulty` beginner/intermediate/advanced, `question` 10–600, `explanation` 20–800 (teach, don't
just state the answer).

| type              | extra fields                                                                          |
| ----------------- | ------------------------------------------------------------------------------------- |
| `multiple-choice` | `options[]` 2–6, `correctIndex`                                                       |
| `true-false`      | `correct`                                                                             |
| `fill-blank`      | `answers[]` 1–6 (accepted answers), `caseSensitive?`; the question must contain `___` |
| `predict-output`  | `language`, `code`, `options[]`, `correctIndex`                                       |
| `find-error`      | `language`, `code`, `options[]`, `correctIndex`, `errorLine?`                         |
| `coding-task`     | `language`, `starterCode`, `solutionCode`, `checklist[]` 2–8, `check?`                |

`check` is optional and only meaningful where the playground executes the code: `{ "kind": "console-output",
"expectedLines": ["..."] }` for JavaScript, `{ "kind": "sql-result", "expectedColumns": [...], "expectedRows": [[...]] }`
for SQL. Coding tasks for other languages rely on the checklist and the solution.

Aim for 12–20 exercises covering most lessons, mixing all six types. Reference 1–2 per lesson through
`exerciseIds`, and embed the best one with an `exercise` block.

## quiz.json

```json
{
  "id": "css-quiz",
  "title": "CSS Quiz",
  "description": "40–300 chars",
  "passPercent": 70,
  "questions": []
}
```

5–60 questions (write 12–15), any exercise type except coding tasks, ids unique (e.g. `css-q-01`), each with a
`lessonSlug` that exists, spread across the tutorial.

## reference.json

```json
{
  "title": "CSS Reference",
  "description": "40–300 chars",
  "groups": [
    {
      "id": "selectors",
      "title": "Selectors",
      "entries": [
        {
          "slug": "class-selector",
          "name": ".class",
          "summary": "20–300 chars",
          "syntax": "≤ 300 chars",
          "example": { "language": "css", "code": "..." },
          "notes": ["≤ 6"],
          "lessonSlug": "selectors"
        }
      ]
    }
  ]
}
```

Write 25–60 entries in 4–8 groups; `syntax`, `example`, `notes` and `lessonSlug` are optional.

## examples.json

```json
{
  "title": "CSS Examples",
  "description": "40–300 chars",
  "examples": [
    {
      "id": "centered-card",
      "title": "…",
      "description": "20–300 chars",
      "language": "css",
      "code": "…",
      "output": "optional expected output",
      "runnable": true,
      "tags": ["layout"],
      "lessonSlug": "flexbox"
    }
  ]
}
```

Write 10–15 examples. `runnable` must be true only for html/css/javascript/sql.

## Quality checklist (what the compiler cannot check, reviewers will)

1. Original text written for this site; no placeholder sentences, no "lorem ipsum", no "coming soon".
2. Every code example is correct for the stated version and runs as written; outputs match exactly.
3. Each lesson: 4–12 minutes of reading (words ÷ 200 + code lines ÷ 40), ≥ 3 code blocks with outputs where it makes
   sense, ≥ 1 `warning` alert describing a common mistake, ≥ 1 related lesson, one idea per section, `level: 2`
   headings for sections and `level: 3` for sub-steps.
4. Explain _why_ before _how_; the first lesson of a tutorial must say what the technology is for and what it is not.
5. Facts and version numbers must be accurate as of 2026; when behaviour differs between versions or dialects, say so.
6. SEO title ≤ 60 characters, description 120–160 characters, unique across the site.
7. No tracking, no external scripts, no external images.

## Validate

```bash
npm run content:validate                 # every technology, writes nothing
npm run content:validate -- --only=css   # just your tutorial (HTML is always included for related lessons)
npm run content:build                    # validate + compile to .generated/content (one person at a time)
```

Validation prints a file path and message for every schema or reference problem, grouped per technology, and the
summary line reports how many technologies are complete; the new tutorial should appear there once all thresholds
are met. While several tutorials are being written at once, use `--only=<slug>` so another folder's unfinished
files do not hide your own result. `npm run build` then prerenders every lesson route and regenerates the sitemap.
