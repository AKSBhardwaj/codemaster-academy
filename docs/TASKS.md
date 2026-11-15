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
- Playwright launches `ng serve` directly and refuses to reuse a running server (an orphaned server caused stale-content failures); set `E2E_PORT` when 4200 is taken by a development server.
- Demo accounts need a secure context (https or localhost) for Web Crypto; the register/login forms show a clear error otherwise.

## Phase 4 — Tutorial engine (done)

- [x] Zod schemas for overview, lessons (13 block types), exercises (6 types), quizzes, references, examples; JSON Schemas for editors.
- [x] Compiler: per-technology compile with sidebar-order validation, reading time, heading ids + TOC, prev/next, build-time Shiki tokens (css-variables theme → CSS classes, no runtime highlighter), referential checks (exercises, quiz, related lessons), internal broken-link check across all markup, status derivation, lesson/example search index, sitemap.xml (served at root), manifest for prerendering.
- [x] Renderer: @switch over block types with 13 block components; code block from precomputed tokens (copy, line numbers, highlighted lines, caption); inline markup AST renderer (no innerHTML); HTML output previews in a fully sandboxed iframe; click-to-load video embeds.
- [x] Tutorial layout with route-scoped context: sidebar from content with completed markers and search, contextual sidebar (TOC with active heading, progress, practice links, related tutorials), overview page (complete and honest planned states, Course JSON-LD only when complete), lesson page (breadcrumbs, meta, objectives, related, prev/next, mark complete), references and examples pages with filters, index pages listing published sets.
- [x] Progress store (browser-local, hydration-safe), breadcrumb/TechArticle JSON-LD builders.
- [x] HTML tutorial: 18 lessons, 31 exercises, 13-question quiz, 56-entry reference, 12 examples → status complete; 208 prerendered routes; 53-URL sitemap.
- [x] Verification: build, 12 unit tests (parser, renderer, code block, pipe, shell), lint, 26 e2e tests (desktop + mobile), screenshots.

## Phase 5 — Interactive learning (done)

- [x] Execution engines behind one contract: HTML/CSS/JS sandbox (opaque-origin iframe, CSP, nonce-checked console bridge), SQLite WASM worker seeded with sample tables, honest "unavailable" engine for other languages.
- [x] Lazy CodeMirror 6 editor (language packs on demand, light/dark, SSR textarea fallback); playground page (templates, run/stop/reset/copy/full-screen, Ctrl+Enter, per-language drafts, capability badges, SQL schema panel); output panel (preview, console, result tables).
- [x] Inline "try it" runners in lessons (deferred + incremental hydration) and "Try it" handoff from runnable code blocks.
- [x] Grading module (6 exercise types, output/SQL auto-checks, score summary) with unit tests; exercise + quiz stores.
- [x] Exercise cards (feedback, explanation, retry, solved state), coding tasks (editor, run, auto-check, checklist, solution), quiz runner (stepper, results, review, retry, history); per-technology pages and indexes; inline quiz/exercise blocks.
- [x] Bookmarks (tutorials + lessons), recently viewed, learning-path enrolment; learning-path detail with per-stage progress, honest planned-stage note and recommended next lesson; bookmarks page.
- [x] Verification: build (208 routes), 25 unit tests, lint, 54 e2e tests across 6 specs (desktop + mobile), screenshots.

## Phase 6 — User experience (done)

- [x] Browser-local demo accounts behind an `AUTH_PROVIDER` seam (salted SHA-256 password hashes via Web Crypto, session restored after hydration); every account screen carries the "demo account, this browser only" notice; register/login Reactive Forms with validation, duplicate-email and wrong-password errors, `returnUrl` support.
- [x] `authGuard` on dashboard and profile: the prerendered shell is allowed before the session is known, then a one-shot post-hydration redirect to `/login?returnUrl=`; client-side navigations are blocked immediately. Navbar and mobile menu switch between guest and signed-in links with a log-out action.
- [x] Dashboard: stats, continue learning, per-tutorial progress, enrolled-path progress, quiz history (with quiz titles), rule-based recommendations that state their rule and skip finished tutorials/enrolled paths, self-issued certificate offered only at 100 % of a path's published lessons (labelled unverified, printable).
- [x] Profile: edit name/email (persisted), member-since date, data summary, JSON export, "reset learning data" and "delete account" with inline confirmation.
- [x] Contact form: validated Reactive Form that hands the message to the visitor's email application (mailto) and states that nothing is stored or sent server-side.
- [x] Print stylesheet (certificate), `E2E_PORT` override for Playwright when port 4200 is in use.
- [x] Verification: build (208 routes), 28 unit tests, lint, 68 e2e tests across 7 specs (desktop + mobile; the navbar account-menu test is desktop-only by design), screenshots at 1440/375 in light and dark.
- Decision: `/bookmarks` stays open to guests (plan §5 listed it as guarded) because bookmarking works without an account and the data is browser-local either way; gating it would only pretend an account is needed.

## Phase 7 — SEO and optimisation

- [ ] JSON-LD per page type, sitemap/robots generation, noindex rules, budgets, hydration tuning, a11y audit, full e2e suite, credits page.

## Phase 8 — Content expansion

- [ ] Tier A: CSS, JavaScript, Python, SQL, TypeScript.
- [ ] Tier B: Bootstrap, Angular, React, Node.js, Java, C, C++, C#, MySQL, MongoDB, Git, GitHub, PHP, Spring Boot.
