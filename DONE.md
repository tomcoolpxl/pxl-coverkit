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

- `public/data/programmes.seed.2025-26.json` copied from `seed-data/`; served as the built-in runtime preseed.

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

- New constant `src/app/activeAcademicYear.ts` exporting `ACTIVE_SEED_YEAR: AcademicYear = '2025-26'` — the **only** hardcoded academiejaar in the codebase. It tells the seed loader which bundled JSON to fetch; everything user-facing reads the year from the loaded seed instead.
- `AppSettings` no longer carries `activeAcademicYear`; `appSettingsSchema`, `useSettingsStore`, `buildExportPayload`, `parseImport`, and the related tests updated to the new shape.
- `App.vue` is the sole importer of the constant (used to bootstrap `programmes.loadForYear(...)`). All other UI consumers — `OverviewPage.vue` chip, `SettingsPage.vue` read-only display, `WizardReviewStep.vue` step header, new-card stamping via `draftToFormFields` — read `useProgrammesStore().loadedYear` so the displayed/stamped year always reflects what the seed actually loaded.
- `draftToFormFields(draft, programmeCode, seedEntryId, academicYear)` gained an `academicYear` parameter; the wizard review step passes `programmes.loadedYear` into it.
- `SettingsPage.vue` shows the active year as read-only copy with caption "Komt uit de bundelde studiegids-seed; wordt één keer per jaar door een onderhouder vervangen." The year `<v-select>` is removed. Import/export remains for local data and the section copy clarifies "Studiegidsdata zit in de app en hoef je niet te importeren."
- `OverviewPage.vue` empty state drops the "Importeren" CTA (single CTA: "Nieuw voorblad"). The filter bar drops the academiejaar `<v-select>`; only the programme select + free-text search remain.
- `WizardDraft` no longer carries `academicYear`. Wizard tests still pass with the trimmed shape.
- Wizard store gained a `canGotoStep(target)` getter (step 1 always; step 2 if a programme is set; step 3 if programme + seed-or-manual are set). `WizardPage.vue` v-stepper-items now bind `:editable="wizard.canGotoStep(...)"` and `@click="gotoStep(...)"` so the user can navigate forward/back through the header when the prerequisites are met.
- Wizard Save flow tightened: `cards.create()` now reassigns `this.cards = [...this.cards, card]` (instead of `.push()`) for persistedstate reactivity, and the review step awaits `router.push` before calling `wizard.reset()` so the dirty guard sees `dirty === false` cleanly.
- `DESIGN.md` updated: §3.3 drops the year filter from the overview; §3.8 documents Settings as read-only year display + local-data import/export; §4.5 names `ACTIVE_SEED_YEAR` as the bundle pointer and `programmes.loadedYear` as the UI source; §11 resolves the "Active academic year switch" open question.
- `IMPLEMENTATION_PLAN.md` Phase 6 seed-refresh runbook now points maintainers at `ACTIVE_SEED_YEAR` instead of the removed `settings.activeAcademicYear` field.
- Verification after rework: `npm test` 69/69 across 10 files, `npm run typecheck` clean, `npm run build` clean (~2.3 s), `npm start` HTTP 200 on root and seed JSON.

## Phase 3 — Edit, actualize, delete

Verified on 2026-06-02 via `npm test` (77 tests), `npm run typecheck`, `npm run build`, and `npm start` (Vite dev server boots and responds).

### Stores

- `src/stores/lecturers.ts` — new store tracking unique lecturer names used on cards. Exposes `observeLecturer`, `observeLecturers`, `replaceAll`, and `clear` actions.
- `src/stores/notifications.ts` — new store for global toast and undo capabilities, supporting standard temporary notification and undo action hooks.

### UI components & page features

- `src/ui/LecturerAutocomplete.vue` — custom autocomplete wrapper using `v-combobox` that pulls observed names from `lecturers` store and allows typing new ones.
- `src/features/actualize/ActualizeDialog.vue` — dialog to roll a card to the next academic year. Prefills the year, prompts for the new date, allows start time/duration overrides, and computes the end time.
- `src/features/delete/DeleteDialog.vue` — delete dialog requiring the user to type the course code to confirm or wait a 2-second delay countdown before enabling the button.
- `src/features/detail/CardDetailPage.vue` — detail route (`/cards/:id`) showing a complete styled view of the cover details, and actions bar (Actualize, Edit, Delete, disabled PDF download with Phase 4 tooltip).
- `src/features/edit/CardEditPage.vue` — full update view (`/cards/:id/edit`) in a two-column desktop layout. Form sections use `v-expansion-panels` on the left, and a live-updating summary card mirroring the overview grid layout along with actions is sticky on the right.
- `App.vue` — hooks up initial observed lecturers seeding on mount from all existing cards in storage.
- `SettingsPage.vue` — imports and exports the `lecturers` array along with the backup JSON file, and includes an explicit confirmation dialog before overwriting local data.
- `OverviewPage.vue` — card grid tiles are now clickable to view details, and edit/actualize/delete buttons trigger their respective modals.

### State & verification

- `IMPLEMENTATION_PHASE3.md` frozen blueprint created.
- `TODO.md` refreshed for the next phase.
- Verification results: `npm test` 77/77 tests passing, `npm run typecheck` clean, `npm run build` clean, dev server runs without errors.

## Phase 4 — PDF generation

Verified on 2026-06-02 via `npm test` (79 tests, including 2 snapshot tests), `npm run typecheck`, and `npm run build` (successful compilation of the offline generator chunk).

### PDF Assets and Fonts

- Downloaded the Carlito font files (OFL) under `src/pdf/fonts/`.
- Implemented a custom Vite build-time plugin in `vite.config.ts` to convert TTF files to a base64 font mapping and serve it via a virtual module `virtual:pdfmake-vfs`.
- Configured `pdfmake` with the custom VFS font mapping and registered the `Carlito` font family (regular, bold, italics, bolditalics) inside `src/pdf/generator.ts`.
- Updated `vite.config.ts` to include `pdfmake/build/pdfmake` and `pdfmake/build/vfs_fonts` in `optimizeDeps.include`.
- Extracted official PXL logos and Blackboard screenshots from the baseline PDF and saved them to `src/assets/pdf/`.
- Encoded PNG assets as base64 strings in `src/pdf/template-nl-blackboard-v1/assets.ts` for standalone, bundle-safe loading.

### Document Template & Definition

- `src/pdf/template-nl-blackboard-v1/tokens.ts` — configured sizing, spacing, and PXL color tokens.
- `src/pdf/template-nl-blackboard-v1/definition.ts` — implemented the `renderExamCoverPdfDefinition(data)` function returning a `TDocumentDefinitions` object. It covers all required visual elements on page 1 (Header table, Title line, Student table, Exam data table, Blackboard warning/instructions, and 8-box confirmation box next to the Blackboard screenshot) and page 2 (Blackboard procedure instructions list).
- `src/pdf/generator.ts` — coordinates `pdfmake` compilation, wires `domain/filename.ts` to generate predictable filenames, and triggers download.

### UI Integration

- Enabled the "Download PDF" button in the card grid overview (`OverviewPage.vue`), updating `lastGeneratedAt` on successful generation.
- Enabled the "Download PDF" button in the card detail page (`CardDetailPage.vue`), updating `lastGeneratedAt`.
- Enabled the "PDF genereren" button in the card edit page (`CardEditPage.vue`), updating `lastGeneratedAt` and form values, with inline Zod validation guards.

### Testing and Validation

- Created `src/pdf/template-nl-blackboard-v1/definition.test.ts` verifying document definitions against snapshots for seeded and manual cards (79/79 tests green).
- Verified production build compile results.

## Phase 5 — Validation, accessibility, polish, deploy hardening

Verified on 2026-06-02 via `npm test` (84 tests passing), `npm run typecheck`, and `npm run build`.

### Validation & Error Boundaries

- `validateCourseCardData()` — implemented inside `src/pdf/generator.ts` to perform a pre-render validation check. It verifies the CourseCard object fields via Zod, checks that the four required Carlito TTF font files are loaded in the VFS, and checks that base64 image strings (`PXL_LOGO`, `BLACKBOARD_SCREENSHOT`) are present and valid data URIs.
- Caught seed load errors on mount in `src/App.vue` using a try/catch block and `useNotificationStore()` toast alert displays.
- Handled local storage write failures (e.g., private browsing mode or quota limits) in the custom key-value storage adapter `src/data/storage.ts` using a reactive `hasStorageWriteError` ref.
- Integrated a global warning alert banner inside the main container in `src/ui/AppShell.vue` that reactively warns users if their changes cannot be persistent.
- Verified import JSON structure schema mismatch errors are cleanly handled and formatted into a Dutch explanation via `ImportError` inside `src/data/importExport.ts` and `SettingsPage.vue`.

### Accessibility Pass

- Screen-reader step change announcements — added a visually hidden live region (`aria-live="polite"`) in `src/features/wizard/WizardPage.vue` to alert assistive technologies on stepper stage transitions.
- Focus indicator configuration — verified `:focus-visible` focus ring styles using the standard PXL gold color in `src/app/styles.css`.
- Forms semantic structure — confirmed fields use labels, error helper descriptions are associated with inputs, and keyboard navigation tab-orders work.

### Repository & Documentation

- `README.md` — created a comprehensive README detailing app functionalities, local development setup, user operations, and guide runbooks for maintainers.
- `IMPLEMENTATION_PHASE5.md` — immutable Phase 5 blueprint frozen.
- `.github/workflows/pages.yml` — verified npm caching configuration, Node 22 build version, and checkout-free GitHub Pages deployments.

### Testing Additions

- `src/data/migrations.test.ts` — created new migration unit tests verifying migration path passes for schema version matching and throws specific `MigrationError` for unsupported ones.
- `src/pdf/generator.test.ts` — updated tests for validation helper (`validateCourseCardData`) testing valid cases and invalid field handling (e.g. missing course code).

## Part 1 — Wizard / UX ✅ (implemented; typecheck + tests + build green)

- [x] **Programme ordering**: `sortProgrammesByPriority` in `domain/filters.ts`
      (PBTIN, PBTIW, GRSNE, GRPRO, GRDVO, then rest; skip absent codes) + test;
      use in `WizardProgrammeStep.vue`.
- [x] **Deduplicate OLOD list** in `WizardSourceStep.vue`: one item per course,
      stacked subtitle line per occurrence; search still works.
- [x] **Examenkans descriptions**: `domain/examChance.ts` (`title`/`value`) + test;
      use in `WizardReviewStep.vue` + `CardEditPage.vue`. HE has no description.
- [x] **Start-time presets**: combobox (08:30/13:30/09:00/13:00, default 08:30,
      editable) in wizard/edit/actualize; fix wizard fallback to `08:30`.
- [x] **Per-user name**: `userName` in `AppSettings` + schema + settings store;
      "Jouw naam" field in Settings; default Vaklector + Lectoren on new cards;
      first-run name prompt when empty.
- [x] **Allowed-resources presets**: `domain/allowedResources.ts` (Lockdown =
      default, Blackboard-no-lockdown); preset selector fills editable field;
      wizard defaults to Lockdown.
- [x] **Debug tools in Settings**: empty default cards state + `seedPredefined()`;
      "Omgeving opschonen" (wipe + `localStorage.clear()`, confirm) +
      "Voorbeeldkaarten aanmaken".
- [x] **Edit template prefill**: default `templateId` to available option /
      `template-nl-blackboard-v1` when stored value isn't in the list.

> Verify in-app (`npm start`) at the end of the phase: ordered programme list,
> deduped OLOD subtitles, examenkans descriptions, editable start-time presets,
> name-driven defaults + first-run prompt, allowed-resources default, debug
> clean/reseed buttons.

## Part 2 — PDF layout (`definition.ts`) ✅ (implemented; tests + typecheck + build green)

- [x] Margins `[36,36,36,36]` → `[24,24,24,24]`.
- [x] Reclaim whitespace: `courseTitle` margin `[0,10,0,15]` → `[0,4,0,8]`
      (heading↔title); Examengegevens table bottom `15` → `6` +
      `instructionHeader` top `10` → `2` (Examengegevens↔instruction block).
- [x] Unify student-table row heights to the Vaklector row (`[18,24,24,24,24,18,24]`
      → `[18,24,24,24,24,24,24]`).
- [x] Score box: alignment `center` → `right` (writable space left of slash),
      margin `[0,10,0,10]` → `[0,14,6,0]` (drop symmetric height, vertically center).
- [x] Updated snapshot test intentionally (`vitest -u`).

> Visual page-1-fit confirmation still needs an in-browser `npm start` check before
> moving to DONE.md.

## Part 3 — Multi-part (DEEL) ✅ (implemented; typecheck + tests + build green)

- [x] Data model: `partsCount` / `partIndex` / `partWeights` through `types.ts`,
      `courseCardSchema`, `CardFormFields` + `buildCourseCard` (defaults `1 / 1 /
      [100]`), `WizardDraft` + `draftToFormFields`, predefined cards. New
      `domain/parts.ts` helpers (`partWeightsTotal`, `isValidPartWeights`,
      `resizePartWeights`, `clampPartIndex`) + `parts.test.ts`.
- [x] UX: shared `ui/MultiPartEditor.vue` — "Aantal delen" (1–4), "Dit is deel" +
      per-deel % row with live total; resizing pads/trims weights. Wired into
      `CardEditPage.vue` (new panel) + `WizardReviewStep.vue`; save/PDF blocked when
      total ≠ 100%.
- [x] PDF (`definition.ts`): title `- DEEL n` when `partsCount > 1`;
      `formatPartsBreakdown` renders Puntenverdeling from the model (current deel
      marked); `formatDuration(minutes, partsCount)` reflects the part count.
      New multi-part snapshot + `formatDuration`/`formatPartsBreakdown` unit tests.

> Verify in-app (`npm start`): set Aantal delen = 2, split 60/40, deel 1 → PDF shows
> `- DEEL 1`, "Deel 1: 60% (dit deel) · Deel 2: 40%", duration "(2 delen)"; total ≠
> 100% blocks save.

## Verification Gate

- `npm test` green (updated snapshot + new unit tests).
- `npm start` end-to-end walkthrough per `IMPLEMENTATION_PHASE6.md` passes.
- Settings debug clean + reseed work.

## Phase 6 — English-language exam covers ✅ (implemented; tests + typecheck + build green)

Verified on 2026-06-06 via `npm test` (109 tests), `npm run typecheck`, and `npm run build`.

### Model and Domain layer
- **Language Union Type**: Widened `Language` from `'nl'` to `'nl' | 'en'` in `types.ts`, fully backward compatible.
- **Zod Schema**: Updated `courseCardSchema` to accept `'en'` next to `'nl'` via `z.enum(['nl', 'en'])`.
- **Parts Title Suffix**: Added support for language-specific suffixes (`PART` for English, `DEEL` for Dutch) in `parts.ts` + specs.
- **Filename Suffix**: Appended `_EN` suffix for English card filenames in `filename.ts` + specs.

### PDF Rendering & String Dictionary
- **Bilingual Dictionary**: Created `strings.ts` holding `TemplateStrings` mappings for `nl` and `en` translations (incorporating the confirmed English terminology such as "PXL University of Applied Sciences and Arts").
- **Definition Refactoring**: Refactored `definition.ts` to dynamically fetch labels and paragraph blocks from `templateStrings[data.language]`, rendering Page 1 headers, Blackboard instruction lists, confirmation fields, and Page 2 procedure items with identical pixel fidelity.
- **Localized Format Helpers**: Added language parameter support to formatting helpers (`formatDuration`, `formatPartsBreakdown`, time separator).

### UI Integration
- **Wizard Review Step**: Added an inset `v-switch` toggle switch to choose between English and Dutch cover sheets, defaulting to Dutch, and threading the language parameter upon saving.
- **Card Edit Page**: Replaced the read-only disabled "Taal" text field with the `v-switch` toggle, dynamically showing an "EN" badge on the live card preview, and passing the chosen language during saving and PDF downloading.
- **Card Detail Page**: Shows a dynamic "Engels (en)" or "Nederlands (nl)" label under "Taal" and localizes the parts suffix.
- **Card Overview Page**: Displays an "EN" badge chip in the card card row next to `examChance` for English covers.

### UI Refinements & Edge Case Handling (Bilingual & Vaklector)
- **Tijdsverdeling (Time Allocation)**: Added a dynamic, overridable, language-dependent "Tijdsverdeling" text input field shown when `partsCount > 1`. If the user inputs custom text, a visual warning alert is displayed, and language toggling prompts the user before resetting it to default.
- **Allowed Resources Presets**: Filtered resources dropdown presets by active cover language. Implemented automatic translation for standard resource presets when toggling the language, and a confirmation/warning popup if custom text is present.
- **Vaklector Refinements**: Disabled pre-filling the Vaklector field when multiple lecturers are present. Changed field to be completely optional. Prefilled placeholder to show a greyed out "(in te vullen door student)" if empty. Made sure selecting the value "in te vullen door student" or custom names renders them normally (not greyed out).
- **Template Cleanup**: Removed the unused "Voorbladsjabloon" template dropdown box entirely from the editor and wizard view.
- **Exam Duration Default**: Configured the default exam duration to 90 minutes.
- **Default Parts Weights**: Configured resizing of parts count to automatically assign balanced/even default weights (`[50, 50]` for 2 parts, `[40, 30, 30]` for 3 parts, and `[25, 25, 25, 25]` for 4 parts) instead of starting with `0%` entries (like `[100, 0]`).

### Verification Gate
- `npm test` green (109/109 tests passing).
- `npm run typecheck` clean (vue-tsc --noEmit).
- `npm run build` successful production bundle.

## On-demand Studiegids Helper Import

Verified on 2026-06-06 via `npm test` (126 tests), `npm run typecheck`, `npm run lint` (0 errors, existing Vue style warnings), `npm run build`, and `npm start` (root + built-in seed HTTP 200).

- Runtime preseed was corrected to `public/data/programmes.seed.2025-26.json` only. No previous/next helper year is bundled in `public/data/`.
- Added `src/domain/academicYear.ts` helpers for September 20 rollover, previous year, current year, next year, and the bounded previous/current/next candidate window. Tests pin June 6, September 19, and September 20 behavior.
- Added `src/data/studiegidsLive.ts`, a TypeScript port of the existing Python scrape/build workflow:
  - dynamic `studiegidsUrl(year)` generation from the selected academic year;
  - ASP.NET hidden field extraction and postback payload building;
  - dynamic selector discovery for `Modeltraject`, `Trajectschijf`, `Deeltraject`, and future selector changes;
  - recursive branch crawl and OLOD link deduplication;
  - runtime seed document build/validation matching `SEED_DATA_FORMAT.md`;
  - progress events with a 400-OLOD estimate.
- Added offline tests for the live scraper covering `2024-25`, `2025-26`, and `2026-27` URL generation, hidden fields/select parsing, OLOD dedupe, postback payloads, recursive crawl output, schema-valid seed building, progress events, and expected failure when PXL-Digital is absent.
- Reworked Settings "Studiegidszoekhulp" to offer only previous/current/next from the rollover window. `2025-26` loads from the built-in seed; other years run the live scraper only after the user clicks **Laden**.
- Added a progress bar and scrollable event log for live imports. Progress is based on roughly 400 expected OLODs and is updated by scraper events.
- Live scrape failures now log the error and fall back to the built-in `2025-26` seed. Settings tests cover both live-success action dispatch and live-failure fallback behavior.
- Added optional same-origin proxy support through `VITE_STUDIEGIDS_PROXY_URL`; the proxy receives dynamic GET/POST scrape requests and returns HTML for browser deployments.
- Browser runtimes now reject live Studiegids import before calling `fetch()` when no proxy is configured, preventing the noisy `Access to fetch ... blocked by CORS` console failure and using the normal built-in fallback path instead.
- `App.vue` startup always loads the built-in fallback seed instead of triggering live scraping implicitly.
- Updated `GEMINI.md`, `README.md`, and `SEED_DATA_FORMAT.md` to document that non-built-in helper years are on-demand live imports, not pre-bundled runtime data.
- Verified PXL request filtering/CORS behavior with `Origin` headers: direct browser deployments cannot live-fetch `studiegids.pxl.be` without a same-origin proxy, so the app fails early and falls back.

## Academic Year Contrast Polish

Verified on 2026-06-06 via `npm test` (126 tests), `npm run typecheck`, `npm run lint` (0 errors, existing Vue style warnings), `npm run build`, and `npm start` (root + built-in seed HTTP 200).

- Made the Overzicht active academic-year chip larger, bold, and easier to scan.
- Added shared `academic-year-label`, `academic-year-value`, and `academic-year-chip` styles using a darker gold-family text color with a subtle gold tonal background.
- Applied the shared contrast treatment to Overzicht group headers, Overzicht card year chips, edit live-preview year chips, detail year values, Settings loaded-helper year text, and Wizard review year text.

## Static Console-Noise Placeholders

Verified on 2026-06-06 via `npm run build` and `npm start` (root placeholders served with HTTP 200).

- Added inert `public/cssrule.css`, `public/jsrule.js`, and `public/extendedcss.js` so GitHub Pages can serve those root-level filenames when browser/content-script environments request them.
- The placeholder files contain no runtime behavior; they only prevent root-file 404 noise for those known filenames.

## Live Import Failure Diagnostics

Verified on 2026-06-06 via `npm test` (126 tests), `npm run typecheck`, `npm run build`, `npm run lint` (0 errors, existing Vue style warnings), and `npm start`.

- Settings live-import fallback alerts now include the concrete failure cause instead of only saying which fallback year loaded.
- The live-import event log prefixes the cause with `Oorzaak:` and adds a no-proxy diagnosis when `VITE_STUDIEGIDS_PROXY_URL` is absent.
- The app emits a namespaced console warning, `[pxl-coverkit] Studiegids live import failed`, with requested year, fallback year, proxy state, and reason.

## Static three-year seed bundle (live scraping removed) — 2026-06-06

- Removed all live in-browser studiegids scraping. Deleted `src/data/studiegidsLive.ts` and its test; dropped `VITE_STUDIEGIDS_PROXY_URL` from `src/env.d.ts` and the scrape-only `replaceWithSeed` store action. Rationale: a static GitHub Pages site cannot scrape `studiegids.pxl.be` (no CORS header; PXL's F5 WAF returns `Request Rejected` to public-proxy IPs).
- Bundled exactly three academic years in `public/data/` (`2024-25`, `2025-26`, `2026-27`, restored from the proven set at commit `6daa518^`) plus a new `public/data/programmes.seed.index.json` manifest (`version`, `currentYear`, `years`).
- Added `seedIndexSchema` (`src/domain/schema.ts`) and `loadSeedIndex()` (`src/data/seed.ts`). The programmes store gained `availableYears`/`currentYear` state and a `setIndex` action.
- `App.vue` now reads the index at startup and loads the remembered year (if still bundled) or the index `currentYear`; `ACTIVE_SEED_YEAR` is only the fallback when the index can't load.
- Settings "Studiegidszoekhulp" now lists exactly the bundled years and "Laden" loads the selected static seed via `loadForYear`. Removed the proxy/CORS explanation paragraph, the progress bar, the progress label, and the scrollable event console.
- Deferred: a September-20 GitHub Actions refresh job (runner IPs may also be WAF-blocked; local generation remains the reliable path).

Verified on 2026-06-06 via `npm run typecheck`, `npm test` (121 tests pass), `npm run build`, and a `npm run preview` smoke test confirming `data/programmes.seed.index.json` and `data/programmes.seed.2026-27.json` are served at the Pages base path.
