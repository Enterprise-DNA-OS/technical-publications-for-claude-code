# Command reference

Run from the project folder. Node 20 or later. All commands accept --json. Values with spaces must be quoted. No command sends or hosts content.

## projects

List documentation projects.

```bash
node scripts/publications.mjs projects
```

## topics

List topics, revisions and review status.

```bash
node scripts/publications.mjs topics
```

## topic

Read one topic and its full revision history.

```bash
node scripts/publications.mjs topic <code-or-name>
```

## manuals

List manuals, deadlines and blockers.

```bash
node scripts/publications.mjs manuals
```

## manual

Read one manual and its ordered topics.

```bash
node scripts/publications.mjs manual <code-or-name>
```

## review-queue

Reviews due or awaiting approval.

```bash
node scripts/publications.mjs review-queue
```

## attention

Topics and manuals needing attention.

```bash
node scripts/publications.mjs attention
```

## reuse

Show which manuals use each topic.

```bash
node scripts/publications.mjs reuse
```

## compliance

Check source titles, language, image descriptions and content conversion.

```bash
node scripts/publications.mjs compliance
```

## release-check

Check a manual before taking a release snapshot.

```bash
node scripts/publications.mjs release-check <manual>
```

## insights

Answer ten cross-record questions.

```bash
node scripts/publications.mjs insights
```

## activity

Read the audit log.

```bash
node scripts/publications.mjs activity
```

## releases

List retained release snapshots.

```bash
node scripts/publications.mjs releases
```

## add-project

Create a documentation project.

```bash
node scripts/publications.mjs add-project --code=PRODUCT --name="Product documentation" --actor="Operator"
```

## add-topic

Create a topic from an XHTML file.

```bash
node scripts/publications.mjs add-topic --project=PRODUCT --code=TOPIC --file=imports/topic.htm --owner="Author" --due=YYYY-MM-DD --actor="Operator"
```

## revise

Revise a topic; invalidate its previous approval.

```bash
node scripts/publications.mjs revise <topic> --file=imports/revised.htm --actor="Author"
```

## schedule-review

Assign an owner and a review deadline.

```bash
node scripts/publications.mjs schedule-review <topic> --owner="Author" --due=YYYY-MM-DD --actor="Operator"
```

## approve

Record an independent review of the exact revision.

```bash
node scripts/publications.mjs approve <topic> --revision=N --reviewer="Reviewer" --due=YYYY-MM-DD --actor="Reviewer"
```

## archive

Archive a topic without erasing its history.

```bash
node scripts/publications.mjs archive <topic> --actor="Operator"
```

## add-manual

Create a manual.

```bash
node scripts/publications.mjs add-manual --project=PRODUCT --code=MANUAL --name="Operator manual" --language=en-NZ --owner="Owner" --due=YYYY-MM-DD --actor="Operator"
```

## attach

Add a topic at a position in a manual.

```bash
node scripts/publications.mjs attach <manual> --topic=<topic> --position=1 --actor="Operator"
```

## log

Record an operator note.

```bash
node scripts/publications.mjs log <reference> --note="Operator supplied note" --actor="Operator"
```

## render-manual

Render a branded local manual for review.

```bash
node scripts/publications.mjs render-manual <manual>
```

## release

Retain an immutable local release snapshot; nothing is published.

```bash
node scripts/publications.mjs release <manual> --version=v1 --actor="Release manager"
```

## release-copy

Write an exact retained release to a local HTML file.

```bash
node scripts/publications.mjs release-copy <manual> --version=v1
```

## weekly-review

Draft the Monday review from attention, manuals and compliance.

```bash
node scripts/publications.mjs weekly-review
```

## draft-review

Draft a manual review request.

```bash
node scripts/publications.mjs draft-review <manual>
```

## import

Import an exported MadCap Flare project folder.

```bash
node scripts/publications.mjs import madcap-flare imports/exported-project --project=PRODUCT --owner="Author" --due=YYYY-MM-DD --actor="Operator" --dry-run
```

## export

Export the complete database as JSON.

```bash
node scripts/publications.mjs export
```

## Details

add-topic also accepts --title and --language. revise accepts --title and --language. import accepts --name, --language and --update-existing. export accepts --out and refuses to overwrite an existing file.

Create a new manual edition with add-manual and attach when order or membership changes. A topic occurs once per manual. HTML snapshots are created by release and copied by release-copy. Rendering with render-manual produces a current draft and reports blockers. Approval dates use the database's current UTC date.

Import retains original project files up to 10 MB each, 100 MB total and 10,000 files. Extract a Flare zip before import. Output, Analyzer, FileSync, Users, .git and node_modules folders are excluded. Symlinks are refused. Re-importing unchanged content is idempotent. Changed content requires --update-existing and clears approval. Changed TOC membership stops the transaction: create a new project or manual edition after checking the differences. No partial import survives an error.
