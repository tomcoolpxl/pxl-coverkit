# PXL Cover Kit Implementation Plan

This plan turns `REQUIREMENTS.md` and `DESIGN.md` into a sequenced, reviewable build for the MVP. It is the project-state workflow file. Per-phase blueprints land in `IMPLEMENTATION_PHASE[N].md` (immutable once a phase starts), with `TODO.md` and `DONE.md` tracking execution.

## How this file is used

- This file is the **plan**, not a log. It changes when scope or sequence changes.
- Each phase has a section below with goal, scope, verification gate, and explicit out-of-scope.
- When a phase is about to start, copy its section into `IMPLEMENTATION_PHASE[N].md` and freeze it; refresh `TODO.md` from that blueprint.
- After a phase ships, move its verified deliverables into `DONE.md` and update this file only if scope shifted.
- Adjust `GEMINI.md` at the end of each phase if shared cross-tool rules changed.

## Workflow conventions

- **Trunk-based**: work directly on `main`. No per-phase branches, no pull requests. If a phase grows too large for one review cycle, split it into `phase-Na` / `phase-Nb` commits and ship them sequentially on `main`.
- **Phase gate** (per GEMINI.md "Verification" rule):
  1. `npm start` boots the app on `http://localhost:5173` without errors.
  2. `npm test` is green (Vitest).
  3. A short manual walkthrough script (listed per phase) is performed in Chrome.
- **Logs / cache**: never commit dev logs or Python cache (already covered by `.gitignore`).
- **No broad refactors, test removals, or directory moves** without asking first (GEMINI.md rule).

## Decisions snapshot

All architecture, UX, and stack decisions live in `DESIGN.md`. Highlights this plan assumes:

- Vue 3 + TypeScript + Vite + Vuetify 3, themed for PXL (Gold + Rich Black).
- `vue-router` in hash mode.
- Pinia with **`pinia-plugin-persistedstate`** using a custom storage object so the localStorage layer can swap to IndexedDB later without touching stores.
- `pdfmake` with bundled Carlito font via custom VFS.
- `vee-validate` + `zod` with `toTypedSchema`.
- Vitest + Vue Test Utils.
- GitHub Pages deploy via `actions/deploy-pages` with a checkout-free deploy job.

---

## Phase 0 — Already done (input to Phase 1)

Status: complete. Listed for traceability, not re-implemented.

- `scripts/scrape_studiegids_tree.py` crawls the public PXL studiegids for one academic year.
- `scripts/build_programmes_seed.py` converts a raw crawl into one year-specific runtime seed file.
- `seed-data/programmes.seed.2025-26.json` and `seed-data/programmes.seed.2026-27.json` exist and validate against `SEED_DATA_FORMAT.md`.
- `REQUIREMENTS.md`, `DESIGN.md`, `SEED_DATA_FORMAT.md`, `GEMINI.md` are in place.

The yearly refresh process is documented in Phase 6.

---

## Phase 1 — Skeleton, data layer, and Pages deploy

**Goal.** Stand up an empty but real app: themed shell, persisted state plumbing, seed loaded, import/export working, deployed to GitHub Pages. No card editing yet.

**In scope:**

- `npm create vite@latest` (vue-ts) + Vuetify 3 wired via `vite-plugin-vuetify` with autoImport.
- TypeScript strict mode, ESLint + Prettier, `npm start` aliased to `vite`.
- Vuetify PXL theme tokens from `DESIGN.md` §3.1.
- `vue-router` hash mode with the route table from `DESIGN.md` §3.2; placeholder views for `/`, `/cards/new`, `/cards/:id`, `/cards/:id/edit`, `/settings`, `/about`.
- Pinia stores: `settings`, `programmes`, `cards`, `wizard`. `pinia-plugin-persistedstate` configured with a single storage object that wraps `localStorage` under key `pxl-coverkit:v1`.
- Domain layer skeleton in `src/domain/`: `types.ts`, `schema.ts` (zod), `academicYear.ts`, `examTime.ts`, `filename.ts`, `overrides.ts` — implementation + unit tests.
- Seed loader: fetches `public/data/programmes.seed.<activeYear>.json` at boot, validates with zod, exposes `programmes` and `seedEntries`. Bundled seed JSON files copied into `public/data/` from `seed-data/`.
- Settings page: import / export JSON, active academic year switcher, app version + font credit.
- Empty overview page with empty-state copy pointing to "New cover" and "Import".
- Top app bar, persistent footer with version + about link.
- Vitest set up; tests for `domain/*` and seed validation.
- GitHub Actions workflow `pages.yml`: `build` job (checkout, install, `npm run build`, upload artifact) and `deploy` job (no checkout, `actions/deploy-pages@v4`). `VITE_BASE_PATH` set from repo name.
- Deployed empty shell reachable at the project Pages URL.

**Out of scope (defer to later phases):**

- Card creation, editing, actualize, delete (Phases 2–3).
- PDF generation and Carlito font wiring (Phase 4).
- Visual regression against reference PDFs (Phase 5).

**Verification gate:**

- `npm start` shows the themed shell with empty overview, settings page with working import/export of an empty state, programme/year filter selects populated from the loaded seed.
- `npm test` green: domain helpers and zod schemas covered.
- Pages deploy succeeds; the published URL loads the same empty shell.
- Manual walkthrough: import a hand-crafted JSON with one fake card → settings shows the card count; export → file downloads with `schemaVersion` field.

---

## Phase 2 — Card overview and create wizard

**Goal.** Make the overview real and let users create cards from seed entries or manually.

**In scope:**

- Overview grid (responsive 1/2/3 columns) reading from `cards` store; card tile per `DESIGN.md` §3.3.
- Filter bar: programme select, academic year select, free-text search across course code/name.
- "New cover" CTA opens the wizard (`/cards/new`).
- Wizard steps per `DESIGN.md` §3.4:
  1. Programme picker (auto-advance if only one).
  2. Seeded OLOD picker with search + `selectionContext` breadcrumbs, or "Manual entry".
  3. Review-and-save form prefilled from seed + settings defaults; inline validation via `vee-validate` + zod; Save disabled until required fields pass.
- Saving creates a card; overview reflects it; reload preserves it.
- "Dirty wizard" navigation guard.
- Tests: overrides merge precedence, wizard store transitions, filter selectors.

**Out of scope:**

- Full edit view, actualize, delete (Phase 3).
- PDF download button is rendered but disabled with a tooltip "Beschikbaar vanaf Phase 4".

**Verification gate:**

- `npm start` + Vitest green.
- Manual walkthrough: create a seeded card and a manual card; reload; both persist; filter by programme and by year both work.

---

## Phase 3 — Edit, actualize, delete

**Goal.** Complete the card lifecycle.

**In scope:**

- Card detail route (`/cards/:id`) showing summary + action row.
- Full update view (`/cards/:id/edit`) with form sections per `DESIGN.md` §3.6; live summary panel; saving updates the card and bumps `updatedAt`.
- Actualize dialog from a card per `DESIGN.md` §3.5: next academic year prefilled, new exam date required, optional start time + duration. Overwrites current state.
- Delete confirmation per `DESIGN.md` §3.7 (type course code OR delayed-enable button); undo snackbar restores within 5 s.
- Reusable lecturer autocomplete sourced from the `lecturers` store, seeded by observed values across cards.
- Tests: actualize logic, override merge after edit, delete + undo.

**Out of scope:** PDF rendering.

**Verification gate:**

- `npm start` + Vitest green.
- Manual walkthrough: edit a card, actualize a card to next year, delete a card and undo, delete a card and confirm gone after reload.

---

## Phase 4 — PDF generation

**Goal.** Generate the current Dutch two-page Blackboard exam cover PDF in the browser.

**In scope:**

- Carlito font (OFL) added under `src/pdf/fonts/`; small build-time Vite plugin generates a custom `vfs_fonts` blob and pdfmake is configured to use it. `vite.config.ts` updated with `optimizeDeps.include: ['pdfmake/build/pdfmake', 'pdfmake/build/vfs_fonts']`.
- Required PXL assets (logo, marks) added under `src/assets/pdf/` and imported as base64 by `pdf/template-nl-blackboard-v1/assets.ts`.
- `pdf/template-nl-blackboard-v1/`:
  - `tokens.ts` — sizes, spacing, colours.
  - `definition.ts` — exports `renderExamCoverPdfDefinition(data, template)` returning a `TDocumentDefinitions`.
  - `assets.ts` — bundled image data.
- Two-page A4 portrait output covering all visible elements listed in `REQUIREMENTS.md` §"Reference output".
- `domain/filename.ts` wired into the download flow producing the predictable filename.
- "Download PDF" button enabled on the overview card row, card detail, and full update view.
- Tests: snapshot tests for the doc definition on two fixtures (seeded and manual cards).

**Out of scope:**

- Visual regression vs. reference PDFs beyond ad-hoc comparison (Phase 5).
- English template, multi-part Blackboard sections.

**Verification gate:**

- `npm start` + Vitest green (snapshots).
- Manual walkthrough: download PDF for the `42TIN2260 Automation I` baseline card; visually compare to `examples/2526_42TIN2260_Automation_I_Examenvoorblad_S2.pdf`; check filename matches the expected pattern; open in Acrobat or a strict viewer to confirm both pages render.

---

## Phase 5 — Validation, accessibility, polish, deploy hardening

**Goal.** Reach MVP acceptance criteria from `REQUIREMENTS.md` §"Acceptance criteria for MVP".

**In scope:**

- Validation pass: every case from `REQUIREMENTS.md` §"Validation and error handling" produces a specific Dutch error message.
- Accessibility pass: keyboard walkthrough of overview, wizard, edit, actualize, delete, settings; focus order, visible focus rings, aria-describedby on errors, screen-reader announcements on step changes.
- Reference comparison: side-by-side compare generated PDFs against `examples/*.pdf` and address acceptable-drift outliers; document any deliberate deviation in `DESIGN.md`.
- Error boundaries: PDF generation failures, seed load failures, storage write failures, import schema mismatch — all surface user-meaningful messages.
- Pages workflow hardening: caching `~/.npm`, build matrix limited to Node 22 LTS, deploy job remains checkout-free.
- README written for end-user lecturers + maintainers (run, import/export, where seed files live, yearly refresh pointer).
- Final Vitest coverage check for the test areas listed in `REQUIREMENTS.md` §Testing.

**Out of scope:**

- Visual regression automation (post-MVP).
- Safari testing (post-MVP).

**Verification gate:**

- All MVP acceptance criteria from `REQUIREMENTS.md` pass during a single end-to-end walkthrough.
- `npm start` + `npm test` green.
- Pages deploy succeeds on `main` and the live URL passes the same walkthrough.

---

## Phase 6 — Seed refresh runbook (ongoing, post-MVP plumbing)

**Goal.** Make the yearly seed refresh boring and documented.

**Deliverables:**

- Short runbook (in `README.md` or `docs/seed-refresh.md`) covering:
  1. Run `python scripts/scrape_studiegids_tree.py --year YYYY-YY` to produce `seed-data/raw/studiegids-tree.YYYY-YY.json`.
  2. Run `python scripts/build_programmes_seed.py` to produce `seed-data/programmes.seed.YYYY-YY.json`.
  3. Copy the new seed file into `public/data/` (or wire the build to do it).
  4. Bump `ACTIVE_SEED_YEAR` in `src/app/activeAcademicYear.ts` if the academic year tick is intentional — that constant is the single source of truth for which seed bundle the app loads.
  5. Commit directly to `main` with the message `seed: refresh YYYY-YY`.
- A `package.json` script `npm run seeds:refresh:<year>` wraps the two Python steps for convenience.

This phase is not gated; it runs whenever a new academic year drops.

---

## Risks and watch-items

- **Font licensing.** Carlito is OFL; safe. If a future PXL institutional font is approved, only `src/pdf/fonts/` and `pdf/template-nl-blackboard-v1/tokens.ts` change.
- **Pages base path.** Most-common bug for project sites. Phase 1 deploys early specifically to surface this.
- **Reference layout drift.** Acceptable per `REQUIREMENTS.md`; track deltas explicitly in Phase 5 so silent regressions don't accumulate.
- **localStorage quota.** Far above what a card store needs, but `pinia-plugin-persistedstate` writes the full state on each change; consider per-store config if state grows unexpectedly.
- **Studiegids structure changes.** The scraper is validated against 2025-26 and 2026-27. A future tree-shape change would break Phase 6; the scraper code is the only thing that needs an update.
- **Vuetify major version churn.** Pin minor versions and review release notes before bumping.

## Definition of Done for the MVP

The MVP is shipped when:

- All five phases have shipped to `main` with their verification gates met.
- `DONE.md` lists every verified deliverable from `REQUIREMENTS.md` §"Acceptance criteria for MVP".
- `TODO.md` contains only post-MVP items.
- The live GitHub Pages URL serves an app that a lecturer can use to recreate the `42TIN2260 Automation I` baseline cover end-to-end with no manual DOCX step.
