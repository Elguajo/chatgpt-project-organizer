# Workflow Self-Audit

Check:

- required canonical files exist;
- roadmap has exactly one current phase unless all phases are complete;
- referenced phase files exist;
- NEXT_SESSION agrees with ROADMAP;
- product constraints are consistent between brief and architecture;
- no future feature has leaked into MVP;
- permissions remain least-privilege;
- current phase has measurable acceptance criteria.

Run `python tools/audit.py` first.
