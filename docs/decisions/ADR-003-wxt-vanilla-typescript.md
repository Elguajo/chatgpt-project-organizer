# ADR-003 — WXT + vanilla TypeScript

Status: Accepted  
Date: 2026-08-12

## Context

The runtime surface is a content script with small injected controls. A component framework is unnecessary. Hand-rolling packaging/dev tooling adds friction.

## Decision

Use WXT + TypeScript, without React/Vue/Svelte in MVP.

## Consequences

Positive: smaller conceptual/runtime surface; convenient MV3 build/dev/zip.  
Negative: WXT is pre-1.0 and requires deliberate upgrade review.

## Revisit

If UI complexity grows substantially or WXT maintenance/compatibility becomes a concern.
