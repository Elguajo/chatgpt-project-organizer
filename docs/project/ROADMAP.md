# Roadmap

## Phase status markers

```text
[ ] PLANNED
[>] IN PROGRESS
[x] COMPLETE
```

Exactly one phase is `[>]` until all phases are complete.

## Phases

- [x] Phase 00 - Foundation and live DOM discovery - COMPLETE - `docs/phases/00-foundation-dom-discovery.md`
- [x] Phase 01 - Project and conversation adapter - COMPLETE - `docs/phases/01-project-conversation-adapter.md`
- [x] Phase 02 - Pin persistence and controller - COMPLETE - `docs/phases/02-pin-persistence-controller.md`
- [x] Phase 03 - Pinned UI and native-row controls - COMPLETE - `docs/phases/03-pinned-ui-controls.md`
- [x] Phase 04 - SPA resilience, accessibility and privacy hardening - COMPLETE - `docs/phases/04-resilience-accessibility-privacy.md`
- [>] Phase 05 - Automated and authenticated-browser QA - IN PROGRESS - `docs/phases/05-test-release-qa.md`
- [ ] Phase 06 - Chrome Web Store release package - PLANNED - `docs/phases/06-store-release.md`

## Current phase handoff

As of 2026-10-14, implementation and partial authenticated QA are verified;
Phase 05 remains IN PROGRESS pending the remaining release checklist. Current
build is 0.1.2: current DOM support, stable reconciliation, contextual tags/title
colors, compact Pinned rows, reversible native duplicate suppression, Chats
heading and persistent empty Pinned section. Manage Chats was removed by user
request. Version 0.1.1 live flows passed in two Projects and two tabs; 0.1.2 live
inspection confirmed duplicate hiding and the Chats heading. Empty Pinned is
verified in the synthetic browser test. Automated
checks pass (48 unit/integration tests plus 1 synthetic browser test, TypeScript,
build/audit). See `docs/research/QA_2026-10-14.md` for precise evidence and gaps.

## MVP completion definition

The project is MVP complete when:

- all seven phases are `[x]`;
- the primary Pin -> reload -> open -> unpin flow works in at least two Projects;
- project isolation is verified;
- zero production network calls are verified;
- permissions are verified against the expected minimal manifest;
- ChatGPT remains usable under adapter failure;
- store package and privacy disclosure are ready.

## Post-MVP

Colored tags and colored chat titles were explicitly requested on 2026-10-14.
The change request is recorded in `docs/research/EXTENSION_COMPARISON_2026-10-14.md`;
implementation is included in current Phase 05 under the approved change request.
Folders, manual drag ordering, search and sync remain future ideas.
