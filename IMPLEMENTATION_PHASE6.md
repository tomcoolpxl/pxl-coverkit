# Phase 6 — Wizard/UX fixes, PDF layout fixes, multi-part (DEEL) support

**Goal.** Address the lecturer walkthrough feedback: make card creation faster and
less error-prone, fit the cover's page 1 onto a single A4 page, and support
multi-part (DEEL) exams.

> **No migrations, no backwards compatibility.** The app is still in full
> development. Do **not** write data migrations, schema-version bumps, fallback
> normalizers, or any code that preserves old localStorage / old export shapes.
> Add new fields directly. Stale local data is cleared with the new
> "Omgeving opschonen" debug button, not by migration code. `data/migrations.ts`
> needs no new logic for this phase.

**Confirmed decisions.** Programme order is hardcoded (robust if codes are absent
from future seeds); one-page fit = *moderate*; DEEL UX = *count + this-part +
per-part %*; user name lives in Settings *with* a first-run prompt.

---

## In scope

### Part 1 — Wizard / UX

1. **Programme ordering (robust hardcoded priority).** Priority list
   `['PBTIN','PBTIW','GRSNE','GRPRO','GRDVO']` (PBTIW = "Switch2IT"). Listed codes
   first in that order; the rest follow alphabetically by `name`. Codes absent from
   the seed are skipped (never fail). Helper `sortProgrammesByPriority` in
   `src/domain/filters.ts` (unit-tested); used by `WizardProgrammeStep.vue`.

2. **Deduplicate OLOD list.** In `WizardSourceStep.vue` the same course appears once
   per `selectionContext` path. Group by course key (`label`); render one item per
   course with all occurrence contexts as stacked subtitle lines. Picking uses the
   first occurrence's id (defaults identical across occurrences). Search still works
   over the grouped list.

3. **Examenkans dropdown descriptions.** Show a description but store the bare code:
   `{ title: 'S1 — semester 1', value: 'S1' }` (S1/S2 = semester 1/2,
   EK1/EK2 = examenkans 1/2). **HE**: meaning unknown — leave `{ title: 'HE',
   value: 'HE' }` (no description). Centralize in `src/domain/examChance.ts`, used
   by `WizardReviewStep.vue` and `CardEditPage.vue`.

4. **Start-time presets.** Vuetify combobox with presets `08:30`, `13:30`, `09:00`,
   `13:00`, default `08:30`, free-text editable. Keep `HH:MM` regex validation.
   Apply in `WizardReviewStep.vue`, `CardEditPage.vue`, `ActualizeDialog.vue`. Fix
   `buildInitialDraft()` fallback `'09:00' → '08:30'`.

5. **Per-user name → defaults Vaklector + Lectoren.** Add `userName: string` to
   `AppSettings` (`types.ts`, `appSettingsSchema`, `settings.ts` DEFAULTS +
   `asExportable`/`replaceWith`). "Jouw naam" field in `SettingsPage.vue`. New cards
   prefill `vaklector = userName` and `lecturers = [userName]` when non-empty and no
   seed default. **First-run prompt**: when the wizard opens and `userName` is empty,
   a small `v-dialog` asks for the name and saves it before continuing.

6. **Predefined allowed-resources texts.** Free text plus a preset selector. Presets
   in `src/domain/allowedResources.ts`:
   - *Lockdownbrowser-examen* (default): `Blackboard Lockdownbrowser op laptop,
     documentatie zoals ingesteld/toegestaan via Lockdownbrowser, geen papier, enkel
     examen op laptop, GEEN Internet, GEEN AI tools`
   - *Blackboard-examen (geen lockdown)*: `Blackboard, alles digitaal op laptop,
     GEEN Internet, GEEN AI tools`
   Selecting a preset fills the editable field. Wizard defaults to the Lockdown
   preset when no seed default. Apply in `WizardReviewStep.vue`, `CardEditPage.vue`.

7. **Debug tools in Settings.** Change `useCardsStore` default state to empty `[]`;
   export the predefined set and add a `seedPredefined()` action. Add an
   "Ontwikkeling / debug" card in `SettingsPage.vue` with:
   - **Omgeving opschonen** — wipe all local data (cards, settings, lecturers,
     wizard) + `localStorage.clear()`, behind a confirm step.
   - **Voorbeeldkaarten aanmaken** — `cards.seedPredefined()`.

8. **Edit view template prefill.** In `CardEditPage.vue`, default `templateId` to
   the available option when a card's stored value isn't in `templateOptions`
   (mock cards use `'PXL-Dig-2425'` → blank); fall back to
   `'template-nl-blackboard-v1'`. Keep the Sjabloon/Taal panel visible.

### Part 2 — PDF layout (`src/pdf/template-nl-blackboard-v1/definition.ts`)

Goal: page-1 content fits one A4 page. Strategy = **moderate**.

- Margins `[36,36,36,36] → [24,24,24,24]`.
- Reclaim whitespace: shrink `courseTitle` margin (≈`[0,4,0,8]`) to close
  heading↔title gap; trim the gap between the Examengegevens table and the
  "ONMIDDELLIJK NA HET VOLTOOIEN…" block (table `margin` + `instructionHeader` top).
- Unify student-table row heights to the (taller) Vaklector row height. Leave the
  Examengegevens table heights as-is.
- Score box `/ {maxScore}`: shift the number **right** (writable space left of the
  slash), reduce box **height** (drop `margin:[0,10,0,10]`), vertically center.
- Update the snapshot test intentionally.

### Part 3 — Multi-part (DEEL)

- **Data model** (`types.ts`): `partsCount`, `partIndex` (1-based), `partWeights:
  number[]` (sums 100). Thread through `courseCardSchema`, `CardFormFields` +
  `buildCourseCard`, `WizardDraft` + `draftToFormFields`, predefined cards.
  `buildCourseCard` defaults `1 / 1 / [100]`.
- **UX** (`CardEditPage.vue` + wizard review): "Aantal delen" (1–4, default 1). When
  >1 show "Dit is deel" and a per-deel % row with a live total that must equal 100%;
  block save otherwise. When =1, deel controls hidden/greyed. Resizing `partsCount`
  pads/trims `partWeights`.
- **PDF** (`definition.ts`): append `" - DEEL {partIndex}"` to the title when
  `partsCount > 1`; render the Puntenverdeling row from the model (per-deel split,
  current deel marked); make `formatDuration()` reflect `partsCount` instead of the
  hardcoded `"(1 deel)"`.

---

## Out of scope (→ Phase 7)

- **Template editor**: language select; editable page-2 procedure text, page-1 text
  below the Examengegevens table, and the red banner; save/overwrite named templates
  with name uniqueness; built-in template never overwritten; graphic stays.
- **English (en) language** support across templates + output.

## Verification gate

- `npm test` green (incl. updated snapshot + new unit tests: programme priority sort,
  examChance mapping, multi-part weight validation, `formatDuration` multi-part).
- `npm start` walkthrough: ordered programme list; deduped OLOD list with multiple
  subtitles; examenkans descriptions; start-time presets editable; name-driven
  Vaklector/Lectoren defaults + first-run prompt; allowed-resources preset default;
  DEEL 2 split 60/40 → PDF shows `- DEEL 1`, split puntenverdeling, fixed score box,
  uniform rows, page 1 on one page.
- Settings debug: "Omgeving opschonen" wipes data; "Voorbeeldkaarten aanmaken"
  recreates demo cards.
