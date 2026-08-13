# Decision Framework

Record an ADR when a choice is:

- hard to reverse;
- privacy/security relevant;
- responsible for a major dependency;
- likely to affect several phases;
- a non-obvious trade-off future agents might otherwise undo.

For routine choices, decide and implement without an ADR.

Preferred decision order:

1. preserve explicit product constraints;
2. use platform capability;
3. minimize permissions and data;
4. minimize dependencies;
5. optimize maintainability;
6. optimize convenience.
