# Requirements for PXL Cover Kit

## Purpose

Build a static browser-based web application that generates the current Dutch two-page PXL-Digital Blackboard exam cover PDF from reusable local data.

The application replaces the current manual workflow of editing DOCX files and exporting them to PDF for each course and exam. The app must run as a static website, generate PDFs entirely in the browser, and be suitable for hosting on GitHub Pages.

For MVP, the target is the current modern two-page Dutch Blackboard cover family as used today. Historical or legacy cover formats are not part of the product definition.

## Reference output

The normative reference for MVP is the current modern two-page Dutch Blackboard cover in the examples directory, with `42TIN2260 Automation I` as the baseline example.

Required visible document elements for MVP:

- Header with PXL-Digital branding, programme, academic year, exam chance, and maximum score.
- Course title line with course code and course name.
- Student section with blank writable fields.
- Exam data section with date, time range, lecturers, score text, duration text, and allowed resources.
- Blackboard instruction block on page 1.
- Blackboard confirmation-number area on page 1.
- Blackboard procedure instructions on page 2.

Acceptance for visual fidelity is based on acceptable layout drift relative to the current reference PDFs, as long as the result remains institutionally usable.

## Product scope

### In scope for MVP

- Static single-page web application.
- Vue 3 user interface.
- Vite-based build tooling using Node.js for local development and production builds only.
- Browser-only PDF generation using `pdfmake`.
- All user data stored locally in the browser.
- Card-based overview of current course covers.
- Create a course card from bundled programme-specific seed data.
- Create a course card manually when no seed entry exists.
- Override seeded values locally per card.
- Remove a card with explicit confirmation.
- Quick actualize flow for moving an existing card to the next academic cycle.
- Full update view for editing all fields of a card.
- Inline PDF preview inside the app.
- PDF download from the browser.
- Import and export of local app data as JSON.
- Support for multiple programmes through bundled seed files.
- Dutch output.

### Out of scope for MVP

- English output.
- Legacy or historical cover layouts.
- Multi-part Blackboard confirmation sections.
- Multiple exam-mode families beyond the current modern two-page Blackboard cover.
- Authentication.
- Cloud sync.
- Server-side storage.
- Server-side PDF generation.
- Live scraping from the browser app.
- Automatic submission to institutional platforms.
- Final visual design decisions beyond the functional UI requirements in this document.

## Technical assumptions

- The delivered app is a static site that can be hosted on GitHub Pages.
- The project uses Vue 3 with Vite as the default implementation stack.
- Vite build output is deployed as static files.
- If deployed as a project site on GitHub Pages, Vite must be configured with the correct repository base path.
- All PDF generation happens client-side through `pdfmake` document definitions.
- Inline preview can be implemented using pdfmake browser APIs such as data URL or Blob output rendered in an iframe or similar embedded viewer.
- The app bundles dependencies at build time rather than loading remote runtime scripts from a CDN.
- Institutional assets currently used in the cover may be stored in the repository because they are already acceptable for public use.
- If the exact institutional font cannot be redistributed, the app may use an open-source alternative or Arial-compatible fallback and document the difference.
- Node.js is required for local development and builds, but not for production hosting.

## Users and roles

### Primary user

A lecturer who repeatedly needs to maintain current exam covers and generate updated PDFs with minimal repeated data entry.

### Secondary users

- Other lecturers managing their own local course cards.
- Future maintainers who update seed data, template text, or PDF rendering logic.

No role-based permissions are required for MVP because all data is local to one browser profile.

## Core domain concepts

### Programme

Represents an education programme such as `PBTIN`.

Required fields:

- `id`: stable internal identifier.
- `code`: visible programme code.
- `name`: display name.
- `active`: boolean.

### Programme seed entry

Represents a bundled course or OLOD entry that can be used to create a card.

Required fields:

- `id`: stable internal identifier.
- `programmeCode`: owning programme code.
- `courseCode`: visible course code.
- `courseName`: visible course name.
- `defaultVaklector`: optional default vaklector.
- `defaultLecturers`: optional default lecturers.
- `defaultStartTime`: optional default start time.
- `defaultDurationMinutes`: optional default duration.
- `defaultAllowedResources`: optional default allowed resources text.
- `defaultMaxScore`: default score, normally `20`.
- `active`: boolean.
- `sourceLastUpdated`: optional timestamp.

### Course card

Represents one current editable exam cover card in the UI.

Required fields:

- `id`: stable internal identifier.
- `programmeCode`: selected programme.
- `seedEntryId`: optional reference to the bundled seed entry.
- `courseCode`: visible course code.
- `courseName`: visible course name.
- `academicYear`: current academic year, for example `2025-2026`.
- `examChance`: visible exam chance label or code used on the cover.
- `language`: `nl` for MVP.
- `examDate`: exam date.
- `startTime`: start time.
- `durationMinutes`: canonical duration input.
- `endTime`: derived display value for the PDF, with optional manual override in the full update view if later needed.
- `vaklector`: visible vaklector name.
- `lecturers`: one or more visible lecturer names.
- `roomPlaceCode`: optional room or place code.
- `maxScore`: maximum score, default `20`.
- `allowedResources`: rendered allowed resources text.
- `templateId`: selected PDF template.
- `createdAt`: timestamp.
- `updatedAt`: timestamp.
- `lastGeneratedAt`: optional timestamp.
- `source`: `manual` or `seeded`.
- `overrides`: local values that differ from the bundled seed entry.

### Template

Represents a versioned PDF template.

Required fields:

- `id`: stable internal identifier.
- `name`: display name.
- `language`: `nl` for MVP.
- `version`: semantic or date-based version.
- `requiresAssets`: list of required static assets.
- `status`: `draft`, `active`, or `deprecated`.

## Data layering and overrides

Recommended precedence from lowest to highest:

- Built-in application defaults.
- Bundled programme seed data.
- Course card local overrides.

The app must make it possible to edit seeded values locally without modifying the bundled seed file.

The app does not need to preserve a historical timeline of previous card states in MVP. The focus is the current active cover state per card.

## Seed data requirements

The app must support bundled static seed files for programme-specific course and OLOD data.

Requirements:

- Seed data is bundled with the app as static JSON.
- Seed files are read-only at runtime.
- Each programme can have its own seed file or its own section in a combined seed file.
- The UI must first ask for the programme when creating a new card, then offer the matching seeded course or OLOD entries for that programme.
- The user must be able to override any seeded value before saving the card.
- The app must continue to work when no seed file exists for a programme or when the user wants to create a fully manual card.
- Seed updates must not silently overwrite local overrides.

Example seed location:

```text
public/data/programmes.seed.json
```

## Main UI requirements

The main interface is a card-based overview of current course covers.

Functional requirements:

- One card represents one current course cover.
- The overview shows the important current state of each card, such as programme, course code, course name, academic year, exam date, and quick actions.
- The user can add a new card.
- The user can remove a card only after an explicit confirmation step.
- The user can filter cards by programme, academic year, and active status.
- Clicking a card opens its current details, preview, and actions.
- Each card must expose quick access to preview, download PDF, actualize, and full edit.
- The card overview and dialogs must remain usable with keyboard navigation.

## Card creation requirements

The user must be able to create a new card quickly.

Required flow:

1. Select programme.
2. Select a seeded course or OLOD entry for that programme, or choose manual creation.
3. Review prefilled values.
4. Override values as needed.
5. Save the card locally.

Required fields when saving a card:

- Programme.
- Course code.
- Course name.
- Academic year.
- Exam chance.
- Exam date.
- Start time.
- Duration.
- Vaklector.
- At least one lecturer.
- Maximum score.
- Allowed resources.
- Template.

## Actualize flow requirements

The app must provide a quick way to update an existing card for a new academic cycle.

Required behavior:

- The user can trigger actualize directly from a card.
- Actualize overwrites the current card state instead of creating history in MVP.
- Actualize should prefill the next academic year based on the current card when possible.
- Actualize must prompt for the new exam date.
- The same actualize dialog must allow the user to override start time and duration easily.
- The full edit view remains available for all other changes.

## Full update view requirements

The app must provide a full update view for editing all card fields.

Functional requirements:

- Edit all visible PDF fields.
- Edit seeded defaults locally for that card without changing the bundled seed file.
- Update lecturers, vaklector, allowed resources, room code, score, academic year, exam chance, and template.
- Preview the resulting PDF from the same working context.
- Save changes locally without requiring any backend.

## PDF generation requirements

The generated PDF must:

- Use A4 portrait pages.
- Generate the current Dutch modern two-page Blackboard exam cover.
- Preserve the overall layout structure of the current reference family with acceptable layout drift.
- Preserve writable blank areas for student data.
- Preserve the Blackboard confirmation-number area on page 1.
- Include the Blackboard instruction text on page 1.
- Include the Blackboard procedure page on page 2.
- Render a time range based on start time and duration.
- Use a predictable filename.
- Be generated entirely in the browser.

Recommended filename pattern:

```text
{academicYearShort}_{courseCode}_{courseNameSlug}_Examenvoorblad_{examChance}.pdf
```

Example:

```text
2526_42TIN2260_Automation_I_Examenvoorblad_S2.pdf
```

## PDF preview requirements

The app must support inline preview inside the application.

Functional requirements:

- The user can preview the current PDF without leaving the app.
- Preview uses client-side generated PDF data.
- Preview and download must stay in sync with the current card state.
- Preview controls must be keyboard accessible.

## Template rendering requirements

The rendering layer must separate data from layout.

Required concepts:

- `CourseCardData`: normalized input data for rendering.
- `TemplateDefinition`: static template configuration.
- `renderExamCoverPdfDefinition(data, template)`: function that returns a pdfmake document definition.
- `validateCourseCardData(data)`: validation before rendering.
- `formatCourseCardData(data, locale)`: formatting for dates, times, score text, and duration text.
- `generatePdfPreviewSource(data, template)`: helper that provides preview-ready output such as a Blob or data URL.

The rendering logic must not read directly from Vue form controls or browser storage.

## Validation and error handling requirements

The application must prevent obviously invalid PDFs.

Required validation cases:

- Missing programme.
- Missing course code.
- Missing course name.
- Missing academic year.
- Missing exam chance.
- Missing exam date.
- Missing start time.
- Missing duration.
- Invalid duration.
- No lecturers.
- Missing vaklector.
- Invalid maximum score.
- Empty allowed resources text.
- Missing required static assets.

Error messages must be specific and actionable.

## Storage requirements

The application must persist user data locally in the browser.

MVP storage requirements:

- Store user settings.
- Store programmes.
- Store bundled seed metadata if needed.
- Store course cards.
- Store locally reused lecturer defaults.
- Store template preferences.
- Store schema version information.

MVP may use `localStorage` for simplicity, but the structure should not block a future move to IndexedDB.

Recommended storage structure:

```json
{
  "schemaVersion": 1,
  "userSettings": {},
  "programmes": [],
  "programmeSeeds": [],
  "lecturers": [],
  "courseCards": [],
  "templatePreferences": {}
}
```

## Import and export requirements

The user must not be locked into one browser profile.

Functional requirements:

- Export all local application data to a JSON file.
- Import a previously exported JSON file.
- Validate imported data before saving it.
- Warn before replacing existing local data.
- Include schema version in exported data.

Merging imported data with existing data is desirable but not required for MVP.

## Privacy and security requirements

Requirements:

- All data remains in the browser unless the user exports it manually.
- No analytics by default.
- No third-party remote runtime scripts unless explicitly approved.
- Prefer bundling dependencies at build time.
- Do not store personal student data because the printed student fields remain blank.
- Make it clear that clearing browser site data can remove local information.

## Accessibility requirements

The application should be usable with keyboard navigation and screen readers.

Requirements:

- Form fields have labels.
- Validation errors are associated with relevant fields.
- Card actions are keyboard accessible.
- Preview and download controls are keyboard accessible.
- The application does not rely on color alone for validation status.

## Browser support requirements

MVP should target current stable versions of:

- Chrome.
- Edge.
- Firefox.

Safari support is desirable after MVP.

The app must still allow one-off PDF generation when persistent storage is unavailable.

## Testing requirements

The project should include automated tests for non-visual logic.

Required test areas:

- Seed-data normalization.
- Override precedence.
- Actualize flow logic.
- Time and duration calculations.
- Academic year formatting.
- Exam chance formatting.
- Filename generation.
- Validation rules.
- pdfmake document-definition generation shape.
- Storage migration behavior.

Visual regression testing for the PDF is desirable after the first working template exists.

## Acceptance criteria for MVP

The MVP is acceptable when:

- The app runs as a static Vue application without a backend.
- The app can be hosted on GitHub Pages.
- The user can create a card from programme seed data or manually.
- The user can remove a card with confirmation.
- The user can actualize a card by updating the current state with a new exam date and optional new start time and duration.
- The user can open a full update view for all other edits.
- The user can preview the PDF inline.
- The user can download the PDF from the browser.
- The user can generate a Dutch modern two-page Blackboard exam cover PDF with acceptable layout drift relative to the current reference examples.
- The user can reload the page and keep local data.
- The user can export and import local data as JSON.
- The generated filename is predictable and includes academic year, course code, course name, and exam chance.

## Open questions

These questions remain open but do not block the current MVP direction:

- Which exact font should be used when the institutional original cannot be redistributed?
- What exact seed-file format will be used for the separate programme and OLOD data you will provide?
- Which fields, if any, should become reusable lecturer or allowed-resources presets beyond per-card editing?
- How much of the inline preview UI should be specified in the future dedicated UI and UX design document versus this product requirements document?

## Suggested implementation phases

### Phase 1: App skeleton and local data

- Set up Vue 3 plus Vite project.
- Add pdfmake.
- Define core data types.
- Implement seed loading.
- Implement local persistence.
- Implement JSON import and export.

### Phase 2: Card workflow

- Build the card overview.
- Add create-card flow from programme seeds.
- Add remove-with-confirmation behavior.
- Add actualize dialog.
- Add full update view.

### Phase 3: PDF generation and preview

- Recreate the current Dutch modern two-page Blackboard template.
- Add required static assets.
- Implement inline preview.
- Implement filename generation and download.

### Phase 4: Validation and polish

- Strengthen validation and error messaging.
- Add automated tests for non-visual logic.
- Compare generated PDFs against current references.
- Document seed update workflow.

### Future features

- English support.
- Additional template families.
- Multi-part exam support.
- Richer preset management.
- Dedicated UI and UX design specification.

## Non-functional requirements

- The app should remain small enough to load comfortably as a static site.
- PDF generation should be deterministic for the same input.
- Template code must stay maintainable and avoid scattered hard-coded layout values.
- The app should work offline after the initial load when all assets are bundled locally.
- The codebase should stay easy to extend with more programmes, templates, and future UI refinements.