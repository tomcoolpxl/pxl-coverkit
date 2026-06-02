# Requirements for static exam cover PDF generator: PXL Cover Kit

## Purpose

Build a small static web application that generates the first pages of an exam submission PDF from reusable course and exam data.

The application must replace manually editing a DOCX file and exporting it to PDF for each course and exam. It must run entirely in the browser, be hostable as static files on GitHub Pages, and generate a PDF that matches the institutional exam cover layout closely enough for submission.

The first target template is based on the current Dutch PXL-Digital exam cover for `42TIN2260 Automation I`, including the student information area, exam metadata, allowed resources, Blackboard submission instructions, confirmation-number boxes, and the second page of Blackboard/LockDown Browser instructions.

## Context from the current example files

The attached DOCX is the manually maintained source file. The attached PDF is the generated file that must be submitted.

The current example contains these visible document elements:

- Header with PXL-Digital branding, department text, programme, academic year and exam chance, and maximum score.
- Course title line with course identifier and course name.
- Student section with blank fields for name, first name, student number, class group, exam lecturer, and exam room/place code.
- Exam data section with date, start and end time, lecturers, score distribution, time distribution, and allowed resources.
- Blackboard exam instruction block on page 1.
- Student-fillable Blackboard confirmation section for part I on page 1.
- A second page with Blackboard/LockDown Browser procedure instructions for entering the room, starting the exam, taking the exam, and submitting the exam.

## Product scope

### In scope

- Static browser-only web application.
- PDF generation in the browser using `pdfmake`.
- No continuously running backend.
- User-entered data persisted locally in the browser per user/device/browser profile.
- Reusable course defaults.
- Per-exam overrides.
- Support for Dutch and English templates.
- Support for multiple programmes, courses, lecturers, exam chances, exam modes, exam parts, and allowed-resource policies.
- Initial data can be pre-seeded from a scraped source, but scraping/importing is treated as a separate pipeline from the PDF generator.
- The application must allow generated PDFs to be downloaded by the user.

### Out of scope for the first version

- Authentication.
- Cloud sync.
- Server-side storage.
- Server-side PDF generation.
- Live scraping from the static app when CORS, authentication, or institutional access makes that unreliable.
- Final UI/UX design decisions.
- Automatic submission to institutional platforms.
- Editing arbitrary DOCX templates directly.

## Technical assumptions

- The application is a static site and can be hosted on GitHub Pages.
- All PDF generation happens client-side.
- `pdfmake` is the primary PDF generation library.
- The PDF is generated from a structured document-definition template, not by modifying the original DOCX.
- Local browser storage is sufficient for MVP user preferences, course defaults, and exam instances.
- The current DOCX/PDF should be treated as the reference output, but not as the runtime template format.
- Institutional logos, screenshots, and fixed instruction images must be included as static assets or embedded as base64 data, subject to institutional rules.

## Users and roles

### Primary user

A lecturer who teaches multiple courses and must generate exam cover PDFs repeatedly.

### Secondary users

- Other lecturers who need the same type of exam cover.
- Co-lecturers who share a course but may need different defaults.
- Future maintainers who update institutional text, language variants, or template rules.

No separate role-based permissions are required in the MVP because the app runs locally in each user's browser without shared server-side state.

## Domain model

### Programme

Represents an education programme such as `PBTIN`.

Required fields:

- `id`: stable internal identifier.
- `code`: visible programme code, for example `PBTIN`.
- `name`: optional display name.
- `department`: default department text, for example `PXL-Digital`.
- `institution`: default institution text, for example `Hogeschool PXL`.
- `active`: boolean.

### Academic year

Represents an academic year such as `2025-2026`.

Required fields:

- `value`: display value, for example `2025-2026`.
- `startYear`: numeric start year.
- `endYear`: numeric end year.
- `active`: boolean.

### Exam chance

Represents the exam period/chance.

Required values for MVP:

- `S1`: semester 1.
- `S2`: semester 2.
- `EK2`: second exam chance.

Required fields:

- `code`: `S1`, `S2`, or `EK2`.
- `labelNl`: Dutch label.
- `labelEn`: English label.
- `sortOrder`: ordering value.

### Lecturer

Represents a lecturer who can appear as vaklector and/or lector.

Required fields:

- `id`: stable internal identifier.
- `displayName`: full display name.
- `email`: optional.
- `defaultRole`: optional, for example `vaklector`, `lector`, or `co-lector`.
- `active`: boolean.

### Course

Represents a course from the user's course overview.

Required fields:

- `id`: stable internal identifier.
- `code`: course identifier, for example `42TIN2260`.
- `name`: course name, for example `Automation I`.
- `programmeCodes`: one or more programme codes.
- `academicYears`: academic years in which this course exists, if known.
- `defaultLanguage`: `nl` or `en`.
- `defaultLecturers`: one or more lecturer ids or names.
- `defaultVaklector`: one lecturer id or name.
- `defaultMaxScore`: default `20`.
- `defaultExamMode`: default exam mode.
- `defaultAllowedResources`: default allowed-resource policy.
- `defaultExamParts`: one or more default exam parts.
- `defaultRoomText`: optional.
- `source`: `manual`, `scraped`, or `seeded`.
- `sourceLastUpdated`: optional timestamp.
- `userJoined`: boolean indicating whether the lecturer wants this course in their own overview.
- `overrides`: user-specific overrides layered on top of scraped/seeded data.

### Exam instance

Represents one generated exam cover for a course.

Required fields:

- `id`: stable internal identifier.
- `courseId`: linked course.
- `programmeCode`: selected programme.
- `academicYear`: selected academic year.
- `examChance`: `S1`, `S2`, or `EK2`.
- `language`: `nl` or `en`.
- `date`: exam date.
- `startTime`: start time.
- `endTime`: end time or computed from duration.
- `durationMinutes`: total duration.
- `maxScore`: default `20`, overridable.
- `lecturers`: one or more names.
- `vaklector`: one name.
- `roomPlaceCode`: optional text.
- `parts`: list of exam parts.
- `allowedResources`: final rendered allowed-resource text or selected policy.
- `createdAt`: timestamp.
- `updatedAt`: timestamp.
- `lastGeneratedAt`: optional timestamp.

### Exam part

Represents a part of an exam. Exams can have one, two, or three parts.

Required fields:

- `id`: stable internal identifier.
- `label`: visible label, for example `DEEL I`, `DEEL II`, or English equivalent.
- `title`: optional part title.
- `scorePercentage`: percentage of total score.
- `durationMinutes`: duration for this part.
- `platform`: for example `blackboard`, `blackboard-lockdownbrowser`, `paper`, `oral`, `other`.
- `requiresBlackboardConfirmation`: boolean.
- `allowedResourcesOverride`: optional override for this part.
- `instructionsOverride`: optional override for this part.

### Allowed-resource policy

Represents reusable allowed resources text.

Required fields:

- `id`: stable internal identifier.
- `name`: internal display name.
- `language`: `nl` or `en`.
- `examMode`: associated exam mode.
- `text`: rendered text used in the exam data table.
- `notes`: optional internal notes.

Example policies:

- Blackboard LockDown Browser on laptop, documentation as configured in LockDown Browser, no paper, exam only on laptop, no internet, no AI tools.
- Blackboard exam without LockDown Browser.
- Paper exam with specified documentation.
- Exam with course-specific documentation.
- Exam with open-book documentation but no internet.
- Exam with explicitly allowed internet or tools, only if institutionally permitted.

### Template

Represents a versioned document template.

Required fields:

- `id`: stable internal identifier.
- `name`: display name.
- `language`: `nl` or `en`.
- `version`: semantic or date-based version.
- `pages`: page definitions.
- `supportsExamModes`: list of supported exam modes.
- `requiresAssets`: list of required static assets.
- `status`: `draft`, `active`, or `deprecated`.

## Data layering and overrides

The application must support layered defaults so that the user does not repeatedly enter the same information.

Recommended precedence from lowest to highest:

- Built-in application defaults.
- Scraped or pre-seeded course catalogue data.
- User-level defaults.
- Course-level user overrides.
- Exam-instance values.
- One-off generated-document overrides, if supported later.

The app must make it possible to reset an override back to the underlying seeded value.

## Course overview requirements

The user must be able to maintain a personal course overview.

Functional requirements:

- Show courses available from pre-seeded/scraped data.
- Show courses manually added by the user.
- Allow the user to mark themselves as involved in a course.
- Allow the user to remove a course from their personal overview without deleting the global pre-seeded course definition.
- Allow course data to be edited locally.
- Preserve user overrides when seeded data is updated.
- Allow filtering by programme, academic year, and active/inactive status.
- Allow selecting a course to create or edit an exam instance.

## Exam creation requirements

The user must be able to create an exam instance from a course.

Required fields for exam creation:

- Programme.
- Academic year.
- Exam chance.
- Course code.
- Course name.
- Exam date.
- Start time.
- End time or duration.
- Vaklector.
- One or more lecturers.
- Maximum score, defaulting to `20`.
- Exam room/place code, optional.
- Exam mode.
- Number of exam parts.
- Score distribution across parts.
- Time distribution across parts.
- Allowed resources.
- Language.

Validation requirements:

- Date must be present and valid.
- Start time must be present and valid.
- Either end time or duration must be present.
- If both end time and duration are present, they must be consistent or the user must explicitly choose which value wins.
- Maximum score must be a positive number and should default to `20`.
- Score distribution should total `100%` unless the user explicitly marks it as non-percentage based.
- Time distribution should match the total duration unless explicitly overridden.
- At least one lecturer must be present.
- Course code and course name must be present.
- Programme must be present.
- Exam chance must be present.

## Exam modes

The system must model exam mode separately from allowed resources and instructions.

Required exam modes for MVP:

- Blackboard with LockDown Browser.
- Blackboard without LockDown Browser.

For each exam mode, the system must determine:

- Whether Blackboard submission confirmation boxes are required.
- Whether page 1 Blackboard instructions are included.
- Whether page 2 Blackboard/LockDown Browser instructions are included.
- Whether the allowed-resources text should be selected from a default policy.
- Whether exam parts each need separate confirmation sections.

## Language requirements

The system must support Dutch and English output.

Functional requirements:

- The user must choose a language per course default and per exam instance.
- All fixed labels must be translatable.
- All fixed instruction blocks must be translatable.
- Allowed-resource policies must be language-specific.
- Template selection must be language-aware.
- Course names and lecturer names are not translated unless explicitly provided.

The first version may include Dutch as the primary complete template and English as a second template that can be completed incrementally.

## PDF generation requirements

The generated PDF must:

- Use A4 portrait pages.
- Generate at least the first two pages matching the reference exam cover for Blackboard LockDown Browser exams.
- Preserve table-like layout for header, student fields, and exam data.
- Preserve empty writable areas for student data.
- Preserve confirmation-number boxes for Blackboard submission confirmation codes.
- Support one, two, or three exam parts.
- Generate appropriate score and time distribution text from structured part data.
- Include page 2 only when required by the selected exam mode/template.
- Use predictable file names.
- Be generated entirely in the browser.

Recommended generated filename pattern:

```text
{academicYearShort}_{courseCode}_{courseNameSlug}_Examenvoorblad_{examChance}.pdf
```

Example:

```text
2526_42TIN2260_Automation_I_Examenvoorblad_S2.pdf
```

## Template rendering requirements

The template rendering layer must separate data from layout.

Required concepts:

- `ExamCoverData`: normalized input data.
- `TemplateDefinition`: static template configuration.
- `renderExamCoverPdfDefinition(data, template)`: function that returns a pdfmake document definition.
- `validateExamCoverData(data)`: validation before rendering.
- `formatExamCoverData(data, locale)`: formatting for dates, times, score text, and duration text.

The rendering logic must not read directly from form controls or browser storage. It must accept normalized data objects so it can be tested independently.

## Storage requirements

The application must persist user data locally in the browser.

MVP storage requirements:

- Store user settings.
- Store lecturer defaults.
- Store joined courses.
- Store course overrides.
- Store exam instances.
- Store reusable allowed-resource policies.
- Store template preferences.

Storage should be versioned so data can be migrated between application versions.

Recommended storage structure:

```json
{
  "schemaVersion": 1,
  "userSettings": {},
  "lecturers": [],
  "programmes": [],
  "courses": [],
  "courseOverrides": [],
  "examInstances": [],
  "allowedResourcePolicies": [],
  "templates": []
}
```

MVP implementation can use `localStorage` for simplicity. The design should not prevent moving to IndexedDB later if data grows, import/export becomes more complex, or assets need to be stored locally.

## Import and export requirements

The user must not be locked into one browser profile without backup.

Functional requirements:

- Export all local application data to a JSON file.
- Import a previously exported JSON file.
- Validate imported data before saving it.
- Warn before replacing existing local data.
- Allow merging imported data with existing data, if feasible.
- Include schema version in exported data.

## Pre-seeded and scraped data requirements

Scraping is a separate concern from the static PDF generator.

The PDF generator must be able to consume a pre-seeded data file, for example:

```text
public/data/courses.seed.json
```

The pre-seeded file may contain course codes and course names such as `42TIN2260 Automation I`, programme mappings such as `PBTIN`, and default lecturer/course metadata when available.

Requirements:

- Seeded data must be read-only by default.
- User overrides must be stored separately from seeded data.
- Seeded data updates must not overwrite local user overrides without explicit confirmation.
- The seed format must include a source timestamp and source identifier.
- The application must tolerate missing seeded data and still allow manual course creation.

Potential future pipeline:

- A separate script scrapes the course overview webpage.
- The script normalizes course codes, course names, programme codes, and academic years.
- The script writes a static JSON seed file.
- The static web app loads that JSON file at runtime.

## Asset requirements

The application may need static assets to reproduce the PDF.

Potential assets:

- PXL-Digital logo.
- Blackboard submission confirmation screenshot or simplified diagram.
- Optional institutional icons or branding elements.
- Fonts, if required by institutional layout.

Requirements:

- Assets must be stored in the repository only when licensing and institutional policy allow it.
- Assets must be optimized for client-side loading.
- PDF generation must handle missing non-critical assets gracefully where possible.
- If exact fonts cannot be distributed, the app must use a close fallback and document the difference.

## Validation and error handling requirements

The application must prevent obviously invalid PDFs.

Required validation cases:

- Missing course code.
- Missing course name.
- Missing programme.
- Missing academic year.
- Missing exam chance.
- Missing date.
- Missing start time.
- Missing end time and duration.
- Inconsistent end time and duration.
- No lecturers.
- Invalid number of exam parts.
- Score distribution not totaling 100%.
- Time distribution not matching total duration.
- Empty allowed-resource text.
- Missing required static assets.

Error messages must be specific and actionable.

## Privacy and security requirements

The app should not send exam data to any server in the MVP.

Requirements:

- All data remains in the browser unless the user exports it manually.
- No analytics by default.
- No third-party remote scripts unless explicitly approved.
- Prefer bundling dependencies at build time over loading from public CDNs.
- Do not store personal student data because the generated cover contains blank student fields.
- Make it clear that local browser data can be lost if the user clears site data.

## Accessibility requirements

The web application should be usable with keyboard navigation and screen readers.

Requirements:

- Form fields have labels.
- Validation errors are associated with the relevant fields.
- Generated PDF preview/download controls are keyboard accessible.
- Language selection is explicit.
- The application should not rely on colour alone to communicate validation status.

## Browser support requirements

MVP should target current stable versions of:

- Chrome.
- Edge.
- Firefox.

Safari support is desirable but can be verified after the MVP.

The app must handle browsers where storage is disabled or unavailable by allowing at least one-off PDF generation without persistence.

## Testing requirements

The project should include automated tests for non-visual logic.

Required test areas:

- Data normalization.
- Validation rules.
- Time and duration calculations.
- Academic year formatting.
- Exam chance formatting.
- Score distribution formatting.
- Time distribution formatting.
- Dutch label rendering.
- English label rendering.
- Course override precedence.
- Seeded data merging.
- Filename generation.
- pdfmake document-definition generation shape.

Visual regression tests are desirable after the first working template exists.

## Acceptance criteria for MVP

The MVP is acceptable when:

- The app runs from static files without a backend.
- The app can be hosted on GitHub Pages.
- The user can create or edit a course manually.
- The user can create an exam instance for a course.
- The user can enter programme, academic year, exam chance, date, time, lecturers, exam parts, and allowed resources.
- The user can generate a Dutch Blackboard LockDown Browser exam cover PDF matching the current two-page reference closely enough for practical submission.
- The user can save course defaults locally.
- The user can reload the page and keep local data.
- The user can export and import local data as JSON.
- The generated PDF filename is predictable and includes academic year, course code, course name, and exam chance.

## Open questions

These questions should be resolved before implementation or during early prototyping:

- How exact must the generated PDF be compared with the DOCX-exported PDF: visually identical, institutionally equivalent, or simply containing the required information?
- Can the PXL-Digital logo and Blackboard screenshot be stored in a public GitHub repository?
- Is the submitted PDF required to use a specific font?
- Are there official English versions of the fixed instruction text, or must they be translated manually?
- Are there official variants for Blackboard without LockDown Browser, paper exams, or documentation-based exams?
- Do all exam parts require separate Blackboard confirmation boxes, or only Blackboard-based parts?
- Should `EK2` be displayed exactly as `EK2`, or does the institution require a longer label in some contexts?
- Can exam room/place code remain blank, or should the app support planned room data later?
- Should multiple programmes for the same course generate one PDF per programme or one PDF with multiple programme codes?
- Should co-lecturers be stored globally, per course, or per exam instance only?
- Should the app support custom institutional templates per department later?
- Should the app support importing scraped data manually through a JSON file before a seed-file pipeline exists?
- Should the app include a PDF preview, or is direct download enough for MVP?

## Suggested implementation phases

### Phase 1: Data model and static generator skeleton

- Set up static web app project.
- Add pdfmake.
- Define TypeScript data types or JavaScript schema objects.
- Implement validation and formatting.
- Implement local persistence.
- Implement JSON import/export.

### Phase 2: Dutch Blackboard LockDown Browser template

- Recreate the current two-page PDF structure using pdfmake.
- Add static assets.
- Generate the reference `Automation I` PDF from structured data.
- Compare manually against the current generated PDF.

### Phase 3: Course defaults and personal course overview

- Add seeded course data support.
- Add user-joined courses.
- Add course-level overrides.
- Add exam instance creation from course defaults.

### Phase 4: Multiple exam modes and exam parts

- Add Blackboard without LockDown Browser.
- Add paper exam and mixed exam variants.
- Add one-, two-, and three-part exam rendering.
- Add reusable allowed-resource policies.

### Phase 5: English support and maintainability

- Add English labels and instruction text.
- Add template versioning.
- Add tests and visual regression workflow.
- Document how to update seeded data and template text.

## Non-functional requirements

- The app should remain small enough to load comfortably as a static site.
- The PDF generation code must be deterministic for the same input data.
- The template code must be maintainable and avoid hard-coded values scattered through the application.
- The app must work offline after initial load if all assets are bundled locally.
- The codebase should make it straightforward to add new templates and exam modes later.
