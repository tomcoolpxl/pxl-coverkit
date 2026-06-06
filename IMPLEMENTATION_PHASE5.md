# Phase 5 — Validation, accessibility, polish, deploy hardening

**Goal.** Reach MVP acceptance criteria from `REQUIREMENTS.md` §"Acceptance criteria for MVP".

**In scope:**

- Validation pass: every case from `REQUIREMENTS.md` §"Validation and error handling" produces a specific Dutch error message.
- Accessibility pass: keyboard walkthrough of overview, wizard, edit, actualize, delete, settings; focus order, visible focus rings, aria-describedby on errors, screen-reader announcements on step changes.
- Reference comparison: side-by-side compare generated PDFs against `examples/*.pdf` and address acceptable-drift outliers; document any deliberate deviation in `DESIGN.md`.
- Error boundaries: PDF generation failures, seed load failures, storage write failures, import schema mismatch — all surface user-meaningful messages.
- Pages workflow hardening: caching `~/.npm`, build matrix limited to Node 22 LTS, deploy job remains checkout-free.
- README written for end-user lecturers + maintainers (run, import/export, where seed files live, yearly refresh pointer).
- Final Vitest coverage check for the test areas listed in `REQUIREMENTS.md` §Testing.

**Out of scope:**

- Visual regression automation (post-MVP).
- Safari testing (post-MVP).

**Verification gate:**

- All MVP acceptance criteria from `REQUIREMENTS.md` pass during a single end-to-end walkthrough.
- `npm start` + `npm test` green.
- Pages deploy succeeds on `main` and the live URL passes the same walkthrough.
