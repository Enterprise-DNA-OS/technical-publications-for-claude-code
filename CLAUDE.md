# Technical Publications for Claude Code

## Who this is for

An owner-led software or instrument business maintaining operator guides, service manuals and release evidence. Set your business name, logo and colours in brand.json. The Harbour Instruments records are fictional demo data.

## Rules

- Read the current records through scripts/publications.mjs before answering. Never invent content, a reviewer, an approval or a deadline.
- Read a topic before revising it. Exact codes, unique UUID prefixes and case-insensitive names work. An ambiguous name stops with a candidate list.
- Every write uses --actor. It is an operator label, not authentication. An approval must come from a human reviewer different from the topic owner and names the current revision.
- A content, title, language or owner change creates a new revision and clears approval. Do not bypass this by editing history.
- Review dates and independent approvals are house policy, not legislation. WCAG checks are limited evidence checks, not a conformance certificate. Read docs/compliance.md.
- Never send, upload, publish, pay or delete topic history. release means a local immutable snapshot only. Drafts and generated files stay local until the operator authorises an outward action.
- Imported proprietary markup stays in the original source and blocks release until converted. Never silently discard a condition, snippet or variable.
- Back up before schema changes. Add numbered migrations, update the relevant commands, and run npm test. Keep real documents and credentials out of Git.
- Use this locally as a trusted operator. A shared installation needs authenticated roles and access controls. Database-owner credentials can bypass the application.

## Routes

| Ask | Command |
|---|---|
| /projects | List documentation projects |
| /topics | List topics, revisions and review status |
| /topic | Read one topic and its full revision history |
| /manuals | List manuals, deadlines and blockers |
| /manual | Read one manual and its ordered topics |
| /review-queue | Reviews due or awaiting approval |
| /attention | Topics and manuals needing attention |
| /reuse | Show which manuals use each topic |
| /compliance | Check source titles, language, image descriptions and content conversion |
| /release-check | Check a manual before taking a release snapshot |
| /insights | Answer ten cross-record questions |
| /activity | Read the audit log |
| /releases | List retained release snapshots |
| /add-project | Create a documentation project |
| /add-topic | Create a topic from an XHTML file |
| /revise | Revise a topic; invalidate its previous approval |
| /schedule-review | Assign an owner and a review deadline |
| /approve | Record an independent review of the exact revision |
| /archive | Archive a topic without erasing its history |
| /add-manual | Create a manual |
| /attach | Add a topic at a position in a manual |
| /log | Record an operator note |
| /render-manual | Render a branded local manual for review |
| /release | Retain an immutable local release snapshot; nothing is published |
| /release-copy | Write an exact retained release to a local HTML file |
| /weekly-review | Draft the Monday review from attention, manuals and compliance |
| /draft-review | Draft a manual review request |
| /import | Import an exported MadCap Flare project folder |
| /export | Export the complete database as JSON |
| /view | Render read-only dashboards |
| /documents | Render manuals and review paperwork |
| /new-view | Add a read-only view |
| /customise | Make the documentation desk yours |

## Locations

- scripts/publications.mjs: one CLI, human output or --json.
- supabase/migrations: schema and views, applies with npm run migrate.
- scripts/lib/db.mjs: Postgres via DATABASE_URL, otherwise local PGlite.
- views.json and documents.json: read-only reports and paperwork.
- drafts/, docs-out/ and exports/: local outputs, ignored by Git.
- docs/replace-madcap-flare.md: export and import instructions.

Omni by Enterprise DNA installs, customises and runs this for your business: https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=madcap-flare
