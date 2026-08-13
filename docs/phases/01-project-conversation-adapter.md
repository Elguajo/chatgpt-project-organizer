# Phase 01 — Project and conversation adapter

## Goal

Reliably resolve active Project context, visible conversation rows and safe mount points from current sanitized fixtures/live UI.

## Context

All ChatGPT DOM logic must remain inside the adapter.

## In scope

- adapter contracts;
- selector profile;
- project context resolution;
- conversation row resolution;
- title/href extraction;
- safe mount discovery;
- localized/alternate fixture variants;
- fail-closed diagnostics.

## Out of scope

- storage mutation;
- Pinned renderer;
- final MutationObserver lifecycle.

## Tasks

1. Implement project resolution.
2. Implement conversation-row discovery.
3. Implement semantic mount discovery.
4. Add fixture tests for positive and negative layouts.

## Acceptance criteria

- [x] adapter returns stable `projectKey` for verified Project fixture.
- [x] project title alone is never identity.
- [x] conversation title alone is never identity.
- [x] each valid row returns key/href/title/action mount.
- [x] ambiguous row is skipped rather than guessed.
- [x] unknown DOM returns no context and causes no native mutation.
- [x] selectors exist only under adapter module.
- [x] English/Russian fixture behavior does not depend on visible label text for identity.

## Security / negative tests

- [x] no message-body selector exists.
- [x] no account/profile selector is required.
- [x] untrusted title is treated as text metadata.

## Verification

Compile, unit/fixture tests, build, manual live inspection.
