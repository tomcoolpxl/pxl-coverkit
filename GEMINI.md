# PXL Cover Kit Project Rules

This repository builds the PXL Cover Kit web app.

`REQUIREMENTS.md` is the current project truth.

## Project Workflow

- Work directly on `main`. No per-phase branches, no pull requests. Commit and push when work is verified.
- Keep work small enough for one review cycle.
- Stay inside the accepted requirements.
- Ask before broad refactors, test removal, or directory-structure changes.
- When `IMPLEMENTATION_PLAN.md`, `TODO.md`, and `DONE.md` exist, use them as the project-state workflow files.
- Use `IMPLEMENTATION_PHASE[N].md` as the immutable blueprint for each phase.
- **Runnable State**: Maintain a `package.json` with a `start` script.
- **Verification**: Always verify the "runnable" state via `npm start` before marking a task as done.
- **GitHub Pages Deployments**: Keep the Pages `deploy` job checkout-free unless a later step strictly requires a repository worktree; `actions/deploy-pages` only needs the uploaded artifact, and avoiding checkout prevents post-job git cleanup failures.
- Keep disposable logs and Python cache artifacts out of the repository via `.gitignore`.
- Refresh `TODO.md` from the current plan phase.
- Update `TODO.md` and `DONE.md` after implementation.
- When `DONE.md` exists, it holds only verified work.
- adapt this file at the end of each implementation round!

## examples

Old examples of the manual workflow this project is to replace: in `/examples` directory

## Seed Data Utilities

- `scripts/scrape_studiegids_tree.py` crawls the public PXL studiegids tree for one academic year and outputs one raw JSON snapshot.
- `scripts/scrape_studiegids_tree.py` defaults to the `PXL-Digital` department when no department filter is provided; pass an explicit department filter if you intentionally want a different scope.
- The crawler is validated against both `2025-26` and `2026-27` entry pages, and the known PBTIN path works through `Modeltraject -> Trajectschijf -> Deeltraject`.
- Use `requests` for studiegids transport; the endpoint rejected the earlier `urllib` client during validation.
- `scripts/build_programmes_seed.py` converts one raw crawl file into one year-specific seed file.
- Do not combine academic years in one output file; generate and replace one academic-year seed file at a time.

## PDF Generation Utilities

- The PDF templates use `pdfmake` with custom base64 VFS font and image maps to allow offline browser-side rendering.
- A custom Vite build-time plugin in `vite.config.ts` dynamically packs the Carlito font files (`src/pdf/fonts/`) into `virtual:pdfmake-vfs`.
- Large image assets (logos, screenshots) are stored in `src/pdf/template-nl-blackboard-v1/assets.ts` as base64-encoded strings.

## Validation & Accessibility Utilities

- `validateCourseCardData()` in `src/pdf/generator.ts` acts as the pre-rendering guardian, validating CourseCard fields against Zod and verifying that required assets (Carlito fonts, Blackboard screenshots, and PXL logos) are successfully loaded at run time.
- Visually hidden `aria-live` containers (`.sr-only` class) are configured on multi-step wizard views to announce stage transitions to screen readers.
- Standard Vuetify input error configurations natively map input fields to their respective validation warnings using `aria-describedby` attributes.
- Failed browser storage persistence attempts (e.g., private browsing mode) fallback to memory maps and warn users via a global `v-alert` warning inside `AppShell.vue`.

## Bilingual Templates & English-Language Covers

- We maintain one layout structure in `template-nl-blackboard-v1` and handle Dutch (`nl`) and English (`en`) via a strings dictionary mapping in `src/pdf/template-nl-blackboard-v1/strings.ts`. The `templateId` remains unchanged as `template-nl-blackboard-v1` for backward compatibility.
- Language is set per card as an attribute (`language: 'nl' | 'en'`). The wizard review step and edit page feature a bilingual toggle switch.
- English covers display an "EN" badge chip on the card surfaces and append `_EN` before the file extension in the downloaded PDF filename.
- Formatting helper functions (`formatDuration`, `formatPartsBreakdown`, time separator) accept a `Language` argument to output localized details.

