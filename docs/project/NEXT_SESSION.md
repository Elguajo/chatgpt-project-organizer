# Next Session

Status: IN PROGRESS
Current phase: Phase 05 — Automated and authenticated-browser QA.
Current build: 0.1.2 in .output/chrome-mv3.

## Implemented and verified — 2026-10-14

Current ChatGPT DOM support and stable rendering are fixed. Implemented named
colored tags, separate title color, v1 migration preserving pins, contextual
editor, native-style Pinned rows, local version/status, serialized writes and
cross-tab refresh. User asked to remove Manage Chats, hide native duplicates
reversibly, add Chats heading and retain Pinned with an empty list. These are
implemented in 0.1.2. Increment version for each updated user-delivered build.

48 Vitest tests, 1 synthetic Edge browser test, TypeScript/build and audit pass.
0.1.1 authenticated checks passed: pin/reload/open/unpin, appearance persistence,
multiple tags, two-Project isolation and two-tab refresh. Current-session test
changes were restored to baseline. Precise evidence and remaining checks:
docs/research/QA_2026-10-14.md. No real chat content or DOM dumps recorded.

## Remaining acceptance

0.1.2 is installed and live duplicate hiding, Chats and no Manage Chats are
confirmed. Empty Pinned is browser-test verified; live empty state remains open.
Browser restart, actual disable/re-enable, live rename/theme changes,
repeated SPA navigation and DevTools extension-request inspection still need
release evidence. Do not declare Phase 05 complete based only on fixtures.
The browser tool cannot open edge://extensions: automatic security policy blocks
non-http(s) URLs. User must reload/update the existing unpacked extension there;
do not bypass this using another tool or shell automation.

## Ready-to-copy next-session prompt

Read AGENTS.md and follow the Default Read Set from docs/system/TOKEN_EFFICIENCY.md.
Continue Phase 05 selected by ROADMAP. Read docs/research/QA_2026-10-14.md.

Verify the current 0.1.2 production build on the authorized test Projects, without
reading messages or capturing private screenshots. Confirm reversible duplicate
hiding, visible Chats, empty Pinned, tags and separate title colors. Complete
remaining release QA: restart, disable/re-enable, live title rename, themes, SPA
and Network. Make ordinary engineering decisions autonomously, add sanitized
regressions for actual failures, and increment the extension version for any
updated delivered build. Match ChatGPT styling; do not reintroduce Manage Chats.

Keep local-first MV3, chatgpt.com-only host, project isolation, no backend,
telemetry, message-body reads, internal APIs or network interception. Native
nodes stay in place; only recognized pinned duplicates receive reversible CSS.
Update ROADMAP/NEXT_SESSION with evidence, blockers and a ready next prompt.
