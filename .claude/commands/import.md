---
description: Import an exported MadCap Flare project folder
---

# import

Import an exported MadCap Flare project folder.

Read CLAUDE.md. Run:

```bash
node scripts/publications.mjs import madcap-flare imports/exported-project --project=PRODUCT --owner="Author" --due=YYYY-MM-DD --actor="Operator" --dry-run
```

Replace placeholders with operator-supplied facts. Resolve names before a write. If ambiguous, show the candidates and stop. Every write needs the operator's actor label. Never invent a review, reviewer or approval.

Show the dry-run counts and conversion findings. Import the same folder without --dry-run only when the operator has authorised it. A changed existing topic requires --update-existing and retains its previous revision.

Use --json when composing another command. Sources and limits are in docs/compliance.md.
