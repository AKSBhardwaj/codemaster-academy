# CodeMaster Academy release status

Current release: 2026-11-16. This replaces the earlier phase notes and account-based design.

## Application

- [x] Frontend-only Angular application with static HTML for public routes.
- [x] Remove login, registration, authentication guards and account providers.
- [x] Keep learning progress, bookmarks, quiz results and drafts in browser storage.
- [x] Provide learning settings, a nickname, progress export and confirmed reset controls.
- [x] Provide a first-code guide, working playground, exercises, quizzes, references and learning paths.
- [x] Prepare feedback locally with copy/download; do not pretend a message was sent.
- [x] Modern typography, updated brand assets, light/dark themes and clearer lesson layouts.
- [x] Responsive navigation with mobile bottom tabs, touch controls and safe-area spacing.
- [x] Correct lesson section and skip links on nested pages and repository-based URLs.
- [x] Preserve early input during startup; make inline practice ready for mouse, touch and keyboard use.

## Curriculum

- [x] Finish the original 16 tutorials with 242 lessons.
- [x] Add all 132 remaining catalog tutorials with 12 lessons each.
- [x] Include exercises, quizzes, worked examples and references for every tutorial.
- [x] Use short explanations, topic-specific walkthroughs and small practice tasks in new lessons.
- [x] Replace obsolete Planned filters, notices and FAQ text.
- [x] Keep course descriptions accurate to their introductory scope.
- [x] Derive completion from validated content; reject incomplete release builds.

There are 149 tutorials, 1,874 lessons and 12 learning paths. The original 132 added tutorials each
began with 12 exercises and 12 recap questions, in addition to the original practice material.

The Data Structures and Algorithms course now has 28 lessons in JavaScript, C, C++, Python, C#,
and Java, with accessible language tabs, 42 exercises, 28 quiz questions, 28 references, and 84
examples with a language filter. Its source ZIP contains all 168 complete lesson programs and
their expected results. JavaScript runs in the existing playground; the other languages run locally.

The System Design course now has 30 lessons, eight responsive diagrams, 30 exercises, 30 quiz
questions, 30 examples, and 30 reference entries. Five worked app designs build on requests,
data, scaling, caching, queues, reliability, recovery, and privacy. The original 12 lesson URLs
and exercise IDs remain valid. Twelve JavaScript models and two SQLite examples run locally in
the browser; the plans do not add backend services to the application.

The C# .NET and Oracle Backend course adds 14 project lessons, exercises, quiz questions,
examples and reference entries, plus a four-stage learning path. Its downloadable Reading List
API is a separate local teaching project; the website still deploys static frontend files only.
The download is rebuilt from `examples/dotnet-oracle-backend` during content builds, without
build output or local secret files. The sample includes .NET 10, a pinned Oracle provider,
parameterized SQL, transactions, validation, SQL setup and a local browser client.

## Deployment and SEO

- [x] Generate deployment configuration from GitHub Pages or PUBLIC_SITE_URL.
- [x] Support a GitHub project prefix, a user Pages domain and custom domains.
- [x] Generate canonical URLs, titles, descriptions, social cards and structured data.
- [x] Generate sitemap.xml, robots.txt, 404.html, .nojekyll and an app manifest.
- [x] Audit final rendered HTML, sitemap coverage, internal links and required assets.
- [x] Provide a GitHub Actions build/test/deploy workflow that uploads only static files.
- [x] Document domain configuration, verification and sitemap submission in DEPLOYMENT.md.
- [x] Generate linked llms.txt and ARD guides for the real static tutorial resources.

## Loading speed

- [x] Inline production page CSS and preserve dark mode and the local font before external CSS arrives.
- [x] Preload the font, remove unused negative-margin rules, and defer global search and offscreen card hydration.
- [x] Preserve home search input and fix rapid search close/reopen handling.
- [x] Add compressed static preview responses with safe request cancellation.
- [x] Measure final production output in stable Chrome: mobile performance 95 median (92–97),
      desktop 100, accessibility/best practices/SEO 100, and applicable browsing checks 4/4.

The measurement method and limitations are recorded in [PERFORMANCE.md](PERFORMANCE.md).

## Validation

- Production and SEO counts are recorded in `dist/codemaster-academy/seo-report.json` after each build.
- Browser suite: 192 desktop/mobile checks passed, including DSA language tabs, accessibility scans, delayed CSS,
  search reopening, the project download and the static-host suite (STATIC_SITE=1). Two checks are skipped on the viewport where
  they do not apply.
- Cross-browser suite: 28 Firefox/WebKit checks passed for practice, delayed script loading,
  saved playground drafts, static routes, assets and responsive layouts.
  Four additional Firefox/WebKit checks passed for the new backend course's download and accessibility.
  The latest performance pass also verified 34 Firefox/WebKit checks for loading, keyboard focus,
  search, static routes and responsive layouts, with two intentional viewport skips.
- Static hosting: root and project-prefix checks cover direct links, no-JavaScript lessons, SQL,
  manifests, 404 responses and five screen widths. Additional checks use Firefox and WebKit.
- DSA browser coverage: 32 checks across Chromium desktop/mobile, Firefox and WebKit cover
  language tabs, keyboard controls, copying, JavaScript execution, filters, source downloads and hydration.
- System Design release checks: 24 browser checks passed across Chromium desktop/mobile,
  Firefox and WebKit, plus 54 regression checks for DSA, the backend course, practice, references,
  and static hosting. The 30-question quiz scored 100% with its authored answers; all eight
  diagrams loaded and stayed within the page. Light/dark accessibility and no-JavaScript pages passed.
- Application: 31 unit tests, lint and tool type checks pass. Deployment, critical stylesheet loading,
  fonts, discovery guides, code tabs, source packaging and System Design models have 41 focused tests.
- Content: ran 45 HTML, 11 SQLite, 84 language/backend, 122 Python and 67 JavaScript examples;
  compiled 24 ASP.NET programs and syntax-checked additional framework examples.
- DSA: all 168 complete programs compiled or ran with matching output (C11, C++17, Java 17,
  JavaScript, Python 3 and C#). Another 152 JavaScript/Python edge cases and both extra JavaScript
  coding-task solutions passed. C# checks used the download's .NET 8 target and newer-runtime setting.
- System Design: all 12 JavaScript and two SQLite models match their stated outputs. Additional
  change and failure checks cover empty routing, cache expiry, retry limits, and transaction rollback.
- Oracle project: Release build has no warnings/errors, dependency audit is clear, and 14
  API health/validation/error/CORS checks passed. The browser demo was checked with mocked HTTP.
  Live Oracle CRUD and transaction checks require a database; none was available here.

External framework and database examples have not all been run against installed services.
The new datasets and model lessons use local samples; no paid model API is needed by the app.

## Operational limits

No site has been published from this workspace. The owner must enable GitHub Pages and run the
workflow. Search-console verification/submission requires the owner's account and a live URL.
Search engines control indexing and rankings. Browser-local progress does not sync between devices,
and the site needs a connection to load files; no offline service worker is included.
