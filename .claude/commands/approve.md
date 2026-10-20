---
description: Record an independent review of the exact revision
---

# approve

Record an independent review of the exact revision.

Read CLAUDE.md. Run:

```bash
node scripts/publications.mjs approve <topic> --revision=N --reviewer="Reviewer" --due=YYYY-MM-DD --actor="Reviewer"
```

Replace placeholders with operator-supplied facts. Resolve names before a write. If ambiguous, show the candidates and stop. Every write needs the operator's actor label. Never invent a review, reviewer or approval.

Read the exact current revision with /topic. The human reviewer must have checked it. An agent never approves its own work or guesses the reviewer.

Use --json when composing another command. Sources and limits are in docs/compliance.md.
