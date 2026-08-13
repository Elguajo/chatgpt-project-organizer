# Live ChatGPT DOM Findings

Status: VERIFIED — sanitized live observation

This file must be completed during Phase 00 using a logged-in, non-sensitive test Project.

## Test date

2026-08-13

## ChatGPT domain

Verified: `https://chatgpt.com/`

## Project route shape

Verified redacted shape:

```text
/g/g-p-<project-token-redacted>/project
```

Do not paste a real project URL.

## Conversation route shape

Verified redacted shape:

```text
/g/g-p-<project-token-redacted>/c/<conversation-id-redacted>
```

## Stable attributes / roles observed

- Project sections expose a tab group with a Chats tab.
- The native conversation list is an `OL` with `aria-busy`.
- Recognized Project conversation links have the verified href shape above.
- A conversation link is nested as `LI > DIV > A`; the same inner `DIV` has a
  trailing sibling `DIV` for native conversation actions.
- The observed `project-item` and utility classes are implementation details,
  not a primary selector. Route semantics and element structure remain the
  required recognition strategy.

## Pinned section mount point

The narrow candidate is the active Project conversation-list `SECTION`, as a
single extension-owned sibling immediately before its native `OL`. Mount only
after the `OL` contains one or more verified Project conversation links.
Never move, reorder, or replace native children.

## Conversation row action mount

For a verified conversation href, find its closest `LI` and the row's inner
layout `DIV`. Its trailing sibling `DIV` is the observed native action area.
Phase 01 must validate that structure before inserting an extension-owned
button; otherwise it must expose no control.

## Alternate states tested

- [x] expanded sidebar
- [ ] collapsed sidebar
- [x] project with multiple chats
- [ ] light mode
- [ ] dark mode
- [ ] English UI
- [ ] Russian UI
- [ ] shared Project if available

## Privacy check

- [x] no message body copied
- [x] no account identity copied
- [x] no file data copied
- [x] fixtures sanitized
