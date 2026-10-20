<h1 align="center">Technical Publications for Claude Code</h1>

<p align="center">
  <strong>The open-source technical publications system that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your MadCap Flare data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=madcap-flare">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/madcap-flare?utm_source=github&utm_medium=readme&utm_campaign=madcap-flare">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#instead-of-madcap-flare">Instead of MadCap Flare</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

Technical Publications for Claude Code holds reusable topics, review deadlines, ordered manuals and immutable release snapshots in a database you own. It is for software and instrument businesses that maintain operator and service documentation. It imports an exported MadCap Flare project and retains its original source files.

MadCap's published desktop price is US$3,150 per author per year. Ten authors at that list price is US$31,500 before discounts. This is a seat-count scenario, not an observed customer invoice. Flare Online pricing is quoted separately. Source checked 20 October 2026: [MadCap pricing](https://www.madcapsoftware.com/pricing/flare/).

This base handles the records, reviews and a subset of XHTML rendering. It does not reproduce every Flare publishing feature. The [switching guide](docs/replace-madcap-flare.md) names conversion work explicitly.

## Quick start

```bash
git clone https://github.com/Enterprise-DNA-OS/technical-publications-for-claude-code.git
cd technical-publications-for-claude-code
npm install
npm test
npm run demo
npm run docs
npm run view
```

Open the folder in Claude Code, Codex, OpenCode or Cursor. Ask /attention, then /reuse and /release-check PUB-QUICK. The demo business is fictional. Documents are local HTML in docs-out/ and views/. Nothing sends or publishes.

Node 20 or later. No database installation is needed for the embedded PGlite mode. For Postgres, set DATABASE_URL and run npm run migrate. Use a fresh database for business records and import instead of seeding demo data. Protect the database credentials.

## The commands

30 CLI commands and 34 slash-command recipes. Every CLI command has human output and --json. See [docs/cli.md](docs/cli.md) for complete syntax.

| Command | What it does |
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

## The five weekly rituals

- /review-queue assigns overdue reviews before a manual goes out.
- /reuse shows the manuals affected by a shared-topic change.
- /compliance lists missing source titles, language markers, image descriptions and conversion work.
- /release-check makes current approvals and review dates explicit before /release retains a local snapshot.
- /weekly-review writes the Monday summary from attention, manuals and content checks.

## Ten questions to ask your records

These are implemented queries, not claims that Flare cannot be customised to answer them. Run /insights.

1. Which shared topics block the most manuals?
2. Which authors have the oldest overdue reviews?
3. Which manuals are due with unapproved content?
4. Which topics are maintained but used nowhere?
5. Which approved topics have passed their review date?
6. Which topics changed after their last release?
7. Which reviewers approved the current revisions?
8. Which manuals mix languages?
9. Which manuals have no retained release snapshot?
10. Where would a shared-topic edit have the widest effect?

## Your first hour: ten things to ask for

1. Put our business name and logo on every manual.
2. Import this exported Flare project and show what needs conversion.
3. Show which manuals share our start-up procedure.
4. Assign this topic to our documentation lead for review.
5. Draft a review request for the operator manual.
6. Compare the current revision with the retained history.
7. Show what prevents the next manual release.
8. Create a new manual edition with these topics in this order.
9. Add our product version field with /customise.
10. Add a read-only dashboard for our review owners with /new-view.

## Reviews and retained history

A content, title, language or owner change creates a new topic revision and invalidates approval. The reviewer must differ from the topic owner, name the exact revision and supply the next review date. Actor labels are not authenticated identities. Human review remains essential.

A release is a local database snapshot of the exact source, topic revisions and rendered HTML. It does not upload anything. Later edits cannot alter it. Historical records reject updates and deletes. A database owner still controls the database, so use authenticated access and protected backups in a shared deployment.

[Compliance sources and limits](docs/compliance.md). [Why there is no front end](docs/why-no-front-end.md).

## Instead of madcap-flare

Export the entire project from Flare and extract it if zipped. One import brings across topics, TOC order and source files. Unknown proprietary markup is retained and blocks release pending conversion. See the [full replacement guide](docs/replace-madcap-flare.md).

## Documents and dashboards

Change brand.json once. npm run docs renders complete manual drafts, review packs and release registers. npm run view renders the documentation week, review queue and topic reuse. Neither changes records. The HTML can be opened locally or printed to PDF.

## Verification

npm test creates and removes an isolated temporary PGlite database. It exercises all CLI commands, malformed input, ambiguous names, import idempotency and rollback, stale approvals, immutable release copies, unsafe markup and generated paperwork. The workflow tests Node 20 and 22 on Windows and Linux, plus a disposable Postgres 16 database.

## Want it installed and run for you?

Omni by Enterprise DNA brings your Flare content across, reproduces the layouts you need, adds your fields and review rules, and runs the system. A web front end or a different stack can be part of your version. One setup fee, then a monthly retainer.

[Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=madcap-flare).

## License

MIT. Copyright (c) 2026 Enterprise DNA. MadCap and Flare are their owners' trademarks. This independent project is not affiliated with MadCap Software.
