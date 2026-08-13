# Privacy and Security Specification

## Privacy promise for MVP

ProjectPins is a local UI organization tool.

It does not need to know what the conversation says.

## Allowed data reads

Only the minimum navigation metadata from recognized Project/conversation list UI:

- active project navigation identity;
- conversation navigation href/identity;
- visible conversation title needed to render a pinned link;
- DOM nodes required to mount controls.

## Forbidden data reads

- message text;
- assistant response text;
- composer/input contents;
- attached file content;
- uploaded file names unless they are somehow part of a conversation title (do not specifically query them);
- account email;
- account display name;
- cookies;
- authentication/session tokens;
- billing/subscription information;
- hidden page state for unrelated purposes.

## Stored data

Schema version plus per-project pinned navigation metadata only.

No raw DOM snapshots in production storage.

## Network policy

Production runtime must initiate **zero network requests**.

Forbidden in production source unless a future ADR changes scope:

- `fetch`
- `XMLHttpRequest`
- `WebSocket`
- `EventSource`
- analytics SDKs
- remote error reporting
- remote config
- remote fonts/icons

ChatGPT itself will of course make its own network requests; tests must distinguish extension-originated requests.

## Permissions

Expected:

```text
storage
content_scripts.matches = https://chatgpt.com/*
```

Not allowed in MVP:

```text
<all_urls>
cookies
history
webRequest
webRequestBlocking
downloads
clipboardRead
clipboardWrite
tabs
identity
management
nativeMessaging
```

If implementation discovers a need for an additional permission, stop and create an ADR before adding it.

## XSS / injection

Use DOM construction APIs and `textContent`.

Never inject a title using raw HTML.

Never execute page-provided JavaScript strings.

Do not expose unnecessary web-accessible resources.

## Account/project isolation

Pin state is keyed by stable Project identity, not project title.

Rendering is only permitted after resolving the active Project identity. If no match exists, no stored pin titles should be rendered.

This prevents a different Project (including one in another ChatGPT account in the same browser profile) from seeing unrelated pinned metadata, assuming project keys are unique. Phase 00 must verify the project-key strategy.

## Logs

Production default: no logs containing title, href, project key, conversation key, or DOM.

Development diagnostics should prefer counts and redacted IDs.

## Store disclosure

Chrome Web Store privacy text should state:

- purpose: organize/pin conversation navigation inside ChatGPT Projects;
- site access: ChatGPT only;
- storage: local extension storage;
- data sale: none;
- data transmission: none in MVP;
- affiliation: independent extension, not affiliated with OpenAI.

Final wording must match the actual shipping code.
