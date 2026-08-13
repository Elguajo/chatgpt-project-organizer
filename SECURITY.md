# Security Policy

## Product boundary

ProjectPins modifies the ChatGPT web UI through a browser extension content script. It is intentionally local-first.

The production extension must:

- request only the `storage` permission plus the content-script match for `https://chatgpt.com/*`;
- never request cookies, history, webRequest, downloads, clipboard, tabs, identity, or `<all_urls>` for the MVP;
- never execute remote code;
- never send chat titles, IDs, project IDs, DOM, message content, prompts, files, or account details to a remote server;
- never inspect message bodies or composer text;
- fail closed when the ChatGPT DOM cannot be recognized safely.

## Sensitive data

Stored values are limited to navigation metadata required for pinning:

- schema version;
- project key;
- conversation key;
- conversation URL;
- displayed chat title;
- pin order;
- created/updated timestamps.

Do not store message text, attachments, uploaded file names, user email, account name, access tokens, cookies, or OpenAI API data.

## Reporting

For a private vulnerability report, do not include real ChatGPT conversations, account identifiers, tokens, or screenshots containing confidential material. Provide a minimal reproduction using sanitized fixtures.

## Dependency security

Before release:

```bash
npm audit
npm run compile
npm test
npm run build
```

Review dependency changes manually. WXT is currently pre-1.0, so minor-version updates can include breaking changes; read its official upgrade notes before bumping the framework.
