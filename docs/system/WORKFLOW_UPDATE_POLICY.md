# Workflow Update Policy

Upstream workflow changes must never overwrite project-owned state.

Project-owned:

- `docs/project/*`
- `docs/phases/*`
- `docs/decisions/*`
- `docs/product/*`
- application source/tests
- package decisions

When adopting a newer Token-Efficient Spec Kit version:

1. inspect upstream changes;
2. merge workflow behavior manually;
3. preserve project constraints;
4. update `.token-efficient-spec-kit/VERSION`;
5. run `python tools/audit.py`;
6. review current handoff.
