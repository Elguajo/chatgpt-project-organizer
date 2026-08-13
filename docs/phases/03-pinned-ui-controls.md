# Phase 03 — Pinned UI and native-row controls

## Goal

Deliver the complete visible Pin -> Pinned section -> Open -> Unpin flow.

## Context

UI must be extension-owned, idempotent and accessible.

## In scope

- synthetic Pinned section;
- local pin icon;
- Pin/Unpin native-row controls;
- event delegation;
- English/Russian microcopy;
- immediate UI update after state change;
- title refresh when matching row is observed.

## Out of scope

- manual drag ordering;
- folders/tags;
- elaborate onboarding.

## Tasks

1. Render Pinned section.
2. Decorate recognized rows.
3. Wire accessible interactions.
4. Add DOM integration tests.

## Acceptance criteria

- [ ] zero pins => no Pinned section.
- [ ] pin => synthetic link appears without page reload.
- [ ] link opens stored conversation href.
- [ ] unpin removes synthetic row.
- [ ] repeated reconcile never duplicates section/button.
- [ ] native conversation row remains in native position.
- [ ] teardown removes only extension-owned nodes.
- [ ] keyboard users can pin/unpin.
- [ ] `aria-pressed` is correct.
- [ ] markup-like title text is never interpreted as HTML.

## Verification

Compile, tests, build, manual UI QA.
