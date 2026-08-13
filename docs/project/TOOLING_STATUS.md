# Tooling Status

## Project tier

M — browser extension with unstable DOM integration and privacy-sensitive page access, but no backend.

## Required local tooling

| Tool | Status | Purpose |
|---|---|---|
| Node.js 22.4+ | required | current WXT/runner-compatible development baseline |
| npm | required | package management |
| WXT | selected | extension build/dev/zip |
| TypeScript | selected | strict application code |
| Vitest | selected | unit/fixture tests |
| Playwright | selected | browser QA where practical |
| Python 3 | required | repository audit script |
| Chrome/Chromium | required | unpacked extension + authenticated ChatGPT QA |

## AI coding integrations

These are optional capabilities, not sources of truth.

- Context7: recommended when current WXT/Chrome/library APIs need verification.
- Superpowers-style TDD/debug workflow: recommended for implementation.
- Semble/Serena: useful later when codebase grows; not required at scaffold stage.
- RTK: optional for compact terminal output.
- gstack/browser QA tooling: useful in release phases.
- GitHub Spec Kit advanced mode: unnecessary for MVP unless a future phase becomes materially more complex.

## Dependency freshness

The project skeleton was prepared on 2026-08-12 using current web-verified reference points:

- WXT `0.21.1`
- TypeScript `7.0.2`
- Vitest `4.1.10`
- Playwright `1.62.x` current line

Before `npm install` in a materially later session, verify official package release notes rather than blindly upgrading WXT because its `0.x` minor releases may be breaking.
