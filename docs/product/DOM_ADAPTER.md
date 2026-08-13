# ChatGPT DOM Adapter Specification

## Purpose

ChatGPT's web DOM is an external, unsupported and changeable interface. This adapter prevents those details from leaking into the rest of the extension.

## Non-goals

The adapter must not:

- read conversation message bodies;
- inspect the prompt composer;
- inspect uploaded file content;
- inspect account email/name;
- use cookies/auth tokens;
- call private OpenAI endpoints;
- mutate React state;
- depend on one obfuscated CSS class.

## Required semantic outputs

```ts
type ProjectContext = {
  projectKey: string;
  projectHref?: string;
  projectTitle?: string; // optional display-only; not required for identity
  root: HTMLElement;
};

type ConversationRow = {
  conversationKey: string;
  href: string;
  title: string;
  element: HTMLElement;
  actionMount: HTMLElement;
};
```

The rest of the extension consumes these objects and must not know selectors.

## Project identity strategy

Use a ranked strategy:

1. Prefer a stable project token/ID parsed from a verified current project navigation link.
2. Otherwise use a normalized canonical project href with query/hash removed.
3. Never use project title alone.
4. If identity confidence is insufficient, return `null` and render nothing.

Known historical ChatGPT Project links have included `g-p-*` tokens, but exact current route patterns **must be verified in Phase 00**. Do not hardcode a historical screenshot or memory as release truth.

## Conversation identity strategy

1. Prefer a stable conversation token parsed from a verified conversation navigation href.
2. Fallback to normalized href.
3. Never use title alone.
4. No Pin button when href/identity cannot be safely derived.

## Selector profile

All DOM queries belong in `src/adapter/selectors.ts` or equivalent and are grouped into a versionless semantic profile:

```ts
type SelectorProfile = {
  projectRoots: string[];
  projectLinks: string[];
  conversationLinks: string[];
  conversationRowAncestors: string[];
  conversationActionMounts: string[];
};
```

Selector quality order:

1. stable href semantics;
2. `data-*` semantic attributes;
3. ARIA roles/labels with localization awareness;
4. stable element structure;
5. CSS class only as a fallback if verified stable enough.

Never depend exclusively on generated utility/hashed classes.

## Localization

Do not use English visible labels as the only detector.

ARIA/text may be a fallback but must not be the primary identity mechanism because ChatGPT UI can be localized.

## Mounting

Pinned section:

- find a narrow mount point associated with the active Project conversation list;
- insert a single extension-owned container with `data-projectpins-root`;
- if a safe mount point is unavailable, do not mount.

Native row Pin action:

- inject into a row-owned action area only when the row is confidently recognized;
- mark with `data-projectpins-decorated`;
- repeated reconciliation must not create duplicates.

## React safety

Do not:

- move native conversation elements;
- replace parent `innerHTML`;
- reorder ChatGPT children;
- remove native controls;
- write React-owned attributes except adding a small extension-owned child;
- call internal React handlers directly.

Extension teardown removes only extension-owned nodes.

## Mutation strategy

Observe the smallest stable ancestor available.

Observer config baseline:

```text
childList: true
subtree: true
attributes: false
characterData: false
```

If an attribute must later be observed, document why and narrow `attributeFilter`.

The observer callback only schedules a reconcile. It does not immediately scan the document for every mutation.

Use an `isReconciling`/scheduled flag and coalesce via `requestAnimationFrame` or a short bounded debounce.

## Route/navigation strategy

Listen to:

- `popstate`;
- `hashchange`;
- relevant DOM mutations;
- `visibilitychange` when returning to a tab.

Do not inject MAIN-world history patches unless these mechanisms prove insufficient and a new ADR is approved.

## Fail-closed behavior

When a required adapter assumption fails:

- remove/stop extension-owned Project UI for that context;
- leave native ChatGPT UI untouched;
- emit a development diagnostic code if debug mode is enabled;
- never guess and hide/move rows.

Example diagnostic codes:

```text
PP_ADAPTER_NO_PROJECT
PP_ADAPTER_NO_LIST_MOUNT
PP_ADAPTER_ROW_NO_HREF
PP_ADAPTER_ROW_AMBIGUOUS
PP_ADAPTER_PROFILE_MISMATCH
```

Production diagnostics must not include real titles/URLs unless explicitly enabled by the developer in a local build.

## Sanitized fixtures

Every selector bug fix requires a regression fixture.

Fixture rules:

- replace real titles with `Chat A`, `Chat B`;
- remove message content;
- remove account/profile data;
- remove file names;
- remove tokens/session values;
- keep only required DOM structure and safe attributes.

See `tests/fixtures/README.md`.

## Phase 00 evidence to record

Create `docs/research/LIVE_DOM_FINDINGS.md` containing:

- date tested;
- ChatGPT domain;
- observed project route shape, with IDs redacted;
- observed conversation href shape, with IDs redacted;
- stable semantic attributes/roles available;
- selected mount point description;
- known alternate states (collapsed sidebar, shared project if available);
- screenshots are optional and must be sanitized.

Do not paste private DOM dumps into this file.
