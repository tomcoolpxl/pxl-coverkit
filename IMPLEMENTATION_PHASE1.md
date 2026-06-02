# Implementation Phase 1 — Skeleton, data layer, and Pages deploy

This file is the **frozen blueprint** for Phase 1. It was copied from `IMPLEMENTATION_PLAN.md` at the start of the phase and must not change once work begins. Refer to `TODO.md` for live work tracking and `DONE.md` for verified deliverables.

Frozen on: 2026-06-02
Branch: `phase-1-skeleton`

---

**Goal.** Stand up an empty but real app: themed shell, persisted state plumbing, seed loaded, import/export working, deployed to GitHub Pages. No card editing yet.

**In scope:**

- `npm create vite@latest` (vue-ts) + Vuetify 3 wired via `vite-plugin-vuetify` with autoImport.
- TypeScript strict mode, ESLint + Prettier, `npm start` aliased to `vite`.
- Vuetify PXL theme tokens from `DESIGN.md` §3.1.
- `vue-router` hash mode with the route table from `DESIGN.md` §3.2; placeholder views for `/`, `/cards/new`, `/cards/:id`, `/cards/:id/edit`, `/settings`, `/about`.
- Pinia stores: `settings`, `programmes`, `cards`, `wizard`. `pinia-plugin-persistedstate` configured with a single storage object that wraps `localStorage` under key `pxl-coverkit:v1`.
- Domain layer skeleton in `src/domain/`: `types.ts`, `schema.ts` (zod), `academicYear.ts`, `examTime.ts`, `filename.ts`, `overrides.ts` — implementation + unit tests.
- Seed loader: fetches `public/data/programmes.seed.<activeYear>.json` at boot, validates with zod, exposes `programmes` and `seedEntries`. Bundled seed JSON files copied into `public/data/` from `seed-data/`.
- Settings page: import / export JSON, active academic year switcher, app version + font credit.
- Empty overview page with empty-state copy pointing to "New cover" and "Import".
- Top app bar, persistent footer with version + about link.
- Vitest set up; tests for `domain/*` and seed validation.
- GitHub Actions workflow `pages.yml`: `build` job (checkout, install, `npm run build`, upload artifact) and `deploy` job (no checkout, `actions/deploy-pages@v4`). `VITE_BASE_PATH` set from repo name.
- Deployed empty shell reachable at the project Pages URL.

**Out of scope (defer to later phases):**

- Card creation, editing, actualize, delete (Phases 2–3).
- PDF generation and Carlito font wiring (Phase 4).
- Visual regression against reference PDFs (Phase 5).

**Verification gate:**

- `npm start` shows the themed shell with empty overview, settings page with working import/export of an empty state, programme/year filter selects populated from the loaded seed.
- `npm test` green: domain helpers and zod schemas covered.
- Pages deploy succeeds; the published URL loads the same empty shell.
- Manual walkthrough: import a hand-crafted JSON with one fake card → settings shows the card count; export → file downloads with `schemaVersion` field.
