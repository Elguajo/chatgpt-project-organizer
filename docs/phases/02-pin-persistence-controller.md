# Phase 02 — Pin persistence and controller

## Goal

Create correct project-scoped local pin state independent from the DOM.

## Context

State must survive reload/restart and never leak by project title.

## In scope

- storage repository;
- schema v1;
- pin/unpin;
- idempotency;
- ordering;
- cached title refresh;
- migrations contract;
- storage corruption/unknown-version behavior.

## Out of scope

- UI rendering;
- drag reorder;
- cloud sync.

## Tasks

1. Implement typed storage repository.
2. Implement controller operations.
3. Add pure unit tests and migration guardrails.

## Acceptance criteria

- [x] pin creates one record for `(projectKey, conversationKey)`.
- [x] repeat pin does not duplicate.
- [x] unpin is idempotent.
- [x] Project A query never returns Project B pins.
- [x] title refresh updates only matching identity.
- [x] newest-pin-first ordering is deterministic.
- [x] unknown future schema is not overwritten.
- [x] storage failures are surfaced to controller without corrupting in-memory state.

## Security / negative tests

- [x] stored schema contains no message body/account/token fields.
- [x] no network code is introduced.

## Verification

Compile, unit tests, build, audit.
