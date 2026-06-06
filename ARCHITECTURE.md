# PXL Cover Kit — Technical Documentation

The single source of technical truth for this repository. It consolidates the
architecture, data model, build/deploy setup, and maintainer runbooks that were
previously spread across separate requirement, design, plan, and report
documents. `README.md` remains the user-facing introduction; this file is for
developers and maintainers.

---

## 1. What the app is

A **static, browser-only Vue 3 single-page app** that generates the current
Dutch (and English) two-page PXL-Digital Blackboard **exam cover PDF**
(`examenvoorblad`) from reusable, locally stored data. It replaces the manual
workflow of editing DOCX templates and exporting them to PDF for each course and
exam.

Key product constraints:

- **No backend.** Everything runs in the browser; the app is hosted on GitHub
  Pages.
- **Local-only data.** All user data lives in `localStorage`; nothing is
  uploaded. Student fields on the cover are left blank, so no personal student
  data is stored.
- **Offline PDF generation** via `pdfmake` with bundled fonts and assets.
- **Deterministic output** — the same card always produces the same PDF and
  filename.

Live URL: <https://tomcoolpxl.github.io/pxl-coverkit/#>

---

## 2. Tech stack

| Concern            | Choice                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| Framework          | Vue 3 (`<script setup>` SFCs)                                                |
| Language           | TypeScript, strict mode                                                      |
| Build              | Vite 6                                                                       |
| UI library         | Vuetify 3 (Material 3 baseline, themed for PXL)                              |
| Routing            | `vue-router` in **hash mode** (`/#/...`) for friction-free GitHub Pages      |
| State              | Pinia stores                                                                 |
| Persistence        | `pinia-plugin-persistedstate` over a custom `localStorage` adapter           |
| Forms / validation | `vee-validate` + `@vee-validate/zod`, sharing `zod` schemas with storage     |
| PDF                | `pdfmake` with a custom VFS (Carlito font, base64 image assets)             |
| Date / time        | Native `Intl` + small pure helpers; no date library                         |
| Testing            | Vitest + Vue Test Utils, snapshot tests for pdfmake doc definitions          |
| Lint / format      | ESLint (flat config) + Prettier                                             |
| CI / deploy        | GitHub Actions → `actions/deploy-pages` (checkout-free deploy job)           |
| Seed tooling       | Python scripts (`requests`) for offline studiegids scraping                  |

`vite.config.ts` reads `VITE_BASE_PATH` so the same build works for a
project-site path (`/pxl-coverkit/`) or a user-site root.

---

## 3. Repository layout

```
src/
  app/                  bootstrap, router, vuetify, pinia, global styles
    activeAcademicYear.ts  ACTIVE_SEED_YEAR fallback constant (see §6)
    pinia.ts               persistedstate wiring (key prefix pxl-coverkit:v1:)
    router.ts              hash-mode routes
    vuetify.ts             PXL theme tokens
    styles.css             global CSS incl. focus ring + academic-year-* classes
  domain/               pure TS — no Vue/Pinia/DOM imports, fully unit-tested
    types.ts               core interfaces + CURRENT_SCHEMA_VERSION
    schema.ts              zod schemas (single source of truth, Dutch messages)
    overrides.ts           defaults < seed < override merge; splitSeedLabel
    cardFactory.ts         buildCourseCard() from form + seed + settings
    academicYear.ts        parse/next/short/format + Sept-20 rollover window
    examTime.ts            start + duration -> end time, time range
    examChance.ts          exam-chance vocabulary + descriptions
    allowedResources.ts    allowed-resources presets (Lockdown, etc.)
    parts.ts               multi-part (DEEL/PART) weight helpers
    filters.ts             overview filtering + programme priority ordering
    filename.ts            predictable PDF filename builder
  pdf/
    fonts/                 Carlito TTFs (OFL); packed to a VFS at build time
    generator.ts           pdfmake compile + validateCourseCardData() + download
    template-nl-blackboard-v1/
      definition.ts        renderExamCoverPdfDefinition(data) -> TDocumentDefinitions
      assets.ts            logos / Blackboard screenshots as base64
      strings.ts           NL/EN string dictionary (TemplateStrings)
      tokens.ts            spacing, font sizes, colours (no scattered magics)
  data/
    storage.ts             KeyValueStorage interface + localStorage adapter
    seed.ts                loadProgrammesSeed(year) + loadSeedIndex()
    importExport.ts        build/serialize/parse local-data JSON
    migrations.ts          schemaVersion migration on import
  stores/                 Pinia stores; consume domain + data only
    cards.ts  programmes.ts  settings.ts  wizard.ts
    lecturers.ts  notifications.ts
  features/              Vue components grouped by user flow
    overview/  wizard/  detail/  edit/  actualize/  delete/  settings/  about/
  ui/                   shared components: AppShell, LecturerAutocomplete,
                        MultiPartEditor
  assets/pdf/           source PNGs (logos, watermark) for the PDF assets
public/
  data/                  bundled seed JSON: three years + index (see §6)
  cssrule.css, jsrule.js, extendedcss.js   inert console-noise placeholders
scripts/                 Python seed-generation tooling (see §10)
seed-data/               raw crawl snapshots + generated seeds (source artifacts)
examples/                reference PDFs of the manual workflow being replaced
.github/workflows/pages.yml   build + checkout-free deploy
```

**Layering rule:** `pdf/` and `domain/` import nothing from Vue, Pinia, or the
DOM. They are pure and unit-testable, and are reused unchanged across the Dutch
and English covers.

---

## 4. Architecture and data flow

```
Bundled seed JSON  ─┐
                    ├─> programmes store ─┐
User overrides ─────┘                     ├─> cards store ─> domain formatters ─> pdf/renderExamCoverPdfDefinition ─> pdfmake.createPdf
                                          │
                       settings store ────┘
```

Rendering is a one-way pipeline: a card is merged (defaults < seed < overrides),
validated, formatted for the chosen language, and handed to the template
function, which returns a pure `TDocumentDefinitions`. The template function
never touches stores.

### Override precedence

`buildCourseCard()` (in `domain/cardFactory.ts`) applies **built-in defaults <
bundled seed < per-card overrides** field by field. The card's `overrides` array
records exactly which fields the user changed, so re-seeding never clobbers user
edits. Seed entries are read-only at runtime.

### Routes (hash mode)

```
/                  Card overview (default)
/cards/new         Create wizard
/cards/:id         Card detail (summary + actions)
/cards/:id/edit    Full update view
/settings          Studiegids-helper year + local-data import/export + debug
/about             Privacy, licensing, font credit, version
```

Hash mode means GitHub Pages serves one `index.html`; deep links survive
reloads with no `404.html` redirect hack.

---

## 5. Domain model

Defined in `src/domain/types.ts` (zod-validated in `src/domain/schema.ts`).

- **`Programme`** — `id`, `code`, `name`, `active`, optional `department` and
  `selectionFlow` (the studiegids selector chain used during seed generation).
- **`SeedEntry`** — a bundled OLOD/course usable to create a card: `id`,
  `programmeId`/`programmeCode`, `label` (`"<code> <name>"`), default fields
  (`defaultVaklector`, `defaultLecturers`, `defaultStartTime`,
  `defaultDurationMinutes`, `defaultAllowedResources`, `defaultMaxScore`),
  `active`, and optional `selectionContext`/`source` provenance.
- **`ProgrammesSeedFile`** — `version`, `generatedAt`, `academicYear`,
  `programmes[]`, `seedEntries[]` (one file per academic year).
- **`CourseCard`** — one editable exam cover. Notable fields:
  `programmeCode`, `seedEntryId`, `courseCode`, `courseName`, `academicYear`,
  `examChance`, `language` (`'nl' | 'en'`), `examDate`, `startTime`,
  `durationMinutes`, `endTime`, `durationTextOverride`, `vaklector`,
  `lecturers[]`, `roomPlaceCode`, `maxScore`, `allowedResources`,
  multi-part fields `partsCount`/`partIndex`/`partWeights[]`, `templateId`,
  timestamps (`createdAt`/`updatedAt`/`lastGeneratedAt`),
  `source` (`'manual' | 'seeded'`), and `overrides[]`.
- **`AppSettings`** — `defaultTemplateId`, `defaultMaxScore`,
  `defaultExamChance`, `defaultDurationMinutes` (90), `userName`,
  `activeSeedYear` (the remembered studiegids-helper year).
- **`ExportedState`** — `schemaVersion`, `exportedAt`, `settings`, `cards[]`,
  optional `lecturers[]`.
- **`CURRENT_SCHEMA_VERSION = 1`.**

---

## 6. Seed data system

The studiegids data is **pre-generated offline and bundled as static JSON**.
There is intentionally **no live in-browser scraping**: a static GitHub Pages
site cannot scrape `studiegids.pxl.be` — it sends no CORS header, and PXL's F5
WAF rejects public-proxy / datacenter IPs with `Request Rejected`. (An earlier
live-scrape attempt was removed for this reason.)

### What is bundled

`public/data/` contains exactly **three academic years** (previous, current,
next per the September-20 rollover rule) plus an index:

```
public/data/programmes.seed.2024-25.json
public/data/programmes.seed.2025-26.json
public/data/programmes.seed.2026-27.json
public/data/programmes.seed.index.json   { version, currentYear, years[] }
```

Keep only those four files in `public/data/` — no raw scrape dumps, no extra
years.

### Startup loading (`src/App.vue`)

1. `loadSeedIndex()` reads `programmes.seed.index.json`;
   `programmes.setIndex()` records `availableYears` and `currentYear`.
2. The app loads the **remembered year** (`settings.activeSeedYear`) if it is
   still bundled, otherwise the index's `currentYear`.
3. `programmes.loadWithFallback(year, ACTIVE_SEED_YEAR)` fetches and zod-validates
   the seed; on failure it falls back to the built-in year and surfaces a toast.

`ACTIVE_SEED_YEAR` in `src/app/activeAcademicYear.ts` is **only the fallback**
used when the index can't be loaded. The year shown everywhere in the UI
(overview chip, settings, wizard review, new-card stamping) comes from
`useProgrammesStore().loadedYear`, so it always reflects the data actually
loaded — there is no UI control to change the active year, by design.

### Helper-year switching (Settings)

The Settings "Studiegidszoekhulp" lists exactly the bundled years from the
index; **Laden** loads the selected bundled seed via
`useProgrammesStore().loadForYear`. There is no progress bar, event log, or
proxy/CORS messaging. A user's selected helper year only affects OLOD-code and
course-title lookup for **new** cards; saved cards keep their copied string
fields and are unaffected by switching helper years.

### Seed file format

One academic year per file. Top-level shape:

```json
{
  "version": 2,
  "generatedAt": "2026-06-02T14:20:00Z",
  "academicYear": "2025-26",
  "source": { "type": "studiegids", "generator": "scripts/build_programmes_seed.py", "url": "https://studiegids.pxl.be/?acadjaar=2025-26" },
  "programmes": [ { "id": "programme-4-pbtin", "code": "PBTIN", "name": "...", "active": true, "department": { "value": "4", "label": "PXL-Digital" }, "selectionFlow": [ /* modeltraject -> trajectschijf -> deeltraject */ ] } ],
  "seedEntries": [ { "id": "...", "programmeId": "programme-4-pbtin", "programmeCode": "PBTIN", "label": "43SNB3180 IT Project", "defaultMaxScore": 20, "active": true, "selectionContext": { /* ... */ } } ]
}
```

**Label rule:** the stored `label` is the final combined text shown in the
picker. For OLODs it is the visible studiegids text (`43SNB3180 IT Project`);
branch-selector labels combine the internal ID and visible text
(`9881 3 TIN / Systemen en netwerkbeheer`). Cards copy these labels as default
text and may override them locally.

**Integration flow in the app:** load `programmes` for the first selector → read
`selectionFlow` for the chosen programme → derive option labels from
`seedEntries` filtered by `selectionContext` → show matching `label`s as the
OLOD picker → copy chosen text into the card as defaults.

---

## 7. PDF generation

- One template registered: **`template-nl-blackboard-v1`** (the `templateId` is
  kept stable for backward compatibility even though it now serves both
  languages).
- A4 portrait, two pages. Page 1: branded header (programme, year, exam chance,
  max score), title line, writable student table, exam-data table, Blackboard
  warning/instructions, and an 8-box confirmation area beside a Blackboard
  screenshot. Page 2: the Blackboard procedure instructions list.
- All sizing/spacing/colour comes from `tokens.ts` — no scattered magic numbers.
- **Font:** Carlito (Google Fonts, OFL; metric-compatible with Calibri/Arial),
  packed into the virtual module `virtual:pdfmake-vfs` by a custom Vite
  build-time plugin in `vite.config.ts` from `src/pdf/fonts/`. `vite.config.ts`
  also lists `pdfmake/build/pdfmake` and `pdfmake/build/vfs_fonts` in
  `optimizeDeps.include`.
- **Assets:** logos and Blackboard screenshots live in
  `template-nl-blackboard-v1/assets.ts` as base64 PNGs (sourced from
  `src/assets/pdf/`).
- `renderExamCoverPdfDefinition(data)` returns a pure `TDocumentDefinitions`;
  tests snapshot the JSON shape (`definition.test.ts`).
- `generator.ts` compiles the definition, derives the filename, and triggers the
  browser download, then `lastGeneratedAt` is bumped on the card.

### Filename

`domain/filename.ts → buildPdfFilename()` produces:

```
{academicYearShort}_{courseCode}_{courseNameSlug}_Examenvoorblad_{examChance}[_EN].pdf
```

Example: `2526_42TIN2260_Automation_I_Examenvoorblad_S2.pdf`. English covers
append `_EN` before the extension.

---

## 8. Bilingual covers (NL / EN)

- One layout structure serves both languages; Dutch (`nl`) and English (`en`)
  text is supplied by `template-nl-blackboard-v1/strings.ts`
  (`TemplateStrings`). English uses confirmed terminology such as "PXL
  University of Applied Sciences and Arts".
- Language is a per-card attribute (`language: 'nl' | 'en'`, default `nl`). The
  wizard review step and the edit page expose a `v-switch` toggle.
- English cards show an **"EN" badge** on card surfaces and append `_EN` to the
  filename.
- Formatting helpers (`formatDuration`, `formatPartsBreakdown`, the time
  separator) take a `Language` argument for localized output.
- Multi-part suffix is `PART` (en) / `DEEL` (nl).
- Allowed-resources presets and the optional "Tijdsverdeling" text are
  language-aware: standard presets auto-translate on language toggle; if the
  user has custom text, a warning is shown and a confirm is required before
  resetting it.

---

## 9. Storage, persistence, import/export

- **Persistence:** `pinia-plugin-persistedstate` is wired in `src/app/pinia.ts`
  with a custom storage object conforming to `KeyValueStorage`
  (`getItem`/`setItem`/`removeItem`) under the key prefix `pxl-coverkit:v1:`.
  Swapping to IndexedDB later means replacing only that storage object.
- **Storage failure handling:** the adapter (`src/data/storage.ts`) falls back to
  an in-memory map and sets a reactive `hasStorageWriteError` flag; `AppShell.vue`
  shows a global `v-alert` warning (e.g. private browsing / quota).
- **Persisted stores:** `settings`, `cards`, `lecturers`. Not persisted:
  `programmes` (fetched from `public/`), `wizard`, `notifications`.
- **Import/export scope:** local data only — the user's own cards + lecturer
  preferences, as a back-up / cross-browser move tool, surfaced **only in
  Settings**. Studiegids seed data is part of the bundle and is never imported.
  Export downloads a versioned JSON (`pxl-coverkit-export-YYYYMMDD.json`). Import
  validates against the zod schemas, shows a replace/add preview, and requires an
  explicit confirm; schema-version mismatches block import with a Dutch message.
  `migrations.ts` owns additive `schemaVersion` upgrades.

---

## 10. Maintainer runbooks

### Refreshing the bundled seed data

The seed files are regenerated **offline** with the Python tooling, then
committed. Run one academic year at a time; never combine years in one file.

```bash
# 1. Crawl one academic year into a raw snapshot (defaults to PXL-Digital).
python scripts/scrape_studiegids_tree.py --acadjaar 2026-27 \
  --output seed-data/raw/studiegids-tree.2026-27.json

# 2. Convert that raw crawl into one year-specific seed file.
python scripts/build_programmes_seed.py \
  --input seed-data/raw/studiegids-tree.2026-27.json \
  --output seed-data/programmes.seed.2026-27.json

# 3. Copy the generated seed into public/data/ and update the index
#    (programmes.seed.index.json: years[] + currentYear) so it lists exactly
#    the three bundled years (previous, current, next).
```

Notes:

- Use `requests` for transport — the endpoint rejected the earlier `urllib`
  client during validation. (`requirements-scraper.txt` pins the dependency.)
- The crawler is validated for both `2025-26` and `2026-27`; the known PBTIN
  path works through Modeltraject → Trajectschijf → Deeltraject.
- A September-20 GitHub Actions refresh job is **deferred**: runner IPs are
  datacenter IPs the WAF may also reject, so generating locally and committing
  remains the reliable path.

### Bumping the active academic year

There is no UI control. The active year is whatever the index's `currentYear`
points at (with `ACTIVE_SEED_YEAR` only as a last-resort fallback). Bump it by
regenerating the three-year window and updating
`public/data/programmes.seed.index.json` in a single maintainer commit. Existing
cards are moved forward individually via the per-card **Actualize** flow.

---

## 11. Build, test, deploy

```bash
npm install
npm start        # vite dev server
npm test         # vitest run
npm run build    # vue-tsc --noEmit && vite build
npm run preview  # serve the production build
npm run typecheck
npm run lint
npm run format
```

**Deploy** (`.github/workflows/pages.yml`): on push to `main`, a `build` job
(Node 22, `npm ci`, `VITE_BASE_PATH=/<repo>/`, upload artifact) and a
**checkout-free** `deploy` job using `actions/deploy-pages@v4`. The deploy job
deliberately has no checkout step — `actions/deploy-pages` only needs the
uploaded artifact, and skipping checkout avoids post-job git-cleanup failures.

---

## 12. Validation, accessibility, conventions

### Validation

- `domain/schema.ts` defines one zod schema per persisted type with **Dutch,
  field-specific** error messages. The same schemas power `vee-validate` form
  validation, import-file validation, and migration assertions.
- `validateCourseCardData()` in `pdf/generator.ts` is the pre-render guardian: it
  validates the card against zod **and** verifies required assets are loaded
  (the four Carlito TTFs in the VFS, and valid base64 logo/screenshot data
  URIs).
- Multi-part: save/PDF are blocked when part weights don't total 100%.

### Accessibility

- All form fields have labels; errors associate via `aria-describedby`.
- Card actions are real `<button>`s; nothing relies on colour alone.
- The wizard announces step changes through a visually hidden `aria-live`
  region (`.sr-only`).
- The global focus ring uses `#030203` to meet WCAG AA 3:1 contrast against the
  cream background.
- Academic-year labels/chips use shared `academic-year-*` CSS classes for
  readable contrast in the PXL gold family.

### Theme & misc conventions

- PXL theme tokens (`src/app/vuetify.ts`): primary Gold `#AE9A64`, secondary
  Rich Black `#030203`, background `#FAF8F3`.
- Default exam duration is 90 minutes; multi-part resizing assigns balanced
  weights (`[50,50]`, `[40,30,30]`, `[25,25,25,25]`).
- Programme ordering in the wizard follows a priority list
  (PBTIN, PBTIW, GRSNE, GRPRO, GRDVO, then the rest) via
  `sortProgrammesByPriority`.
- `public/cssrule.css`, `public/jsrule.js`, and `public/extendedcss.js` are
  intentional inert placeholders that silence root-file 404 noise some
  browser/content-script environments generate on GitHub Pages — they have no
  runtime behaviour.
```
