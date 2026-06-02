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
