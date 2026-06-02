# Phase 4 — PDF generation

**Goal.** Generate the current Dutch two-page Blackboard exam cover PDF in the browser.

**In scope:**

- Carlito font (OFL) added under `src/pdf/fonts/`; small build-time Vite plugin generates a custom `vfs_fonts` blob and pdfmake is configured to use it. `vite.config.ts` updated with `optimizeDeps.include: ['pdfmake/build/pdfmake', 'pdfmake/build/vfs_fonts']`.
- Required PXL assets (logo, marks) added under `src/assets/pdf/` and imported as base64 by `pdf/template-nl-blackboard-v1/assets.ts`.
- `pdf/template-nl-blackboard-v1/`:
  - `tokens.ts` — sizes, spacing, colours.
  - `definition.ts` — exports `renderExamCoverPdfDefinition(data, template)` returning a `TDocumentDefinitions`.
  - `assets.ts` — bundled image data.
- Two-page A4 portrait output covering all visible elements listed in `REQUIREMENTS.md` §"Reference output".
- `domain/filename.ts` wired into the download flow producing the predictable filename.
- "Download PDF" button enabled on the overview card row, card detail, and full update view.
- Tests: snapshot tests for the doc definition on two fixtures (seeded and manual cards).

**Out of scope:**

- Visual regression vs. reference PDFs beyond ad-hoc comparison (Phase 5).
- English template, multi-part Blackboard sections.

**Verification gate:**

- `npm start` + Vitest green (snapshots).
- Manual walkthrough: download PDF for the `42TIN2260 Automation I` baseline card; visually compare to `examples/2526_42TIN2260_Automation_I_Examenvoorblad_S2.pdf`; check filename matches the expected pattern; open in Acrobat or a strict viewer to confirm both pages render.
