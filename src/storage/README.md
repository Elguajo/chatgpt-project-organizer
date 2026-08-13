# Storage module

Phase 02 implements the storage repository.

Rules:

- one schema-versioned key;
- no direct storage calls from UI/adapter;
- no message content/account/token data;
- project-scoped reads/writes;
- unknown future schema is never overwritten blindly.
