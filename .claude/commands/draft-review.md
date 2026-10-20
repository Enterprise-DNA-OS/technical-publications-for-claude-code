---
description: Draft a manual review request
---

# draft-review

Draft a manual review request.

Read CLAUDE.md. Run:

```bash
node scripts/publications.mjs draft-review <manual>
```

Replace placeholders with operator-supplied facts. Resolve names before a write. If ambiguous, show the candidates and stop. Every write needs the operator's actor label. Never invent a review, reviewer or approval.

Open the resulting draft, check its facts and hand over its path. Never send it.

Use --json when composing another command. Sources and limits are in docs/compliance.md.
