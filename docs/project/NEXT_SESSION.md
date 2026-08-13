# Next Session

Status: IN PROGRESS

Current phase: Phase 05 - Automated and authenticated-browser QA

Completed phase in last handoff: Phase 04 - SPA resilience, accessibility and privacy hardening

## Objective

Verify the production build against the current live ChatGPT UI and capture
concise release-QA evidence without committing private chat data.

## Verified evidence (2026-08-13)

- `npm run check` passed after running compile, 38 Vitest tests, the production
  Chrome MV3 build, and `python3 tools/audit.py`.
- Generated `.output/chrome-mv3/manifest.json` contains only the `storage`
  permission and the `https://chatgpt.com/*` content-script match; no host,
  network, or privileged permission drift was found.
- Source and production-bundle inspection found no production `fetch`, XHR,
  WebSocket, EventSource, or remote-script usage.

## External blocker

Edge is connected for live inspection. It currently has the WXT development
package loaded from `.output/chrome-mv3-dev`, not the production package from
`.output/chrome-mv3`; after switching to production, the controls rendered but
their click did not reach the document-delegated handler. A direct fallback on
extension-owned controls has been added and verified by regression test. Reload
the production extension and refresh the same non-sensitive Project before
retesting. Then continue authenticated QA: two-Project pin flows, restart
persistence, title refresh, SPA/BFCache, theme and hover layout checks,
disable/re-enable teardown, and DevTools Network inspection. No private
ChatGPT data was read or recorded.

## Read first

Follow `AGENTS.md` and the Default Read Set. The current phase is:

`docs/phases/05-test-release-qa.md`

## Important constraint

Do not implement folders, tags, search, backend, sync, telemetry, private OpenAI API calls, or extra permissions. Keep native ChatGPT rows in place and render only extension-owned UI. Do not collect or commit real conversation content, screenshots, account data, or DOM dumps.

## NEXT SESSION PROMPT

Read `AGENTS.md` and follow the Default Read Set from `docs/system/TOKEN_EFFICIENCY.md`.

Continue the current roadmap phase: `docs/phases/05-test-release-qa.md`.

Tasks:
1. read Phase 05 and `docs/product/TEST_MATRIX.md`;
2. in Edge, reload the ProjectPins extension loaded from the exact `.output/chrome-mv3` directory, refresh the test Project, and retry Pin; the new build includes a direct handler fallback for ChatGPT-intercepted row clicks;
3. use two test Projects to verify Pin -> reload -> open -> unpin, Project isolation, browser restart persistence, title refresh, repeated SPA navigation, light/dark, and disable/re-enable;
4. inspect DevTools network and generated manifest for extension-originated requests and permission drift;
5. if live DOM differs, update only the adapter and add a sanitized fixture;
6. record concise QA evidence without real titles, prompts, account data, or screenshots containing private chats.

At handoff, update ROADMAP and NEXT_SESSION. Preserve native row position, project isolation, safe adapter failure behavior, and the no-message-body privacy rule. If authenticated live QA cannot be completed, leave Phase 05 in progress and state the external blocker.
