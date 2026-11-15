# CodeMaster Academy — build progress

Phase plan and acceptance criteria live in the approved implementation plan. This file tracks what is done and what is pending; it is updated at the end of every phase.

## Phase 1 — Planning
- [x] Implementation plan (20 sections) approved on 2026-11-15.

## Phase 2 — Project foundation
- [x] Angular 22.2 workspace (standalone, zoneless, strict TS 6, Vitest, SCSS) generated with `npx -p @angular/cli@22`.
- [x] `@angular/ssr` in static output mode; Express server removed; server routes with manifest-driven prerender params.
- [x] Bootstrap 5.3.9 configured through SCSS variables (partial imports only), design tokens as CSS variables, light/dark themes with no-flash inline script.
- [x] ESLint (angular-eslint 22) + Prettier; `tools/` TypeScript config; Playwright config with desktop + mobile projects.
- [x] App shell: sticky navbar with Angular-native dropdowns, mobile offcanvas menu, theme switcher (system/light/dark, persisted), footer with trademark disclaimer, skip link, focus management after navigation.
- [x] SEO service (title, description, robots, canonical, Open Graph, Twitter, JSON-LD) applied from route data.
- [x] Routes for all 23 pages (lazy), tutorial layout with collapsible/searchable sidebar and mobile drawer, honest "being built" notices on unfinished pages.
- [x] Tooling: UI icon generator (Bootstrap Icons → path data, no icon font), technology logo copier (devicon), content pipeline stub, screenshot script.
- [x] Verification: production build (12 prerendered routes), unit tests, lint, e2e smoke (desktop + mobile), responsive screenshots at 375/768/1024/1440, committed.

## Phase 3 — Homepage and discovery
- [ ] Catalog data: 8 categories, ~150 normalised technologies with status, icons and genuine descriptions.
- [ ] Icon pipeline mapping (devicon logos + glyph fallbacks).
- [ ] Home page sections (hero, learning paths, popular tutorials, frameworks, categories, playground promo, featured, recent, exercises/quizzes, why us, FAQ).
- [ ] Tutorials catalog with filters, category pages, technology cards, learning paths list.
- [ ] Search dialog (Ctrl/Cmd+K) with MiniSearch over the core index; search results page.

## Phase 4 — Tutorial engine
- [ ] Zod content schemas; compiler (validate, enrich, Shiki tokens, manifest, search index, sitemap).
- [ ] Content service + loader seam; renderer with all block components; code block; inline markup.
- [ ] Technology overview, lesson page, sidebars from content, TOC, prev/next, breadcrumbs.
- [ ] HTML tutorial authored (~20 lessons).

## Phase 5 — Interactive learning
- [ ] Playground (CodeMirror, HTML sandbox, SQL worker, templates, capability labels).
- [ ] Exercises (6 types) + grading; quizzes + results; progress, bookmarks, recently viewed; learning path detail.

## Phase 6 — User experience
- [ ] Browser-local demo auth, guard, dashboard, profile, bookmarks page, recommendations, certificates.

## Phase 7 — SEO and optimisation
- [ ] JSON-LD per page type, sitemap/robots generation, noindex rules, budgets, hydration tuning, a11y audit, full e2e suite.

## Phase 8 — Content expansion
- [ ] Tier A: CSS, JavaScript, Python, SQL, TypeScript.
- [ ] Tier B: Bootstrap, Angular, React, Node.js, Java, C, C++, C#, MySQL, MongoDB, Git, GitHub, PHP, Spring Boot.
