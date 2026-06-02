# TODO — Phase 4 (PDF generation)

Live work tracking for the current phase. Items move to `DONE.md` only after the verification gate passes for them.

## Tasks

- [x] Add Carlito font (OFL) under `src/pdf/fonts/`
  - [x] Implement a small build-time Vite plugin to generate a custom `vfs_fonts` blob
  - [x] Configure pdfmake to use the custom VFS font blob
  - [x] Update `vite.config.ts` to include `pdfmake/build/pdfmake` and `pdfmake/build/vfs_fonts` in `optimizeDeps.include`
- [x] Add required PXL assets (logo, marks) under `src/assets/pdf/`
  - [x] Import them as base64 in `pdf/template-nl-blackboard-v1/assets.ts`
- [x] Implement the `pdf/template-nl-blackboard-v1/` module:
  - [x] `tokens.ts` — sizes, spacing, colours
  - [x] `definition.ts` — exports `renderExamCoverPdfDefinition(data, template)` returning `TDocumentDefinitions`
  - [x] `assets.ts` — bundled base64 image assets
- [x] Cover all visible elements listed in `REQUIREMENTS.md` §"Reference output" in a two-page A4 portrait layout
- [x] Wire `domain/filename.ts` into the download flow to produce the predictable filename
- [x] Enable the "Download PDF" buttons on:
  - [x] Card overview row
  - [x] Card detail view
  - [x] Full update view
- [x] Add snapshot tests for the document definition on seeded and manual card fixtures

## Verification Gate

- `npm start` + Vitest green (including document definition snapshots)
- Manual walkthrough:
  - Download the PDF for the `42TIN2260 Automation I` baseline card
  - Verify filename matches the expected pattern
  - Visually compare the generated PDF to `examples/2526_42TIN2260_Automation_I_Examenvoorblad_S2.pdf`
  - Verify both pages render in a strict viewer (Acrobat, Chrome PDF viewer)
