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

As of 2026-08-13, automated Phase 05 checks and generated-manifest inspection
pass. Edge is connected. A production-package test showed ChatGPT intercepting
the document-delegated Pin click even though the controls render; a direct
extension-control fallback is now built and covered by a regression test. Reload
the production package and retest before the phase can progress.

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

Folders, manual drag ordering, tags/colors, search and optional sync are tracked only as future ideas. They are not silently pulled into these phases.
