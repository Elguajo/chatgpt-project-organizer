# Organizer comparison and requested colors — 2026-10-14

Status: research and static review only; no runtime fix or authenticated QA.

## Sources and findings

- [Favorites & Color Highlighter](https://chromewebstore.google.com/detail/chatgpt-favorites-color-h/mepfaoknmcmelkcbhjmobgldhebiphll): publisher describes local favorites, chat/project colors and Favorite/Color context-menu actions. Closest UX reference; source and current functionality not verified. Project-scoped isolation is not established.
- [ChatFolders by Lgr](https://chromewebstore.google.com/detail/chatfolders-organize-your/bfedfcfofpjcdcceddffejpdglhhbjpk): publisher describes colored tags, filtering and local storage. Useful named-tag UX; implementation not inspected.
- [ChatGPT Gold source](https://github.com/markes76/chatgpt-gold/tree/5548b3ee23dc1c63379d5310e99ba71bfc086a31): inspected manifest.json, content.js and folder-manager.js. MV3 content script appends an owned sidebar to body; folders/conversations use chrome.storage.local. Useful independent UI pattern. Do not copy its message-body title fallback, page-localStorage fallback, metadata logging or broader permissions.
- [Superpower public source](https://github.com/saeedezzati/superpower-chatgpt/tree/d10a491cd1e45104ee31b8c43816dafb2ccd4ed4): inspected scripts/content/api.js and conversationList.js. Uses backend-api calls with access tokens and replaces original navigation with a custom list. Conflicts with our constraints. This public snapshot does not establish the current store build's implementation.

Platform references: [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts), [MutationObserver.observe](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe).
Isolated content-script JavaScript still shares the page DOM. Subtree child-list
observation also sees extension-owned child mutations.

## Static review of ProjectPins

1. Adapter recognizes only `section > ol[aria-busy]`, project-qualified chat URLs
   and exact row/title nesting. Different current markup can safely render
   nothing. Do not loosen selectors without current sanitized DOM evidence.
2. Runtime observes all document child-list changes and unconditionally schedules
   reconciliation. Renderer replaces icons/content and prepends controls on each
   render, creating a feedback path: render -> own mutation -> frame -> render.
   Lifecycle tests use a manually triggered RecordingObserver, missing this path.
   Reproduce with a real observer and sanitized fixture, then stabilize rendering
   and ignore own mutations while retaining detection of native list removal.
3. Scheduled reconciliation errors are swallowed; optional adapter diagnostic
   callbacks are not connected in the default runtime. Users cannot distinguish
   unsupported layout, stale installation and storage failure.
4. Historical click interception and the direct-button fallback are recorded in
   the earlier handoff. Neither is proven to explain today's reported failure.

No live cause was reproduced. First verify the loaded production build and fresh
content script, then trace recognition -> mount -> action -> storage -> render
using diagnostic codes/counts only. Never capture private titles or message data.

## Explicit change request — colored tags and titles

Requested by user on 2026-10-14, following prompts/CHANGE_REQUEST.md. Queued after
core pin repair; previously a post-MVP idea. Update Architecture, adapter contract
and add a dedicated feature phase before implementation. No new permissions or
privacy trade-off is needed for the proposed design.

Proposed criteria:

- Project-scoped named tags with palette colors, multiple tags per chat.
- Separate optional title color, avoiding ambiguity with multiple tags.
- Metadata keyed by project/conversation IDs, including unpinned chats.
- Versioned migration preserves pins and rejects unknown future schemas.
- Extension-owned tag controls; reversible native title styling only on a
  confidently recognized title target exposed by the adapter.
- No rewriting native title text, moving native rows or changing server data.
- Readable light/dark colors, keyboard editing and Reset color.
- Restore native presentation during teardown/context changes.
- Verify reload, two-project isolation, title rename and SPA rerender behavior.

Folders, search, sync and automatic content scanning are not part of this request.

## Working agreement

User clarified that desired outcomes need not contain a complete technical
prompt. Proactively supply diagnosis, UX, compatibility, migration, accessibility
and verification tasks. Make ordinary reversible decisions autonomously; ask
only for true blockers, material trade-offs or required authenticated access.
