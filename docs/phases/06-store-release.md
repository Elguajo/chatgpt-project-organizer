# Phase 06 — Chrome Web Store release package

## Goal

Produce a review-ready MVP package and truthful store/privacy materials.

## In scope

- versioning;
- production ZIP;
- icon assets;
- concise listing copy;
- privacy disclosure;
- permission explanation;
- independent/not-affiliated disclosure;
- final audit.

## Out of scope

- paid plans;
- telemetry;
- sync/backend;
- Firefox/Safari publication unless separately requested.

## Tasks

1. Set release version.
2. Build/zip with WXT.
3. Verify ZIP contents and manifest.
4. Prepare store text/privacy disclosures.
5. Run final repository and product audit.

## Acceptance criteria

- [ ] production ZIP builds.
- [ ] manifest MV3 and permissions are minimal.
- [ ] no source maps/private test fixtures accidentally included unless intentionally safe.
- [ ] no secret/env file included.
- [ ] privacy text matches actual code.
- [ ] listing states independent/not affiliated with OpenAI.
- [ ] screenshots contain no private chats.
- [ ] `python tools/audit.py` passes.
- [ ] Phase 05 live QA evidence exists.
- [ ] all roadmap phases can be marked complete.

## Verification

Build/zip inspection plus final manual Chrome Web Store submission review.
