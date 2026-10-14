# Phase 05 — Automated and authenticated-browser QA

## Goal

Verify the MVP against the current live ChatGPT UI, not only fixtures.

## In scope

Approved change request 2026-10-14: implement and verify reliable reconciliation,
actionable diagnostics, contextual native-row controls, colored named
tags and independent chat title colors. These three cohesive workstreams are
part of the current phase; authenticated acceptance remains mandatory.

- full automated suite;
- current Chrome stable;
- at least two test Projects;
- reload/browser restart;
- long list where practical;
- English/Russian UI if available;
- light/dark;
- disable/re-enable;
- title rename;
- branch/shared variant where available;
- regression fixture updates from discovered differences.

## Out of scope

- store marketing assets;
- unrelated folders/search/sync features.

## Tasks

1. Run all automated checks.
2. Load production build unpacked.
3. Execute `docs/product/TEST_MATRIX.md`.
4. Fix adapter regressions and add sanitized fixtures.
5. Record concise QA evidence.

## Acceptance criteria

- [x] real-observer regression reaches idle and catches native list replacement.
- [x] contextual tags/title color editor; no redundant Manage Chats list.
- [x] compact native-style pinned rows and visible extension version.
- [x] reversible duplicate suppression and Chats heading (0.1.2 live + tests).
- [x] empty Pinned section retained (synthetic browser test).
- [x] diagnostics explain missing context/layout and storage errors without data.
- [x] v1 migration preserves pins; unknown schemas are not overwritten.
- [x] multiple tags and independent title color persist for unpinned/pinned chats.
- [ ] editing/reset work with keyboard, themes, reload and project isolation.
- [ ] teardown restores original native title presentation.

- [x] all automated checks pass.
- [x] primary Pin -> reload -> open -> unpin flow passes (0.1.1 live).
- [x] Project isolation passes (0.1.1 live).
- [ ] browser restart persistence passes.
- [ ] title rename behavior passes.
- [ ] repeated ChatGPT re-render/navigation does not duplicate UI.
- [ ] disabling extension restores untouched native experience.
- [ ] no network requests from extension.
- [x] no permission drift.
- [x] no private QA data committed.
- [x] current live DOM assumptions match sanitized fixture coverage.

## External blocker rule

If a logged-in ChatGPT test environment is unavailable, this phase remains IN PROGRESS. Do not substitute fixture tests for live release QA.

## Verification

All commands plus manual checklist evidence.

Latest detailed evidence: `docs/research/QA_2026-10-14.md`.
Approved 0.1.2 behavior: hide recognized pinned duplicates reversibly, retain an
empty Pinned section and label the native list Chats. Automated checks cover
unpin, recognition failure and teardown restoring the same native nodes.
