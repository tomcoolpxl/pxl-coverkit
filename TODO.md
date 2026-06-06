# TODO — Phase 6 (Wizard/UX fixes, PDF layout fixes, multi-part DEEL)

Live work tracking for the current phase. Blueprint: `IMPLEMENTATION_PHASE6.md`.
Items move to `DONE.md` only after the verification gate passes for them.

> No migrations, no backwards compatibility this phase — add fields directly; stale
> local data is cleared via the new "Omgeving opschonen" debug button.

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
