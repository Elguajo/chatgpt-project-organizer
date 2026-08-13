# AGENTS.md — ProjectPins

This repository uses a Token-Efficient Spec Kit style workflow.

## Canonical project state

Project truth lives in:

- `docs/project/PROJECT_BRIEF.md`
- `docs/project/ARCHITECTURE.md`
- `docs/project/ROADMAP.md`
- the current file in `docs/phases/`
- ADRs only for consequential, hard-to-reverse decisions

Do not replace those with chat memory.

## Default context

Read `docs/system/TOKEN_EFFICIENCY.md` and follow its Default Read Set. Do not load every phase, prompt, ADR, or research note automatically.

The current phase is determined only by the `[>]` marker in `docs/project/ROADMAP.md`.

## Product constraints that must not drift

MVP is a **browser extension that pins chats inside individual ChatGPT Projects**.

Non-negotiable MVP constraints:

- local-first;
- no backend;
- no telemetry;
- no reading message bodies;
- no OpenAI internal/private API dependency;
- no network interception;
- no `<all_urls>`;
- Manifest V3;
- host limited to `https://chatgpt.com/*`;
- pin state scoped to a Project;
- extension-owned synthetic Pinned section instead of moving native React nodes;
- native ChatGPT behavior remains functional if extension fails.

Future folders/tags/search/sync must not enter MVP unless requested through a change request.

## Decision autonomy

Make ordinary engineering decisions without asking the user. Ask only for a true blocker, irreversible product/business choice, material privacy/security trade-off, or action requiring the user's authenticated browser/account.

For fast-changing browser/WXT/ChatGPT behavior, verify current primary documentation or the live product before relying on assumptions.

## DOM engineering rule

ChatGPT is not an extension API. Treat its DOM as an unstable external interface.

All ChatGPT DOM knowledge must be isolated behind the adapter described in `docs/product/DOM_ADAPTER.md`.

Never scatter selectors through UI/storage/business logic.

When the adapter cannot confidently recognize the current view, fail closed: do not hide, move, delete, or rewrite native ChatGPT UI.

## Privacy rule

Do not capture real message content into fixtures, logs, snapshots, issues, or committed test data.

DOM fixtures must be sanitized and contain only the minimum structure required to test adapters.

## Implementation discipline

Normally work on 1–3 cohesive tasks from the current phase. A phase becomes complete only when all acceptance criteria are verified.

Prefer:

1. pure parsing/model code;
2. unit tests;
3. DOM adapter fixture tests;
4. integration tests;
5. manual authenticated-browser QA.

Do not claim completion from build success alone.

## Completion / handoff

At the end of every meaningful implementation or review session:

1. determine `IN PROGRESS`, `PHASE COMPLETE`, or `PROJECT COMPLETE`;
2. update `docs/project/ROADMAP.md`;
3. update `docs/project/NEXT_SESSION.md`;
4. include a ready-to-copy next-session prompt.

If a criterion cannot be tested because authenticated ChatGPT access is unavailable, name that specific external blocker and leave the phase in progress.
