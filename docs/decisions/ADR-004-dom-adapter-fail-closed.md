# ADR-004 — Isolated DOM adapter and fail-closed behavior

Status: Accepted  
Date: 2026-08-12

## Context

ChatGPT does not promise a stable DOM contract for third-party extensions.

## Decision

All selectors/routes are isolated behind one adapter. The extension renders nothing when Project/row identity is ambiguous. It never guesses by moving/hiding native nodes.

## Consequences

Positive: UI changes cause localized failures instead of destructive behavior.  
Negative: a ChatGPT redesign can temporarily disable ProjectPins until adapter selectors are updated.

## Revisit

If OpenAI provides a supported integration surface.
