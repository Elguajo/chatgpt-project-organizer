# Test Matrix

## Test layers

### 1. Pure unit tests

- project token parsing;
- conversation token parsing;
- URL normalization;
- storage schema validation;
- migration;
- pin deduplication;
- pin/unpin idempotency;
- title refresh;
- ordering.

### 2. Sanitized DOM fixture tests

At least these fixture states:

1. Project with several conversations.
2. One already pinned conversation.
3. Empty Project conversation list.
4. Sidebar/project list re-render.
5. Conversation title renamed.
6. Conversation row without resolvable href.
7. Unknown DOM layout.
8. Localized UI fixture.
9. Collapsed/alternate sidebar state if current ChatGPT provides it.
10. Shared Project variant if available during QA.

### 3. Extension integration tests

- one `Pinned` root only after repeated reconcile;
- one Pin control per recognized row;
- mount removal when leaving Project context;
- Project A -> Project B switches displayed pins;
- observer does not recursively self-trigger into duplicate rendering;
- storage events update visible UI if state changes.

### 4. Manual authenticated-browser QA

Required before release because a fully realistic logged-in ChatGPT Project cannot be treated as a stable public test fixture.

Use a non-sensitive test Project.

Test:

- Chrome stable current version;
- light and dark mode;
- English and Russian ChatGPT UI if available;
- expanded/collapsed sidebar states;
- at least two Projects;
- 20+ conversations in one Project if practical;
- branch chat if available;
- rename a pinned chat;
- refresh;
- close/reopen browser;
- switch Projects repeatedly;
- disable/re-enable extension;
- logout/login if safe.

## Core acceptance matrix

| Scenario | Expected |
|---|---|
| Pin Chat A in Project 1 | appears in Project 1 Pinned section |
| Refresh | remains pinned |
| Open Project 2 | Project 1 pins absent |
| Return Project 1 | pins present |
| Unpin | removed from synthetic section |
| ChatGPT re-renders list | UI returns without duplication |
| Adapter cannot find project | no injected Project UI |
| Adapter sees ambiguous row | no Pin control on that row |
| Extension disabled | native ChatGPT unaffected |
| Network inspection | no extension-originated production requests |
| Manifest inspection | only expected permission/site scope |
| Title contains markup-like text | rendered as text, never HTML |

## Performance checks

With ~100 visible/synthetic rows where possible:

- repeated DOM mutations do not cause sustained high CPU;
- observer callback coalesces;
- reconcile median target <20 ms;
- no unbounded observer/listener growth after 50 Project navigations.

Performance target is a diagnostic budget, not a reason to skip correctness.

## Release evidence

Phase 05 must record evidence in its phase file or a concise QA note:

- commands run;
- build artifact produced;
- browser versions tested;
- acceptance failures/fixes;
- any externally blocked criterion.
