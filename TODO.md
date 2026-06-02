# TODO — Phase 2 (card overview and create wizard)

Live work tracking for the current phase. Items move to `DONE.md` only after the verification gate passes for them.

## Outstanding (not yet verifiable in-tree)

- [ ] Manual walkthrough in a real browser:
  - Create a seeded card via the wizard (programme → seed pick → review → save).
  - Create a manual card via the wizard (programme → "Handmatige invoer" → review → save).
  - Reload the page and confirm both cards persist.
  - Filter by programme and by academic year on the overview; confirm both narrow the grid.
  - Trigger the dirty-wizard guard by starting the wizard, picking a programme, and navigating to the overview before saving.

In-tree verification on 2026-06-02:
- `npm test` — 69 tests across 10 files passing.
- `npm run typecheck` — clean.
- `npm run build` — 356 modules, 2.45 s, no warnings.
- `npm start` — dev server boots in ~225 ms; root and seed JSON return HTTP 200.
