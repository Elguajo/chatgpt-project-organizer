# Phase 04 — SPA resilience, accessibility and privacy hardening

## Goal

Keep the extension stable across ChatGPT SPA navigation/re-renders and verify privacy/least-privilege guarantees.

## In scope

- MutationObserver lifecycle;
- reconcile scheduler/coalescing;
- Project switching;
- route/event handling;
- observer cleanup;
- failure diagnostics;
- light/dark behavior;
- accessibility review;
- production network/permission checks;
- performance budget.

## Out of scope

- new product features.

## Tasks

1. Implement observer/reconcile lifecycle.
2. Test repeated navigation and DOM replacement.
3. Verify failure behavior.
4. Audit network/permissions/accessibility.

## Acceptance criteria

- [ ] Project A -> B -> A renders correct pins each time.
- [ ] 50 repeated simulated navigations do not accumulate duplicate observers/listeners.
- [ ] unknown DOM removes/avoids extension UI without harming native UI.
- [ ] observer work is coalesced.
- [ ] no per-row timers.
- [ ] light/dark UI remains readable.
- [ ] focus indicators visible.
- [ ] production source/runtime makes no extension-originated network requests.
- [ ] manifest permissions match architecture.
- [ ] no private content is logged in production.
- [ ] reconcile performance meets soft target or any exception is documented.

## Verification

Tests, build, manifest inspection, DevTools performance/network inspection, accessibility keyboard pass.
