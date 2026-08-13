# Next Session

Status: IN PROGRESS

Current phase: Phase 03 - Pinned UI and native-row controls

Completed phase in last handoff: Phase 02 - Pin persistence and controller

## Objective

Implement the extension-owned pinned UI and accessible native-row controls over
the tested Phase 02 controller, without moving native ChatGPT nodes.

## Read first

Follow `AGENTS.md` and the Default Read Set. The current phase is:

`docs/phases/03-pinned-ui-controls.md`

## Important constraint

Do not implement folders, tags, search, backend, sync, telemetry, private OpenAI API calls, or extra permissions. Keep native ChatGPT rows in place and render only extension-owned UI.

## NEXT SESSION PROMPT

Read `AGENTS.md` and follow the Default Read Set from `docs/system/TOKEN_EFFICIENCY.md`.

Continue the current roadmap phase: `docs/phases/03-pinned-ui-controls.md`.

Tasks:
1. read the Phase 03 requirements plus the adapter, controller, and storage contracts before implementing;
2. render one extension-owned synthetic Pinned section at the adapter-approved mount point, using `textContent` for all title metadata;
3. idempotently add accessible Pin/Unpin controls to recognized native rows via event delegation, then update the section immediately after controller operations;
4. add sanitized DOM integration tests for idempotency, teardown, keyboard behavior, and untrusted titles;
5. run compile, unit tests, build, and `python3 tools/audit.py`.

At handoff, update ROADMAP and NEXT_SESSION. Preserve native row position, project isolation, and safe adapter failure behavior.
