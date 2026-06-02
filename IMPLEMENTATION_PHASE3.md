# Implementation Phase 3 — Edit, actualize, delete

This file is the **frozen blueprint** for Phase 3. It was copied from `IMPLEMENTATION_PLAN.md` at the start of the phase and must not change once work begins. Refer to `TODO.md` for live work tracking and `DONE.md` for verified deliverables.

Frozen on: 2026-06-02

---

**Goal.** Complete the card lifecycle.

**In scope:**

- Card detail route (`/cards/:id`) showing summary + action row.
- Full update view (`/cards/:id/edit`) with form sections per `DESIGN.md` §3.6; live summary panel; saving updates the card and bumps `updatedAt`.
- Actualize dialog from a card per `DESIGN.md` §3.5: next academic year prefilled, new exam date required, optional start time + duration. Overwrites current state.
- Delete confirmation per `DESIGN.md` §3.7 (type course code OR delayed-enable button); undo snackbar restores within 5 s.
- Reusable lecturer autocomplete sourced from the `lecturers` store, seeded by observed values across cards.
- Tests: actualize logic, override merge after edit, delete + undo.

**Out of scope:** PDF rendering.

**Verification gate:**

- `npm start` + Vitest green.
- Manual walkthrough: edit a card, actualize a card to next year, delete a card and undo, delete a card and confirm gone after reload.
