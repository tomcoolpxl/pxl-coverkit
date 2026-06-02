# Implementation Phase 2 — Card overview and create wizard

This file is the **frozen blueprint** for Phase 2. It was copied from `IMPLEMENTATION_PLAN.md` at the start of the phase and must not change once work begins. Refer to `TODO.md` for live work tracking and `DONE.md` for verified deliverables.

Frozen on: 2026-06-02

---

**Goal.** Make the overview real and let users create cards from seed entries or manually.

**In scope:**

- Overview grid (responsive 1/2/3 columns) reading from `cards` store; card tile per `DESIGN.md` §3.3.
- Filter bar: programme select, academic year select, free-text search across course code/name.
- "New cover" CTA opens the wizard (`/cards/new`).
- Wizard steps per `DESIGN.md` §3.4:
  1. Programme picker (auto-advance if only one).
  2. Seeded OLOD picker with search + `selectionContext` breadcrumbs, or "Manual entry".
  3. Review-and-save form prefilled from seed + settings defaults; inline validation via `vee-validate` + zod; Save disabled until required fields pass.
- Saving creates a card; overview reflects it; reload preserves it.
- "Dirty wizard" navigation guard.
- Tests: overrides merge precedence, wizard store transitions, filter selectors.

**Out of scope:**

- Full edit view, actualize, delete (Phase 3).
- PDF download button is rendered but disabled with a tooltip "Beschikbaar vanaf Phase 4".

**Verification gate:**

- `npm start` + Vitest green.
- Manual walkthrough: create a seeded card and a manual card; reload; both persist; filter by programme and by year both work.
