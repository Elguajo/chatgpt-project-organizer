# Sanitized DOM fixtures

Phase 00 must add fixtures from a non-sensitive ChatGPT test Project.

Do not commit a raw page dump.

Before saving:

- replace conversation titles with generic labels;
- delete message-body DOM;
- delete composer DOM;
- delete profile/account nodes;
- delete file information;
- delete tokens/session identifiers;
- redact project/conversation IDs while preserving structural shape needed by parser tests.

A fixture exists to reproduce an adapter structure, not to archive ChatGPT content.
