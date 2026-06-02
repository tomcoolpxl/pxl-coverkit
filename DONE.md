# DONE — verified deliverables

Per `GEMINI.md`: this file holds only verified work. Items land here after their phase verification gate passes (npm start, npm test, manual walkthrough where applicable).

## Phase 0 — Inputs (already complete before Phase 1)

- `scripts/scrape_studiegids_tree.py` — crawls the public PXL studiegids for one academic year.
- `scripts/build_programmes_seed.py` — converts one raw crawl into one year-specific runtime seed file.
- `seed-data/programmes.seed.2025-26.json`, `seed-data/programmes.seed.2026-27.json` — validated against `SEED_DATA_FORMAT.md`.
- `REQUIREMENTS.md`, `DESIGN.md`, `SEED_DATA_FORMAT.md`, `GEMINI.md`, `IMPLEMENTATION_PLAN.md` — in place.

## Phase 1 — Skeleton, data layer, and Pages deploy

Verified on 2026-06-02 via `npm start`, `npm test`, `npm run typecheck`, and `npm run build`.

### Project plumbing
- `package.json` with `start`, `dev`, `build`, `preview`, `test`, `test:watch`, `typecheck`, `lint`, `format` scripts.
- `vite.config.ts` with `@vitejs/plugin-vue`, `vite-plugin-vuetify` (autoImport), `@` alias, `VITE_BASE_PATH` env-driven base.
- `vitest.config.ts` with `jsdom` environment and matching `@` alias.
- `tsconfig.json` + `tsconfig.node.json` in strict mode.
- `index.html` shell (`<html lang="nl">`).
- ESLint flat config (`eslint.config.js`) + Prettier config.
- `.gitignore` extended for Node, Vite, ESLint, and coverage artifacts.

### Domain layer (pure TS + Vitest)
- `src/domain/types.ts` — `Programme`, `SeedEntry`, `CourseCard`, `AppSettings`, `ProgrammesSeedFile`, `ExportedState`, plus `CURRENT_SCHEMA_VERSION = 1`.
- `src/domain/schema.ts` — zod schemas with Dutch error messages for every required field listed in `REQUIREMENTS.md` §"Validation and error handling".
- `src/domain/academicYear.ts` — `parseAcademicYear`, `nextAcademicYear`, `shortAcademicYear`, `formatAcademicYear`.
- `src/domain/examTime.ts` — `parseHHMM`, `formatHHMM`, `endTime`, `examTimeRange`.
- `src/domain/filename.ts` — `slugifyCourseName`, `buildPdfFilename` matching `2526_42TIN2260_Automation_I_Examenvoorblad_S2.pdf`.
- `src/domain/overrides.ts` — defaults < seed < overrides merger; `splitSeedLabel` for "<code> <name>" labels.
- Vitest specs for each module (41 tests passing).

### Data layer
- `src/data/storage.ts` — `KeyValueStorage` interface + `localStorageAdapter` with in-memory fallback.
- `src/data/seed.ts` — `loadProgrammesSeed` fetches `public/data/programmes.seed.<year>.json`, validates with zod, throws `SeedLoadError`.
- `src/data/importExport.ts` — `buildExportPayload`, `serializeExport`, `parseImport`, `exportFilename`; surfaces `ImportError` with Dutch messages.
- `src/data/migrations.ts` — `migrateImported` stub for `schemaVersion = 1`.

### Stores (Pinia)
- `src/stores/settings.ts` — active academic year, default template/score/exam-chance/duration; persists.
- `src/stores/programmes.ts` — loads seed for active year on boot; not persisted.
- `src/stores/cards.ts` — CRUD methods; persists.
- `src/stores/wizard.ts` — slice for future wizard; not persisted.
- `src/app/pinia.ts` wires `pinia-plugin-persistedstate` with the custom `localStorageAdapter` under prefix `pxl-coverkit:v1:`.

### App shell + routing + pages
- `src/main.ts`, `src/App.vue` mount Vuetify + Pinia + Router; load seed on boot.
- `src/app/vuetify.ts` — PXL theme tokens (Gold `#AE9A64`, Rich Black `#030203`, Background `#FAF8F3`).
- `src/app/router.ts` — hash mode; routes `/`, `/cards/new`, `/cards/:id`, `/cards/:id/edit`, `/settings`, `/about`.
- `src/ui/AppShell.vue` — top app bar (wordmark, settings/about links) + persistent footer with version.
- `OverviewPage.vue` — empty-state with `New cover` (disabled in Phase 1) and Import CTA.
- `SettingsPage.vue` — academic-year switcher, JSON export, JSON import with feedback alerts, version + font credit.
- `AboutPage.vue` — privacy, Carlito font credit, studiegids source.
- Placeholder views for wizard, card detail, and card edit.

### Seed bundling
- `public/data/programmes.seed.2025-26.json` and `public/data/programmes.seed.2026-27.json` copied from `seed-data/`; served at runtime.

### CI / deploy
- `.github/workflows/pages.yml` — `build` job (Node 22, npm ci, `VITE_BASE_PATH=/${repo}/`) and **checkout-free** `deploy` job using `actions/deploy-pages@v4`.

### State files
- `IMPLEMENTATION_PHASE1.md` frozen blueprint, `TODO.md` refreshed against current phase, `DONE.md` (this file).

### Verification results
- `npm test` — 41 tests across 6 files passing.
- `npm run typecheck` — clean (vue-tsc --noEmit).
- `npm run build` — 318 modules, 2 s, no warnings.
- `npm start` — Vite 6.4.3 boots in ~265 ms; root and seed JSON return HTTP 200.

Still requires a real browser to fully clear the gate: manual import/export round-trip and Pages live URL check after merge.

## Phase 2 — Card overview and create wizard

Verified on 2026-06-02 via `npm test` (69 tests), `npm run typecheck`, `npm run build`, and `npm start` (HTTP 200 on root + seed JSON).

### Domain layer additions
- `src/domain/cardFactory.ts` — `buildCourseCard()` builds a `CourseCard` from form fields + optional seed + settings; computes `endTime`, tracks `overrides[]` against the seed-or-defaults baseline, tags `source` (`seeded` vs `manual`), copies the lecturers array. Pure; no Vue/Pinia/DOM imports.
- `src/domain/filters.ts` — `filterCards()`, `uniqueProgrammeCodes()`, `uniqueAcademicYears()` for the overview filter bar.

### Store changes
- `cards.ts` — `create()` action wraps `buildCourseCard()` and persists via the existing array. Phase 1's `replaceAll/upsert/remove/clear` left untouched.
- `wizard.ts` — full step machine (`programme` → `source` → `review`) with `next()`/`back()` guarded by `canAdvanceFromProgramme` / `canAdvanceFromSource`. `setProgramme()` clears stale source/draft state. `saveDraft()` + `markClean()` support the dirty navigation guard. `draftToFormFields()` helper bridges the wizard draft to `CardFormFields`.

### Wizard UI
- `src/features/wizard/WizardPage.vue` — Vuetify stepper host with `onBeforeRouteLeave` confirm guard and a `beforeunload` listener, both keyed off `wizard.dirty`.
- `WizardProgrammeStep.vue` — programme list with auto-advance when exactly one active programme is loaded.
- `WizardSourceStep.vue` — searchable seed-entry list scoped to the chosen programme, `selectionContext` breadcrumbs under the search box, plus a "Handmatige invoer" alternative.
- `WizardReviewStep.vue` — review form prefilled from `defaults < seed < draft`, `vee-validate` with `@vee-validate/zod` for inline Dutch validation, Save disabled until `meta.valid`, success route back to overview.

### Overview UI
- `OverviewPage.vue` — responsive 1/2/3 column card grid, sticky filter bar (programme / academic year / free-text search), programme + year selects populated from current cards, empty-state for no cards and a separate empty-state for over-filtered views, and per-tile disabled action row (PDF tooltip "Beschikbaar vanaf Phase 4"; Edit/Actualize/Delete tooltip "Beschikbaar vanaf Phase 3").

### Tooling
- `vee-validate@4.15.1` + `@vee-validate/zod@4.15.1` added as runtime dependencies.

### Tests added
- `src/domain/cardFactory.test.ts` (6 tests) — endTime + timestamps, override tracking, manual vs seeded source, lecturers array copying.
- `src/domain/filters.test.ts` (9 tests) — programme/year/search filters individually and combined, empty-criteria pass-through, unique lists sorted.
- `src/stores/wizard.test.ts` (10 tests) — step transitions, guard behaviour, programme-change clearing source, back/reset/markClean semantics.
- `src/stores/cards.test.ts` (3 tests) — `create()` appends, override-on-edit, manual-card source flag.

### State files
- `IMPLEMENTATION_PHASE2.md` frozen blueprint.
- `TODO.md` refreshed against Phase 2 (only the manual browser walkthrough remains).

### Phase 2 rework after user review (2026-06-02)
- New constant `src/app/activeAcademicYear.ts` exporting `ACTIVE_ACADEMIC_YEAR: AcademicYear = '2025-26'` — the active year is now hardcoded and bumped yearly by a maintainer commit; no runtime switcher.
- `AppSettings` no longer carries `activeAcademicYear`; `appSettingsSchema`, `useSettingsStore`, `buildExportPayload`, `parseImport`, and the related tests updated to the new shape.
- `App.vue` and `WizardReviewStep.vue` read the active year from the constant; the wizard review form no longer has an academiejaar input (the year is displayed as static text in the step header and stamped onto the card via `draftToFormFields`).
- `SettingsPage.vue` shows the active year as read-only copy and explains it ships from code; the year `<v-select>` is removed. Import/export remains for local data and the section copy now clarifies "Studiegidsdata zit in de app en hoef je niet te importeren."
- `OverviewPage.vue` empty state drops the "Importeren" CTA (single CTA: "Nieuw voorblad"). The filter bar drops the academiejaar `<v-select>`; only the programme select + free-text search remain.
- `WizardDraft` no longer carries `academicYear`. Wizard tests still pass with the trimmed shape.
- Verification after rework: `npm test` 69/69, `npm run typecheck` clean, `npm run build` clean (356 modules, 2.4 s), `npm start` HTTP 200.
