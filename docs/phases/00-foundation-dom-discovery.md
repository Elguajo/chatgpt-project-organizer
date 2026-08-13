# Phase 00 — Foundation and live DOM discovery

## Goal

Produce a buildable inert extension foundation and verified, sanitized structural knowledge of the current ChatGPT Project UI.

## Context

Architecture is selected, but exact ChatGPT DOM/route details are intentionally not invented from memory. They must be observed in the live product.

## In scope

- install WXT/TypeScript dependencies;
- `wxt prepare`, compile and production build;
- verify generated manifest permissions/matches;
- live inspection of active Project + conversation list;
- redact and record route shapes;
- create sanitized fixtures;
- implement pure URL/key parsing only after observation.

## Out of scope

- functional pin persistence;
- injected Pinned section;
- row Pin controls;
- folders/tags/search.

## Tasks

1. Make scaffold install/build cleanly.
2. Inspect current official WXT/Chrome docs if package/API behavior differs from planning notes.
3. Inspect a non-sensitive logged-in ChatGPT Project.
4. Fill `docs/research/LIVE_DOM_FINDINGS.md`.
5. Add sanitized DOM fixtures.
6. Implement and test project/conversation identity parsers if verified.

## Acceptance criteria

- [x] `npm install` succeeds.
- [x] `npm run compile` succeeds.
- [x] `npm test` succeeds.
- [x] `npm run build` succeeds.
- [x] generated production manifest is MV3.
- [x] generated production manifest has only required storage capability and `chatgpt.com` content-script scope.
- [x] live Project route shape is recorded with identifiers redacted.
- [x] live conversation href shape is recorded with identifiers redacted.
- [x] safe Project list mount point is identified.
- [x] safe conversation row/action mount strategy is identified.
- [x] at least one sanitized Project-list fixture exists.
- [x] fixture contains no real message/account/file data.
- [x] pure identity parser tests cover observed patterns and invalid patterns.

## Security / negative tests

- [x] adapter/parser rejects unrelated URLs.
- [x] ambiguous project identity returns null/failure.
- [x] sanitized fixture review confirms no private content.

## Verification

```bash
npm run compile
npm test
npm run build
python tools/audit.py
```

Manual: inspect generated manifest and load unpacked extension on current ChatGPT.
