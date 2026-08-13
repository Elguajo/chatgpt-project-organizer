# Token Efficiency Protocol

This file defines the Default Read Set.

## Default Read Set

For normal implementation/review/bug-fix/change work, read:

1. `.specify/memory/constitution.md`
2. `docs/project/PROJECT_BRIEF.md`
3. `docs/project/ARCHITECTURE.md`
4. `docs/project/ROADMAP.md`
5. `docs/system/ENGINEERING_RULES.md`
6. the phase marked `[>]` in the roadmap
7. only directly relevant ADRs, source files, tests, and current official docs

Do not automatically load:

- completed phases;
- all ADRs;
- every prompt;
- every integration guide;
- full research history;
- prior chat transcripts.

`ROADMAP.md` is the source of truth for the current phase. `NEXT_SESSION.md` is a disposable handoff pointer.

## Context expansion

Load additional context only when:

- canonical docs conflict;
- a change crosses phase boundaries;
- debugging spans multiple subsystems;
- a technology/API detail is time-sensitive;
- a consequential architectural decision is being made.
