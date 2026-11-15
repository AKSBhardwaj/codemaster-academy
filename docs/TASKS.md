# CodeMaster Academy — build progress

Phase plan and acceptance criteria live in the approved implementation plan. This file tracks what is done and what is pending; it is updated at the end of every phase.

## Phase 1 — Planning
- [x] Implementation plan (20 sections) approved on 2026-11-15.

## Phase 2 — Project foundation (done, commit "Phase 2")
- [x] Angular 22.2 workspace (standalone, zoneless, strict TS 6, Vitest, SCSS) generated with `npx -p @angular/cli@22`.
- [x] `@angular/ssr` in static output mode; Express server removed; server routes with manifest-driven prerender params.
- [x] Bootstrap 5.3.9 configured through SCSS variables (partial imports only), design tokens as CSS variables, light/dark themes with no-flash inline script.
- [x] ESLint (angular-eslint 22) + Prettier; `tools/` TypeScript config; Playwright config with desktop + mobile projects.
- [x] App shell: sticky navbar with Angular-native dropdowns, mobile offcanvas menu, theme switcher (system/light/dark, persisted), footer with trademark disclaimer, skip link, focus management after navigation.
- [x] SEO service (title, description, robots, canonical, Open Graph, Twitter, JSON-LD) applied from route data.
- [x] Routes for all 23 pages (lazy), tutorial layout with collapsible/searchable sidebar and mobile drawer, honest "being built" notices on unfinished pages.
- [x] Tooling: UI icon generator (Bootstrap Icons → path data, no icon font), technology logo copier (devicon), content pipeline stub, screenshot script.
- [x] Verification: production build, unit tests, lint, e2e smoke (desktop + mobile), responsive screenshots, committed.

## Phase 3 — Homepage and discovery (done)
- [x] Catalog data: 8 categories, 148 technologies (HTML5/CSS3 merged into HTML/CSS per spec) with genuine descriptions, three "what you will learn" highlights, tags, prerequisites, difficulty, popular/featured flags.
- [x] 11 learning paths (the 6 from spec §12 plus the §5 roadmap list) with honest topic stages for Projects, Authentication, Deployment, Maths and Angular Testing.
- [x] Home config (why-us, FAQ, playground promo, popular lists).
- [x] Zod content schemas (single source of truth; app imports types only) + JSON Schemas for VS Code; compiler validates references/icons/slugs, derives status (all 148 currently `planned`), emits compiled catalog, paths, home, search index, prerender manifest.
- [x] Content loading: `CONTENT_SOURCE` seam (HTTP in browser, disk on server) + TransferState handoff; `CatalogService` with signals/resources.
- [x] Icon pipeline: 116 devicon logos (plain variants for oversized files) + Bootstrap glyph tiles for topic entries.
- [x] Home page: all 12 sections (hero with live status counts, learning paths, popular languages, popular frameworks, categories, playground promo, featured, recently published with honest empty state, exercises/quizzes with honest empty state, why us, FAQ accordion, footer).
- [x] Tutorials catalog with search/category/status/difficulty filters, category pages with breadcrumbs + JSON-LD, learning paths index, technology/category/path cards, status badges.
- [x] Search: MiniSearch (lazy-loaded) over the compiled index, Ctrl/Cmd+K dialog (native `<dialog>`, keyboard navigation, recent searches, highlighted matches, empty state), `/search` results page with type filters; navbar Tutorials menu lists the categories.
- [x] Every route prerendered (186 routes), `404.html` generated post-build; `resource` error states guarded.
- [x] Verification: build, 5 unit tests, lint, 18 e2e tests (desktop + mobile), screenshots.

## Known limitations / follow-ups
- `ng serve` does not run `getPrerenderParams`, so parametrised routes render client-side in development; the production build prerenders them (verified).
- Logo attribution/credits page for CC-BY logos (Angular, Rust, Go, Git, …) to be added in Phase 7 alongside the footer disclaimer.
- Interactive, quiz and exercise blocks render honest static placeholders until the Phase 5 engines land.
- Playwright launches `ng serve` directly and refuses to reuse a running server (an orphaned server caused stale-content failures).

## Phase 4 — Tutorial engine (done)
- [x] Zod schemas for overview, lessons (13 block types), exercises (6 types), quizzes, references, examples; JSON Schemas for editors.
- [x] Compiler: per-technology compile with sidebar-order validation, reading time, heading ids + TOC, prev/next, build-time Shiki tokens (css-variables theme → CSS classes, no runtime highlighter), referential checks (exercises, quiz, related lessons), internal broken-link check across all markup, status derivation, lesson/example search index, sitemap.xml (served at root), manifest for prerendering.
- [x] Renderer: @switch over block types with 13 block components; code block from precomputed tokens (copy, line numbers, highlighted lines, caption); inline markup AST renderer (no innerHTML); HTML output previews in a fully sandboxed iframe; click-to-load video embeds.
- [x] Tutorial layout with route-scoped context: sidebar from content with completed markers and search, contextual sidebar (TOC with active heading, progress, practice links, related tutorials), overview page (complete and honest planned states, Course JSON-LD only when complete), lesson page (breadcrumbs, meta, objectives, related, prev/next, mark complete), references and examples pages with filters, index pages listing published sets.
- [x] Progress store (browser-local, hydration-safe), breadcrumb/TechArticle JSON-LD builders.
- [x] HTML tutorial: 18 lessons, 31 exercises, 13-question quiz, 56-entry reference, 12 examples → status complete; 208 prerendered routes; 53-URL sitemap.
- [x] Verification: build, 12 unit tests (parser, renderer, code block, pipe, shell), lint, 26 e2e tests (desktop + mobile), screenshots.

## Phase 5 — Interactive learning
- [ ] Playground (CodeMirror, HTML sandbox, SQL worker, templates, capability labels).
- [ ] Exercises (6 types) + grading; quizzes + results; progress, bookmarks, recently viewed; learning path detail.

## Phase 6 — User experience
- [ ] Browser-local demo auth, guard, dashboard, profile, bookmarks page, recommendations, certificates.

## Phase 7 — SEO and optimisation
- [ ] JSON-LD per page type, sitemap/robots generation, noindex rules, budgets, hydration tuning, a11y audit, full e2e suite, credits page.

## Phase 8 — Content expansion
- [ ] Tier A: CSS, JavaScript, Python, SQL, TypeScript.
- [ ] Tier B: Bootstrap, Angular, React, Node.js, Java, C, C++, C#, MySQL, MongoDB, Git, GitHub, PHP, Spring Boot.
