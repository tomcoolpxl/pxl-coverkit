# PXL Cover Kit Project Rules

This repository builds the PXL Cover Kit web app.

`REQUIREMENTS.md` is the current project truth.

## Project Workflow

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