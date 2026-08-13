# UI and User Flows

## UI principle

Look native enough to be unobtrusive, but keep the implementation extension-owned and resilient. Functionality outranks pixel-perfect imitation of ChatGPT.

## Primary layout

Inside an active Project conversation list:

```text
Project conversations

PINNED
  [pin] Important chat 1
  [pin] Important chat 2

All chats
  Chat A                      [pin button on hover/focus]
  Chat B                      [pin button on hover/focus]
  Important chat 1            [pinned state]
```

The native chat remains in its original native position. MVP accepts this duplicate navigation presence.

## Pin flow

1. User hovers or keyboard-focuses a recognized conversation row.
2. Extension Pin button becomes available.
3. User activates Pin.
4. Storage updates.
5. `Pinned` section updates immediately.
6. Native row Pin control changes to pressed/pinned state.

No toast is required for successful pinning unless usability testing shows ambiguity.

## Unpin flow

User may unpin from:

- the native row Pin button; or
- the pinned synthetic row control.

After unpin:

- synthetic row disappears;
- native row remains;
- storage updates once.

## Open flow

Pinned chat title is a normal navigation link to the stored/normalized conversation href.

The extension does not intercept or proxy the conversation content.

## Empty state

When zero pins exist, do not render a large empty panel. Either:

- hide the Pinned section entirely; preferred for MVP; or
- render a one-line hint only during an optional onboarding state.

Default: hide.

## Loading state

Local storage is fast. Avoid skeleton UI. Wait for storage read, then render.

Do not flash an empty Pinned section before data is known.

## Stale entry

Because the extension deliberately avoids private APIs, a deleted/moved conversation may remain pinned.

MVP behavior:

- still show the stored link/title;
- allow unpin;
- never infer “deleted” merely because the native lazy-loaded list does not currently show it.

A future version may add safe stale-entry handling if there is a reliable supported signal.

## Title refresh

If a pinned conversation is visible in the native list with the same conversation identity but a changed title, update the cached title in local storage.

Do not scrape title from message content.

## Reordering

MVP insertion order:

- newest pin may appear first, or an explicit `order` sequence is maintained.

Recommended MVP: newest pinned first.

Manual drag ordering is post-MVP.

## Localization

MVP microcopy:

English:
- Pinned
- Pin chat
- Unpin chat

Russian:
- Закреплённые
- Закрепить чат
- Открепить чат

Choose by document language prefix; fallback to English.

Do not use localized visible ChatGPT text as core DOM identity.

## Accessibility

- Pin control: `<button type="button">`
- `aria-pressed="true|false"`
- localized `aria-label`
- visible keyboard focus
- target size should be practical without shifting the row
- pinned navigation row uses `<a href>`
- do not trap focus
- no hover-only action without keyboard equivalent

## Visual behavior

- use a simple pin SVG shipped locally or a CSS/currentColor icon;
- no remote icon libraries;
- use `currentColor`;
- match surrounding row height/padding approximately;
- no fixed branding colors in the MVP;
- support light/dark by inheriting host colors and using conservative fallback borders/backgrounds.
