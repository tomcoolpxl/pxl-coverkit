# TODO — Phase 2 (card overview and create wizard)

Live work tracking for the current phase. Items move to `DONE.md` only after the verification gate passes for them.

## Outstanding (not yet verifiable in-tree)

- [ ] Manual walkthrough in a real browser:
  - Create a seeded card via the wizard (programme → seed pick → review → save), confirm the card lands on the overview.
  - Create a manual card via the wizard (programme → "Handmatige invoer" → review → save).
  - Reload the page and confirm both cards persist (localStorage).
  - Filter by programme and free-text search on the overview; confirm both narrow the grid.
  - Confirm the overview chip and wizard review header both display the academic year from the loaded seed (not a hardcoded value in markup).
  - Trigger the dirty-wizard guard by starting the wizard, picking a programme, and navigating to the overview before saving.
  - Click the stepper items in the wizard header to navigate backwards/forwards; confirm step 3 is only clickable once a programme **and** a source are chosen.

In-tree verification on 2026-06-02 (post second-round rework):
- `npm test` — 69 tests across 10 files passing.
- `npm run typecheck` — clean.
- `npm run build` — clean, ~2.3 s.
- `npm start` — dev server boots; root and seed JSON return HTTP 200.
