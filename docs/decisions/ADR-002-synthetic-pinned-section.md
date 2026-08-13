# ADR-002 — Synthetic Pinned section

Status: Accepted  
Date: 2026-08-12

## Context

Moving native ChatGPT conversation DOM nodes risks conflict with React rendering and makes the extension fragile.

## Decision

Render an extension-owned Pinned section containing navigation links. Keep native chat rows in place.

## Consequences

Positive: idempotent, reversible, resilient to re-render and lazy lists.  
Negative: a pinned chat can appear both in Pinned and its native position.

## Revisit

Only if a reliable supported API or robust integration makes native ordering safe.
