---
description: Retain an immutable local release snapshot; nothing is published
---

# release

Retain an immutable local release snapshot; nothing is published.

Read CLAUDE.md. Run:

```bash
node scripts/publications.mjs release <manual> --version=v1 --actor="Release manager"
```

Replace placeholders with operator-supplied facts. Resolve names before a write. If ambiguous, show the candidates and stop. Every write needs the operator's actor label. Never invent a review, reviewer or approval.

Run /release-check first. This stores a local content snapshot only. Use /release-copy for its HTML. Do not upload, host or send it.

Use --json when composing another command. Sources and limits are in docs/compliance.md.
