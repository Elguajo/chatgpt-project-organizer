# Project Brief

## Product directions considered

- **Recommended — ProjectPins:** a narrow local-first extension that pins important conversations within each ChatGPT Project.
- Alternative — full ChatGPT organizer with folders/tags/search from day one.
- Alternative — standalone dashboard that imports/links conversations outside ChatGPT.

## Selected direction

Build the narrow extension first. It solves one concrete navigation problem with minimal permissions and no backend. Folder/tag/search features remain future work.

## Desired outcome

A user with many conversations in a ChatGPT Project can keep a few important conversations permanently visible at the top of that Project, without changing ChatGPT data or relying on an OpenAI private API.

## Primary users

- power users who use ChatGPT Projects for long-running work;
- designers/developers/researchers with many parallel project conversations;
- users who need a stable “important chats” layer inside a Project.

## Core user jobs

1. Pin an important conversation from the current Project.
2. See pinned conversations at the top of that same Project.
3. Open a pinned conversation quickly.
4. Unpin it.
5. Keep the pins after page refresh/browser restart.
6. Switch Projects without pins leaking between Projects.

## Must-have requirements

- Chrome/Chromium first.
- Manifest V3.
- Works only on `chatgpt.com`.
- Project-scoped pin state.
- Pin/unpin action on recognized native chat rows.
- Extension-owned `Pinned` section at top of the Project conversation list.
- Persistence in extension local storage.
- Reconciliation after SPA navigation and ChatGPT re-renders.
- Keyboard accessible controls.
- Safe failure when DOM structure is unknown.
- No backend and no telemetry.
- No message-body, prompt-body, file-content, cookie, token, or account-data collection.
- No private OpenAI API calls.

## Explicit constraints

- Do not physically reorder native React-managed conversation nodes in MVP.
- Do not hide native chat rows merely because they are pinned.
- Do not inject into unrelated domains.
- Do not request `<all_urls>`, cookies, webRequest, history, or tabs permissions.
- Do not add folders/tags/search/sync to MVP without a change request.

## Assumptions

- ChatGPT Projects continue to expose enough navigation metadata in the web DOM (project and conversation links/titles) to identify project/conversation scope.
- A project identifier or stable project navigation key can be derived without reading message content.
- Conversation navigation URLs remain sufficient to reopen a pinned chat.
- DOM details are unstable and must be verified against the live product before release.

## Out of scope for first release

- folders and nested folders;
- tags/colors;
- global ChatGPT chat organization;
- full-text chat search;
- cross-device sync;
- cloud backup;
- shared-team pin synchronization;
- Safari;
- mobile apps;
- OpenAI API integration;
- analytics/telemetry;
- remote configuration.

## Success criteria

- Pinning takes no more than one explicit Pin action after the row is visible.
- Pinned items render in a stable top section for the active Project.
- Reload/browser restart preserves state.
- Project A pins never render while Project B is active.
- The extension causes zero production network requests.
- Disabling the extension returns ChatGPT to its unmodified behavior with no data loss.
- DOM mismatch does not break or hide native ChatGPT navigation.
- Manual QA passes on current ChatGPT web UI at release time.

## Classification

Type: browser extension / UI augmentation  
Complexity tier: M  
Risk: Medium — DOM integration is unstable; privacy risk is controlled by narrow scope and no network.

## Open blockers

No product blocker.

External verification dependency: final phase acceptance requires a logged-in ChatGPT account with at least two Projects and several conversations for manual QA.
