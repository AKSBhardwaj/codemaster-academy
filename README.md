# CodeMaster Academy

A frontend-only learning app built with Angular. Learners can open lessons, run small examples,
try quizzes, bookmark pages, and track progress without an account.

## Run locally

Use Node.js 24 LTS and npm.

```sh
npm ci
npm start
```

Open http://localhost:4200. `npm start` validates and compiles the tutorial JSON before starting Angular.
Start with `/start` for a short guide and an editable first web page.

## Build and preview

```sh
npm run build
npm run preview
```

Open http://localhost:4173. Publish **only** `dist/codemaster-academy/browser/` to a static host.
The build generates HTML pages, JavaScript, CSS, JSON, icons, and the local SQL engine. There is no
application server, database service, login, registration, or API to deploy. Angular's server files
are used at build time to generate static pages; they do not require a server in production.

Use a host that serves `<route>/index.html` and `404.html`. Do not rewrite every request to the home
page: that bypasses the generated pages. Keep asset URLs unchanged and serve over HTTPS.
The production command checks every page's metadata and requires complete content. It rejects
partial content builds. Set `PUBLIC_SITE_URL` to your public address when building outside GitHub.
Local builds use `http://localhost:4200`; the GitHub workflow supplies your actual Pages address.

## Publish on GitHub Pages

1. Push the project to a GitHub repository, for example `codemaster-academy`.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. Run **Publish CodeMaster Academy** in the Actions tab, or push to `main` or `master`.

The included workflow validates, tests, builds and uploads only the static website. It reads the
address from GitHub Pages and sets the base path, canonical URLs, sitemap and app icons together.
Project addresses such as `https://yourname.github.io/codemaster-academy/` are supported.
You do not need to choose or buy a domain first. If you later set a custom domain in Pages settings,
rerun the workflow to rebuild the metadata for that address.

See [deployment and search setup](docs/DEPLOYMENT.md) for a local public build, custom domains,
Google Search Console and Bing Webmaster Tools.

See [performance checks](docs/PERFORMANCE.md) for production Lighthouse results and how to
repeat them. Audit the static preview rather than the development server.

## What works in the browser

- HTML, CSS and JavaScript examples run in separate sandboxed frames.
- SQL runs with a bundled SQLite engine in a worker. Sample tables start fresh on each run.
- Other language examples can be read, edited and copied; their own tools are needed to run them.
- Lessons, bookmarks, quiz results, path choices and drafts stay in this browser on this device.
- `/dashboard` shows learning progress; `/settings` manages a nickname and saved learning data.
- Contact drafts are prepared locally. A draft is never reported as sent.

There is no cloud sync. Clearing site data or using private browsing can remove saved work. The
settings page can export a copy. The mobile layout has bottom navigation, large touch controls and
a home-screen manifest. This release needs an internet connection to load pages; it has no offline
service worker.

## Tutorials

All 149 catalog topics include lessons, exercises, a quiz, examples and a reference. Search by topic
or tag, choose a category, or follow one of the 12 learning paths. Course status is calculated from
validated files, and the release check rejects unfinished topics.

Source content lives in `src/assets/content/technologies/`. See
[the content authoring guide](docs/CONTENT-AUTHORING.md) for schemas and writing rules. New content
uses short sentences, explains new words, and teaches one small idea at a time for class 5 readers.
Existing later lessons also include more detailed technical examples for learners ready to continue.

The **C# .NET and Oracle Backend** course at `/tutorials/dotnet-oracle-backend` builds a Reading List
API in 14 lessons. Its separate [source project](examples/dotnet-oracle-backend/README.md) includes
Oracle setup, a browser client and a CRUD check script. Content builds package those sources into
`public/downloads/dotnet-oracle-backend.zip`; building the website does not need .NET or Oracle.
The API is for local practice and is not run by the tutorial website or GitHub Pages.

The **Data Structures and Algorithms** course at `/tutorials/data-structures-algorithms` has 28
lessons with a language chooser for JavaScript, C, C++, Python, C#, and Java. Each lesson has a
complete program in every language, a shared expected result, and a small change to try. The course
includes 42 exercises, 28 quiz questions, 28 reference entries, and 84 filtered examples. Content
builds create `public/downloads/dsa-six-languages.zip` directly from all 168 lesson programs.
JavaScript runs in the playground; the other languages have local setup instructions. Building
the website does not need any of those compilers or interpreters.

The **System Design** course at `/tutorials/system-design` has 30 lessons, eight diagrams,
30 practice questions, a 30-question quiz, examples, and a quick reference. It covers requests,
data, scaling, caching, queues, reliability, recovery, and security, then works through library,
short-link, chat, news-feed, and file-upload designs. Twelve JavaScript models and two SQLite
examples run in the existing browser playground. The worked designs are plans to study, with
no server, cloud account, or database service needed by the website.

## Checks

```sh
npm run content:validate
npm run lint
npm run lint:tools
npm run test:deployment
npm test -- --watch=false
npm run build
npm run test:e2e
```

Playwright covers desktop and mobile screens, keyboard use, accessibility, browser-local learning,
search, quizzes, and the playground. Set `E2E_PORT` if port 4200 is busy, or `E2E_BASE_URL` to test an
already served build. `npm run content:validate -- --only=html` checks a single tutorial during writing.
Generated content and build output are ignored by Git and recreated from source.

To include Firefox and Safari's WebKit engine in static-host checks, install those Playwright browsers
and set `CROSS_BROWSER=1` and `STATIC_SITE=1` with `E2E_BASE_URL` pointing at the built preview URL.
`e2e/static-host.spec.ts` also supports a repository prefix in that URL.
