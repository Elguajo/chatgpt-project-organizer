# Phase 05 — Automated and authenticated-browser QA

## Goal

Verify the MVP against the current live ChatGPT UI, not only fixtures.

## In scope

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
- post-MVP features.

## Tasks

1. Run all automated checks.
2. Load production build unpacked.
3. Execute `docs/product/TEST_MATRIX.md`.
4. Fix adapter regressions and add sanitized fixtures.
5. Record concise QA evidence.

## Acceptance criteria

- [ ] all automated checks pass.
- [ ] primary Pin -> reload -> open -> unpin flow passes.
- [ ] Project isolation passes.
- [ ] browser restart persistence passes.
- [ ] title rename behavior passes.
- [ ] repeated ChatGPT re-render/navigation does not duplicate UI.
- [ ] disabling extension restores untouched native experience.
- [ ] no network requests from extension.
- [ ] no permission drift.
- [ ] no private QA data committed.
- [ ] current live DOM assumptions match sanitized fixture coverage.

## External blocker rule

If a logged-in ChatGPT test environment is unavailable, this phase remains IN PROGRESS. Do not substitute fixture tests for live release QA.

## Verification

All commands plus manual checklist evidence.
