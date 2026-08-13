# ADR-001 — Local-first, no backend

Status: Accepted  
Date: 2026-08-12

## Context

MVP stores small Project/conversation navigation metadata. A server would require accounts, privacy policy expansion, security controls, operating cost and data transmission.

## Decision

Use extension local storage only. No production backend, analytics or remote configuration.

## Consequences

Positive: simpler, private, offline-capable, low cost.  
Negative: no cross-device sync in MVP.

## Revisit

Only if users explicitly need sync/team sharing and the privacy/product trade-off is approved.
