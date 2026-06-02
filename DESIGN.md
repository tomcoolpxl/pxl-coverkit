# PXL Cover Kit Design

This document captures the architecture, tech stack, and UX/UI direction agreed for the MVP defined in `REQUIREMENTS.md`. Open items live in the final section.

## 1. Product shape recap

- Static Vue 3 single-page app, deployable to GitHub Pages.
- Local-only data, browser-side PDF generation via `pdfmake`.
- Replaces the manual DOCX-to-PDF workflow for the current Dutch two-page PXL-Digital Blackboard exam cover.

## 2. Tech stack

| Concern              | Choice                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------- |
| Framework            | Vue 3 (`<script setup>` SFCs)                                                           |
| Language             | TypeScript, strict mode                                                                 |
| Build                | Vite                                                                                    |
| UI library           | Vuetify 3 (Material 3 baseline, themed for PXL)                                         |
| Routing              | `vue-router` in hash mode (`/#/...`) for friction-free GitHub Pages hosting             |
| State                | Pinia stores                                                                            |
| Persistence          | `pinia-plugin-persistedstate` with a custom storage object wrapping `localStorage` (IndexedDB-ready) |
| Forms / validation   | `vee-validate` with `zod` schemas (same schemas reused by the storage and import layer) |
| PDF                  | `pdfmake` with custom VFS (Carlito font, Arial-metric-compatible)                       |
| Date / time          | Native `Intl` + small helpers; no heavy date library                                    |
| Testing              | Vitest + Vue Test Utils, snapshot tests for pdfmake doc definitions                     |
| Lint / format        | ESLint (vue/typescript-recommended) + Prettier                                          |
| CI / deploy          | GitHub Actions, `actions/deploy-pages` (checkout-free deploy job per GEMINI.md rule)    |

Vite `base` is configured from an env var so project-site vs. user-site hosting are both supported.

## 3. UX/UI direction

### 3.1 Visual identity

PXL-branded, calm, institutional. Anchored on the public PXL brand palette (Rich Black, White, Gold) so the UI feels like a PXL tool but stays restrained enough to read as a productivity app.

Vuetify theme tokens (light, MVP default):

```ts
{
  colors: {
    primary:    '#AE9A64', // PXL Gold — primary actions, focus ring accent
    secondary:  '#030203', // PXL Rich Black — text, app bar
    background: '#FAF8F3', // warm off-white surface
    surface:    '#FFFFFF',
    error:      '#B3261E',
    success:    '#2E7D32',
    warning:    '#A06B00',
    info:       '#1F4F8A',
  }
}
```

Typography: Vuetify's default Roboto for the UI is fine; the PDF uses Carlito independently. Body 14–16 px, generous line height, no shadow-heavy Material elevation.

A dark theme is not in MVP scope but Vuetify's theme provider keeps the door open.

### 3.2 Information architecture

```
/                       Card overview (default)
/cards/new              Create wizard
/cards/:id              Card detail (read-mostly summary + actions)
/cards/:id/edit         Full update view
/settings               Import/export, programme/seed info, font credits
/about                  Privacy, licensing, version
```

A persistent top app bar holds the PXL wordmark, programme/year filter chips, and a "New cover" CTA. A right-side menu exposes settings and import/export.

### 3.3 Card overview

- Responsive grid of cards (1 / 2 / 3 columns by breakpoint).
- Each card shows: programme chip, course code + name, academic year, exam date, exam chance, "updated" timestamp, and a row of icon actions: Download PDF, Actualize, Edit, Delete.
- Sticky filter bar above the grid: programme select, academic year select, free-text search across code/name.
- Empty state explains seed-vs-manual creation and points to import.
- Keyboard: each card is a single focusable region, `Enter` opens detail, action icons are reachable via `Tab` with visible focus.

```
+--------------------------------------------------------------+
| PXL Cover Kit          [Programme v] [Year v] [Search]  + New|
+--------------------------------------------------------------+
|  +-----------------+  +-----------------+  +-----------------+|
|  | PBTIN  2025-26  |  | PBTIN  2025-26  |  | PBTIN  2025-26  ||
|  | 42TIN2260       |  | 42TIN1370       |  | 42TIN1360       ||
|  | Automation I    |  | Cloud Essentials|  | Adv. Linux      ||
|  | 12 jun  S2      |  | 18 aug  EK2     |  | 15 jan  S1      ||
|  | [PDF][~][Edit][X] |  | [PDF][~][Edit][X] |  | [PDF][~][Edit][X] ||
|  +-----------------+  +-----------------+  +-----------------+|
+--------------------------------------------------------------+
```

### 3.4 Create-card wizard

Three steps inside a full-screen dialog (or `/cards/new` route on desktop):

1. **Programme** — large selectable list seeded from `programmes[]`. If exactly one programme exists, auto-advance.
2. **Source** — choose a seeded OLOD (searchable list filtered to the chosen programme) or "Manual entry". Showing the studiegids `label` verbatim; selectionContext breadcrumbs displayed under the search box for clarity.
3. **Review & save** — full form prefilled from seed defaults and global preferences. Inline validation. Save button stays disabled until required fields pass.

Wizard state lives in a local Pinia store slice; navigating away prompts a confirm if the form is dirty.

### 3.5 Actualize dialog

A focused modal triggered from a card. Fields: new academic year (prefilled with `nextAcademicYear(current)`), new exam date (required), optional start time, optional duration. "Save" overwrites the current card state and bumps `updatedAt`. The full edit view is one click away for everything else.

### 3.6 Full update view

Two-column layout on desktop, single column on mobile. Left column: form sections (Course, Exam, Lecturers, Resources, Template). Right column: a live "summary card" mirroring the overview card and a "Generate PDF" button. Form sections use Vuetify `v-expansion-panels` to keep cognitive load down without hiding state.

### 3.7 Delete confirmation

Vuetify dialog requiring the user to type the course code (or press a clearly-labelled "Delete cover" button after a 2-second delay disabling the button). No accidental destructive default.

### 3.8 Import / export

Settings page. Export downloads a versioned JSON file (`pxl-coverkit-export-YYYYMMDD.json`). Import shows a diff-style preview ("X cards will be replaced, Y will be added") and requires explicit confirm. Schema version mismatches block import with a clear message; future migrations will be additive functions.

### 3.9 Feedback patterns

- Saves: Vuetify snackbar, 3 s, with an Undo when feasible (delete, actualize).
- Validation: inline under each field; the form header summarises the count of errors and focuses the first invalid field on submit.
- PDF generation: button shows a small spinner; on success, the snackbar offers "Open" and "Show file name".

## 4. Architecture

### 4.1 Layered modules

```
src/
  app/                  bootstrap, router, vuetify, pinia, global styles
  domain/               pure TS — types, validators, formatters, override merge
    types.ts
    schema.ts            zod schemas (single source of truth)
    overrides.ts         seed + override precedence rules
    academicYear.ts      next-year helper, formatting
    examTime.ts          start + duration -> end-time
    filename.ts          predictable PDF filename
  pdf/                  pdfmake document definition layer
    fonts/               Carlito ttf + generated vfs
    template-nl-blackboard-v1/
      definition.ts      renderExamCoverPdfDefinition(data, template)
      assets.ts          logos / images as base64 imports
      tokens.ts          spacing, font sizes, colours
    index.ts             template registry
  data/
    storage.ts           StorageAdapter interface + localStorage impl
    migrations.ts        schemaVersion -> migrate(state)
    seed.ts              loads bundled programme seeds
    importExport.ts
  stores/               pinia stores; consume domain + data only
    cards.ts
    programmes.ts
    settings.ts
    wizard.ts
  features/             Vue components grouped by user flow
    overview/
    wizard/
    detail/
    edit/
    actualize/
    settings/
  ui/                   shared dumb components (Card, FieldRow, FormSection)
  assets/               static images (logo, brand marks)
public/
  data/                 bundled seed JSON (one per academic year)
```

Rule: `pdf/` and `domain/` import nothing from Vue, Pinia, or the DOM. They are pure, fully unit-testable, and reused unchanged by future English templates.

### 4.2 Data flow

```
Bundled seed JSON  ─┐
                    ├─> programmes store ─┐
User overrides ─────┘                     ├─> cards store ──> domain.formatters ──> pdf/renderExamCoverPdfDefinition ──> pdfmake.createPdf
                                          │
                       settings store ────┘
```

Render is a one-way pipeline: a `CourseCardData` object is built up by merging defaults < seed < overrides, validated, formatted (Dutch locale), and handed to the template function. The template function never touches stores.

### 4.3 Storage adapter

`pinia-plugin-persistedstate` is wired with a single custom storage object that conforms to the `{ getItem, setItem, removeItem }` shape and currently delegates to `localStorage` under the key prefix `pxl-coverkit:v1:`. Swapping to IndexedDB later means replacing that storage object only; stores stay untouched.

```ts
interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
```

A `migrations.ts` module owns `schemaVersion` upgrades; the persisted state is funnelled through it on hydrate before stores see the data.

### 4.4 Override precedence

`buildCourseCardData(card, seedEntry, settings)` applies defaults < seed < card overrides field by field. The `overrides` map on the card records which fields the user changed, so re-seeding never clobbers user edits. The merger lives in `domain/overrides.ts` and is the single test target for precedence rules.

### 4.5 Seed loading

Seed files are bundled in `public/data/`. At boot, `programmes store` fetches the file for the active academic year (`settings.activeAcademicYear`) and exposes `programmes` and `seedEntries` as readonly arrays. Missing seed file is non-fatal: manual creation still works.

### 4.6 Routing

Hash mode means GitHub Pages serves a single `index.html` and the SPA owns navigation. No `404.html` redirect hack needed. Deep links to a card (`/#/cards/abc123`) survive page reloads.

## 5. PDF rendering

- One template registered for MVP: `template-nl-blackboard-v1`.
- A4 portrait, two pages, content built from `tokens.ts` (no scattered magic numbers).
- Font: **Carlito** (Google Fonts, OFL, metric-compatible with Calibri/Arial), bundled into a custom `vfs_fonts` blob at build time via a small Vite plugin. Documented as the open substitute in `/about`.
- Logo and PXL marks live in `pdf/template-nl-blackboard-v1/assets.ts` as base64-encoded PNGs imported from `src/assets/`.
- `renderExamCoverPdfDefinition(data, template)` returns a pure `TDocumentDefinitions`. Tests snapshot the JSON shape; visual diff against reference PDFs is a Phase 4 task.
- Filename: `domain/filename.ts` produces `{academicYearShort}_{courseCode}_{courseNameSlug}_Examenvoorblad_{examChance}.pdf`.

Vite needs `optimizeDeps.include: ['pdfmake/build/pdfmake', 'pdfmake/build/vfs_fonts']` to avoid the known deep-import warning.

## 6. Validation

`domain/schema.ts` defines one `zod` schema per persisted type. The same schemas power:

- `vee-validate` field-level validation in forms.
- `validateCourseCardData()` before PDF render.
- Import-file validation (refuses unknown shapes with a specific message).
- Storage migration assertions.

Error messages are Dutch (matching the output language) and field-specific (REQUIREMENTS §"Validation and error handling").

## 7. Accessibility

- Vuetify components ship with accessible defaults; we keep them.
- All form fields wrapped with `<v-label for>` and `aria-describedby` for errors.
- Focus ring is the PXL Gold at 2 px, never relies on color alone.
- Card actions are real `<button>`s, never `<div onclick>`.
- The wizard exposes a live region announcing step changes.
- Keyboard tested manually for: overview navigation, wizard, delete confirm, PDF download.

## 8. Testing strategy

| Layer    | What is tested                                                                    | Tool                      |
| -------- | --------------------------------------------------------------------------------- | ------------------------- |
| Domain   | overrides precedence, academic year math, time/duration, filename, zod schemas    | Vitest                    |
| PDF      | `renderExamCoverPdfDefinition` snapshot for representative cards                  | Vitest + snapshot         |
| Storage  | `localStorage` round-trip, migration v1→vN                                        | Vitest with `jsdom`       |
| Stores   | cards store mutations, actualize logic                                            | Vitest + Pinia testing    |
| Forms    | a few focused component tests (wizard transitions, validation surfacing)          | Vue Test Utils            |

Visual regression of the rendered PDF is a deliberate Phase 4 follow-up (REQUIREMENTS §Testing).

## 9. Deployment

- GitHub Actions workflow `pages.yml` with two jobs: `build` and `deploy`.
- `build`: checkout, install, `npm run build`, upload artifact via `actions/upload-pages-artifact`.
- `deploy`: **no checkout step** (per GEMINI.md), only `actions/deploy-pages@v4`. This avoids the post-job git cleanup failures called out in project rules.
- `VITE_BASE_PATH` injected at build time for project-site URLs.

## 10. Project workflow alignment

- `REQUIREMENTS.md` is the truth; this DESIGN.md is the implementation blueprint.
- Phase 1 of the suggested implementation phases creates the skeleton described in §4.1.
- `IMPLEMENTATION_PHASE[N].md` files, when created, freeze the per-phase blueprint, with `TODO.md` and `DONE.md` tracking execution as described in GEMINI.md.

## 11. Open questions / deferred decisions

- **Institutional font policy.** Carlito is the working default. Confirm whether the original PXL institutional font may be redistributed inside the static bundle; if yes, swap fonts in `pdf/fonts/` only.
- **Logo asset.** Confirm which PXL-Digital wordmark/logo variant is acceptable for the cover; store the approved PNG (or SVG converted to PNG for pdfmake) under `src/assets/pdf/`.
- **Reusable lecturer presets.** REQUIREMENTS leaves this open. Plan: a `lecturers` store seeded from observed values, exposed as autocomplete suggestions in the form; promoted to dedicated UI post-MVP.
- **Allowed-resources presets.** Same pattern as lecturer presets, gated behind the same decision.
- **Exam chance vocabulary.** Need a confirmed list (`S1`, `S2`, `EK1`, `EK2`, `HE`, ...) and their Dutch display labels for the picker.
- **Active academic year switch.** Decide whether switching years in settings should also offer to actualize all cards in bulk, or only swap the available seed catalogue.
- **Safari support.** Out of scope for MVP; revisit once Chrome/Edge/Firefox builds are stable.
