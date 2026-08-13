# Engineering Rules

- TypeScript strict mode.
- Keep ChatGPT-specific DOM logic in `src/adapter/`.
- Keep persistence behind `src/storage/`.
- Keep injected UI behind `src/ui/`.
- Business state must not depend on DOM node identity.
- Idempotent reconciliation: running it repeatedly must not duplicate UI.
- Prefer event delegation over one listener per row.
- MutationObserver callbacks must be debounced/coalesced.
- Never parse message bodies.
- No production `fetch`, XHR, WebSocket, EventSource, or remote scripts.
- No unsafe `eval` or string-to-code behavior.
- No blanket selectors that hide or rewrite arbitrary ChatGPT content.
- Use extension-owned `data-projectpins-*` attributes/classes.
- If project identity cannot be resolved, render nothing.
- If conversation identity cannot be resolved, do not expose a Pin action for that row.
- Keep storage schema versioned and migration-tested.
- Add tests for negative/failure states, not only happy paths.
- Any selector change caused by ChatGPT UI updates must include a sanitized regression fixture.
