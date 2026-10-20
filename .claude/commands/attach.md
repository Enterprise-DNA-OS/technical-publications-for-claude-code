---
description: Add a topic at a position in a manual
---

# attach

Add a topic at a position in a manual.

Read CLAUDE.md. Run:

```bash
node scripts/publications.mjs attach <manual> --topic=<topic> --position=1 --actor="Operator"
```

Replace placeholders with operator-supplied facts. Resolve names before a write. If ambiguous, show the candidates and stop. Every write needs the operator's actor label. Never invent a review, reviewer or approval.

Present the returned records with codes and dates. Mention every blocker. Do not turn a warning into a pass.

Use --json when composing another command. Sources and limits are in docs/compliance.md.
