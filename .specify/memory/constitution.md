# Engineering Constitution

Version: 1.0-projectpins

## Outcome first
Deliver the requested user outcome without silently expanding scope.

## Ask only blockers
Routine technical choices are owned by the coding agent. Ask the user only when a missing answer creates materially different products, privacy/security risk, cost, irreversible behavior, or requires access to the user's authenticated environment.

## Simplicity
Use the smallest architecture that safely solves the current release. No backend, database server, account system, analytics pipeline, or framework-heavy UI for the MVP.

## Unstable external UI
ChatGPT DOM is an unstable integration surface. Isolate it behind an adapter, maintain sanitized fixtures, and fail closed when confidence is insufficient.

## Privacy by architecture
Read only navigation metadata required for pinning. Never inspect or persist conversation bodies, composer text, files, cookies, credentials, or tokens.

## Least privilege
The production extension must be limited to `https://chatgpt.com/*` and the extension storage capability. Every additional permission requires a documented ADR and explicit need.

## Data integrity
Project-scoped pin state has one schema version and a single persistence abstraction. Migrations must be explicit and tested.

## Reversibility
Prefer additive UI and extension-owned elements. Do not mutate ChatGPT state or rely on private APIs.

## Accessibility
Injected controls must be keyboard reachable, have accessible labels/states, and not break native navigation.

## Evidence before completion
Relevant compile/tests/build and manual authenticated-browser QA must pass. An unverifiable acceptance criterion stays incomplete.

## Token efficiency
Use the Default Read Set in `docs/system/TOKEN_EFFICIENCY.md`. Do not reread completed phases unless needed.

## Handoff
The roadmap marker and `NEXT_SESSION.md` must be updated after meaningful work. The user should always receive a ready next action.
