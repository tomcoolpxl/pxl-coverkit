# PXL Cover Kit Project Rules

This repository builds the PXL Cover Kit web app.

**`ARCHITECTURE.md` is the technical source of truth** — read it before working
on the codebase. `README.md` is the user-facing introduction. This file holds
only the cross-tool workflow rules and a few operational reminders not covered
there.

## Project Workflow

- Work directly on `main`. No per-phase branches, no pull requests. Commit and
  push when work is verified.
- Keep work small enough for one review cycle.
- Ask before broad refactors, test removal, or directory-structure changes.
- **Runnable State**: keep `package.json` with a working `start` script.
- **Verification**: verify the runnable state (`npm start`, `npm test`,
  `npm run typecheck`, `npm run build`) before marking a task done.
- **GitHub Pages deploy**: keep the Pages `deploy` job checkout-free unless a
  later step strictly requires a worktree; `actions/deploy-pages` only needs the
  uploaded artifact, and avoiding checkout prevents post-job git-cleanup
  failures.
- Keep disposable logs and Python cache artifacts out of the repo via
  `.gitignore`.

## Operational reminders

- Seed data is pre-generated offline and bundled as static JSON; there is **no**
  live in-browser scraping. See `ARCHITECTURE.md` §6 and §10 for the format,
  the bundled three-year window + index, and the regeneration runbook.
- Use `requests` (not `urllib`) for studiegids transport in the Python scripts;
  the endpoint rejected the `urllib` client during validation.
- Do not combine academic years in one seed file — generate and replace one
  academic-year seed at a time.
- The active academic year has no UI control; it is driven by
  `public/data/programmes.seed.index.json` (`ACTIVE_SEED_YEAR` is only a
  fallback) and bumped by a maintainer commit.
- `public/cssrule.css`, `public/jsrule.js`, and `public/extendedcss.js` are
  intentional inert placeholders to silence root-file 404 noise — leave them.

## Examples

Old examples of the manual workflow this project replaces live in `/examples`.
