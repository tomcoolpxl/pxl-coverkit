# Feature Plan — English-language exam covers

Status: proposed · Author: generated for tom.cool@pxl.be · Date: 2026-06-06

## 1. Goal

Add **English (`en`)** as a second cover language next to the default **Nederlands
(`nl`)**. Some courses are taught/examined in English and need an English version of
the exact same Blackboard exam cover.

Guiding constraints:

- **Minimal UI impact.** Reuse the existing single template/layout; only the *text*
  changes per language. No new template directory, no Settings control.
- **`nl` is the default and the silent case.** A language badge is shown on the card
  **only when the cover is English** — never for Dutch, because Dutch is the norm.
- The picker is a **toggle switch** placed where the rest of the card fields are
  edited (wizard review step + edit page).
- The PDF and the procedure prose get a full English translation, not just labels.

### Product decisions (confirmed)

| Decision | Choice |
| --- | --- |
| English PDF filename | Append `_EN` before the extension (`..._Examenvoorblad_S1_EN.pdf`). Dutch unchanged. |
| Where language is set | Per-card toggle on wizard + edit only. New cards default to `nl`. **No** Settings default. |
| Template architecture | **One bilingual template.** `templateId` stays `template-nl-blackboard-v1`; language selects a string dictionary. (See §3.1 for the naming caveat.) |

### Online verification

Two terms in the mapping were verified against official sources and are correct as
given:

- Institution name → **“PXL University of Applied Sciences and Arts”**
  ([pxl.be](https://www.pxl.be/international/pxl-university-of-applied-sciences-and-arts/about-pxl/),
  [Wikidata Q4504959](https://www.wikidata.org/wiki/Q4504959)).
- Product name → **“LockDown Browser”** by Respondus (camel‑case `LockDown`)
  ([Respondus](https://web.respondus.com/he/lockdownbrowser/)).

## 2. Current state (what already exists)

The data model is already *almost* bilingual — only the surface is hardcoded to `nl`:

- `src/domain/types.ts` — `export type Language = 'nl'` and `CourseCard.language`
  already exists. Every card already carries `language: 'nl'`.
- `src/domain/schema.ts` — `language: z.literal('nl')`.
- `src/domain/cardFactory.ts`, `src/stores/wizard.ts` — thread `language` through but
  hardcode `'nl'`.
- `src/features/edit/CardEditPage.vue` — has a **disabled** “Taal” text field reading
  `Nederlands (nl)` (panel *“Sjabloon & Taal”*).
- `src/features/detail/CardDetailPage.vue` — hardcoded `Nederlands (nl)`.
- `src/pdf/template-nl-blackboard-v1/definition.ts` — the entire layout **and all
  Dutch text** live here, including helpers `formatDuration`, `formatPartsBreakdown`,
  `formatDate`, `formatTimeForPdf`.
- `src/domain/parts.ts` — `partTitleSuffix()` returns `" - DEEL {n}"`, used by the PDF
  **and** by the UI card titles (overview / detail / edit preview).
- `src/domain/filename.ts` — `buildPdfFilename()` hardcodes `Examenvoorblad`.

Because every stored card already has `language: 'nl'`, widening the schema from a
literal to an enum is **backward compatible** — no schema-version bump, no migration.

## 3. Design

### 3.1 Language as an attribute, not a new template

English is the *same* cover sheet with translated text, so language is an attribute of
the card, not a separate template. We keep one layout and select a **string
dictionary** by `card.language`.

Caveat: the folder is named `template-nl-blackboard-v1` and the `templateId` literal
embeds `nl`. Renaming both would force a data migration of every stored card's
`templateId` for zero user benefit. **We keep the existing folder name and
`templateId`** and treat them as a layout identifier that is now language‑agnostic.
This cosmetic mismatch is documented here and intentionally not “fixed”.

### 3.2 Type & schema changes

```ts
// src/domain/types.ts
export type Language = 'nl' | 'en';
```

```ts
// src/domain/schema.ts
language: z.enum(['nl', 'en']),
```

`CardFormFields.language` and `WizardDraft.language` become real choices instead of
always-`'nl'`.

### 3.3 String dictionary (the core of the feature)

New file `src/pdf/template-nl-blackboard-v1/strings.ts` holds one typed dictionary per
language. `definition.ts` imports it and reads `strings[data.language]`; the helpers
(`formatDuration`, `formatPartsBreakdown`, time/`u`-vs-`h` separator) take a `Language`
argument.

The complete English copy (drafted from the supplied mapping; full sentences
translated where the table only gave vocabulary) is in **Appendix A**. The dictionary
shape:

```ts
import type { Language } from '@/domain/types';

export interface TemplateStrings {
  headerDept: string;              // "PXL University of Applied Sciences and Arts – PXL-Digital department"
  programmePrefix: string;         // "Programme" / "Opleiding"
  academicYearPrefix: string;      // "Academic year" / "Academiejaar"
  student: string;
  lastName: string;
  firstName: string;
  studentNumber: string;
  classGroup: string;
  courseLecturer: string;          // "Course Lecturer" / "Vaklector"
  examRoomSeat: string;            // "Examination Room - Seat Code"
  examDetails: string;             // "Examination Details" / "Examengegevens"
  date: string;
  timeRange: string;               // "Time (start - end)"
  lecturers: string;
  gradingBreakdown: string;        // "Grading Breakdown" / "Puntenverdeling"
  timeAllocation: string;          // "Time Allocation" / "Tijdsverdeling"
  permittedResources: string;      // "Permitted Resources" / "Toegelaten hulpmiddelen"
  instructionHeader: string;
  instructions: string[];          // the page-1 bullet list
  confirmTitle: string;            // "To be completed by the student"
  confirmNote: string;
  confirmationNumber: string;      // "confirmation number"
  submissionTime: string;          // "Submission time"
  timeSeparator: string;           // 'u' (nl) / 'h' (en) — big letter in the time box
  page2Title: string;              // "Exam procedures"
  page2: Array<{ heading: string; items: Array<string | { text: string; bold?: boolean; sub?: string[] }> }>;
}

export const templateStrings: Record<Language, TemplateStrings> = {
  nl: { /* current literals, extracted verbatim */ },
  en: { /* Appendix A */ },
};
```

> Implementation note: extract the *existing* Dutch strings from `definition.ts` into
> `templateStrings.nl` **verbatim** first, switch `definition.ts` to read from the
> dictionary, and confirm the `nl` snapshot is unchanged. Only then add `en`. This
> guarantees zero visual change for existing Dutch covers.

### 3.4 Localized helpers

```ts
// formatDuration(minutes, partsCount, lang)
//   nl: "120 minuten (2 delen)"   /  "1 uur 20 minuten (inclusief tijd faciliteiten)"
//   en: "120 minutes (2 parts)"   /  "1 hour 20 minutes (including facilities time)"

// formatPartsBreakdown(data, lang)
//   nl: "1 deel, 100%"   /  "Deel 1: 60% (dit deel) · Deel 2: 40%"
//   en: "1 part, 100%"   /  "Part 1: 60% (this part) · Part 2: 40%"

// formatTimeForPdf(time, lang) → "8u30" (nl) / "8h30" (en); separator from strings.timeSeparator
```

`partTitleSuffix(partsCount, partIndex, lang = 'nl')` in `src/domain/parts.ts` gains an
optional `lang` param (default `'nl'` so existing callers are untouched):

- `nl` → `" - DEEL {n}"`
- `en` → `" - PART {n}"`

PDF and the three UI call sites (overview, detail, edit preview) pass `card.language`
so an English card's title reads `… - PART 1` consistently everywhere.

### 3.5 Filename

```ts
// src/domain/filename.ts
export interface FilenameInput {
  academicYear: AcademicYear;
  courseCode: string;
  courseName: string;
  examChance: string;
  language: Language;        // NEW
}
// ...append "_EN" only for English:
const langSuffix = input.language === 'en' ? '_EN' : '';
return `${year}_${code}_${slug}_Examenvoorblad_${chance}${langSuffix}.pdf`;
```

Callers in `generator.ts` already have the full `card`, so pass `language: card.language`.

### 3.6 UI

**Picker — `v-switch` (the “toggle switch”).** Placed in:

- `WizardReviewStep.vue` — a new field in the form row (near template/exam settings).
- `CardEditPage.vue` — replaces the disabled “Taal” text field in the *“Sjabloon &
  Taal”* panel.

Pattern (label flips, default off = Dutch):

```vue
<v-switch
  v-model="isEnglish"
  color="primary"
  inset
  hide-details
  :label="isEnglish ? 'Engelstalig voorblad (EN)' : 'Nederlandstalig voorblad (NL)'"
/>
```

`isEnglish` is a boolean ref mapped to/from `language: 'nl' | 'en'`. (Boolean is enough
for two languages and reads naturally as a toggle; if a third language ever appears,
swap for a `v-btn-toggle`.)

**Badge — English only.** A small chip shown on the card surface *only* when
`card.language === 'en'`:

```vue
<v-chip v-if="card.language === 'en'" size="x-small" variant="tonal" color="info">EN</v-chip>
```

Locations:

- `OverviewPage.vue` — in the chip row beside the `examChance` chip.
- `CardEditPage.vue` live-preview card — same spot, driven by `isEnglish`.
- `CardDetailPage.vue` — the “Taal” field becomes dynamic:
  `language === 'en' ? 'Engels (en)' : 'Nederlands (nl)'`.

Dutch cards look **exactly as they do today** (no badge) — satisfying “not if it’s
default Nederlands since it’s an exception.”

### 3.7 Data threading

- `WizardDraft` gains `language: Language`; `buildInitialDraft()` defaults it to `'nl'`;
  `draftToFormFields()` passes `draft.language` instead of `'nl'`.
- `CardEditPage.onSave` / `downloadCardPdf` pass `language: isEnglish ? 'en' : 'nl'`
  instead of the hardcoded `'nl'`.
- `cardFactory.buildCourseCard` already forwards `fields.language` — no change.
- Import/export & migrations: the enum widening covers imported `en` cards; existing
  `nl` cards still validate. **No `CURRENT_SCHEMA_VERSION` bump.**

## 4. File-by-file change list

| File | Change |
| --- | --- |
| `src/domain/types.ts` | `Language = 'nl' \| 'en'`. |
| `src/domain/schema.ts` | `language: z.enum(['nl','en'])`. |
| `src/domain/parts.ts` | `partTitleSuffix(count, index, lang='nl')` → DEEL/PART. |
| `src/domain/filename.ts` | Add `language` to input; append `_EN` for English. |
| `src/pdf/template-nl-blackboard-v1/strings.ts` | **New.** `templateStrings: Record<Language, TemplateStrings>` (nl extracted verbatim + en from Appendix A). |
| `src/pdf/template-nl-blackboard-v1/definition.ts` | Read `templateStrings[data.language]`; localize helpers; pass `lang` to `partTitleSuffix`. |
| `src/pdf/generator.ts` | Pass `language: card.language` to `buildPdfFilename`. |
| `src/stores/wizard.ts` | `WizardDraft.language`; `draftToFormFields` uses `draft.language`. |
| `src/features/wizard/WizardReviewStep.vue` | Language `v-switch`; seed draft language; include in saved draft. |
| `src/features/edit/CardEditPage.vue` | Replace disabled Taal field with `v-switch`; pass language in `onSave` + `downloadCardPdf`; EN chip in preview. |
| `src/features/detail/CardDetailPage.vue` | Dynamic “Taal” label; pass `card.language` to `partTitleSuffix`. |
| `src/features/overview/OverviewPage.vue` | EN chip in card chip row; pass `card.language` to `partTitleSuffix`. |

## 5. Tests

- `src/domain/schema.test.ts` — accept `'en'`, reject e.g. `'fr'`.
- `src/domain/filename.test.ts` — `_EN` appears for `en`, absent for `nl`.
- `src/domain/parts.test.ts` — `partTitleSuffix(2,1,'en') === ' - PART 1'`; default still DEEL.
- `src/pdf/template-nl-blackboard-v1/definition.test.ts` — keep the existing `nl`
  snapshot **unchanged** (proves the refactor is invisible); add an `en` snapshot.
  Delete/regenerate `__snapshots__/definition.test.ts.snap` only after confirming the
  nl portion is byte-identical.
- `src/domain/cardFactory.test.ts` / `src/stores/wizard.test.ts` — language round-trips
  from draft → card.
- Manual: `npm start`, create an English cover via the wizard, confirm the EN chip,
  the `_EN` PDF filename, and that both PDF pages render the Appendix-A copy.

## 6. Rollout / sequencing (small, reviewable commits)

1. **Model**: `Language` enum + schema + `parts`/`filename` signatures and their unit
   tests. (No behavior change for nl.)
2. **PDF strings refactor**: extract nl into `strings.ts`, switch `definition.ts` to the
   dictionary, prove nl snapshot unchanged.
3. **Add English copy**: `templateStrings.en` (Appendix A) + en snapshot.
4. **UI**: wizard + edit toggle, badges, detail label, data threading.
5. Verify via `npm start`; update `TODO.md` / `DONE.md` per the project workflow.

Each step keeps the app runnable and Dutch output identical.

## 7. Open / non-goals

- **Non-goal**: a Settings-level default language (explicitly declined — per-card only).
- **Non-goal**: renaming `templateId` / the template folder (§3.1).
- **Non-goal**: localizing the app *chrome* (menus, buttons, validation messages stay
  Dutch). Only the **cover output** and the per-card language affordances are bilingual.
- Time separator `u`→`h` for English is a small inferred choice (not in the mapping);
  call out in review if a different convention is preferred.

---

## Appendix A — English string set

### Header

| Key | English |
| --- | --- |
| headerDept | `PXL University of Applied Sciences and Arts – PXL-Digital department` |
| programmePrefix | `Programme {code}` |
| academicYearPrefix | `Academic year {year} {chance}` |

### Student / examination table

| Dutch label | English label |
| --- | --- |
| Student | Student |
| Naam student | Last Name |
| Voornaam student | First Name |
| Studentennummer | Student Number |
| Klasgroep | Class Group |
| Vaklector | Course Lecturer |
| Examenlokaal - Plaatscode | Examination Room - Seat Code |
| Examengegevens | Examination Details |
| Datum | Date |
| Tijdstip (aanvang - einde) | Time (start - end) |
| Lectoren | Lecturers |
| Puntenverdeling | Grading Breakdown |
| Tijdsverdeling | Time Allocation |
| Toegelaten hulpmiddelen | Permitted Resources |

### Computed values

| Case | English |
| --- | --- |
| Duration, single part | `120 minutes (1 part)` |
| Duration, multi part | `120 minutes (2 parts)` |
| Duration, 80 min special | `1 hour 20 minutes (including facilities time)` |
| Duration, whole hours | `2 hours (2 parts)` |
| Grading, single part | `1 part, 100%` |
| Grading, multi part | `Part 1: 60% (this part) · Part 2: 40%` |
| Title suffix | ` - PART {n}` |
| Time separator | `h` (e.g. `8h30`) |

### Page 1 — Blackboard instruction block

Header:

> IMMEDIATELY AFTER COMPLETING EACH PART, FILL IN THE confirmation number AND the
> submission time OF YOUR BLACKBOARD EXAM ON THE NEXT PAGE.

Bullets:

- Start the exam on Blackboard immediately when the invigilator gives permission to do so.
- You will be given the access code.
- Submitting blank? Write “submitted blank” at the top of this exam paper, together with your signature.
- *(bold)* On this page, note the first 8 characters of the confirmation number and the submission time.
- This number and time are shown in a pop-up that appears after you submit your exam.
- *(bold, underline)* If the confirmation number and/or the submission time are not filled in correctly, your exam may be considered invalid.

Confirmation box:

- Title: **To be completed by the student**
- Note: *Note here the submission time and the first eight characters of the confirmation number shown when you submit your exam*
- Field label: `confirmation number`
- Field label: `Submission time` (with the big `h` separator between the two hour/minute boxes)

### Page 2 — Exam procedures

Title: **Exam procedures**

**When you enter the examination room**
- Group coats, handbags and book bags at the back; if the room does not allow this, group them at the front
- Pen, laptop + power adapter + extension cable + mouse, student card, exam card, water bottle on the desk
- Switch OFF phones AND smartwatches and place them face-down on the corner of the desk.

**Before the start of the exam**
- Last opportunity to use the toilet.

**Starting the exam**
- Go to the exam on Blackboard and wait until you receive the code from the invigilator

**During the exam**
- Keep the Blackboard exam open
- Keep an eye on the exam duration

**When you submit the exam and hand in your exam paper**
- *(bold)* SUBMITTING TOO LATE = INVALID EXAM
- Click Submit
  - *(bold, sub-bullet)* clicking ‘Save and Close’ results in an invalid exam!
- Do not close the submission confirmation screen!
  - *(sub-bullet)* Write the first 8 characters of the confirmation number on the exam paper
  - *(sub-bullet)* Write the submission time on the exam paper
- You may now close the submission confirmation screen

### Glossary cross-check (from the supplied mapping)

The remaining mapping rows are vocabulary used inside the sentences above and are honored
in the translations: Blackboard LockDown Browser, laptop, documentation, no paper, exam
on laptop only, NO Internet access, NO AI tools, Part 1 / Part 2, submit blank, exam
paper, signature, invigilator, access code, exam, Submit, Save and Close, invalid exam,
submission confirmation screen, confirmation number, student card, exam card, mobile
phone, switched-off mobile phone, classroom, coats and bags, desk, power adapter,
extension cable, mouse, ECTS credits.
