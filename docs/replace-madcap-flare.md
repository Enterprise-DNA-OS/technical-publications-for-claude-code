# Replace MadCap Flare

## Export from Flare

In Flare Desktop choose Project > Export Project. Select Entire Project and export to a folder. If you choose the zip option, extract it first. Keep Content, Project/TOCs and the project file together. The vendor's export steps were checked on 20 October 2026: https://help.madcapsoftware.com/flare2026/Content/Flare/Project-Management/Exporting-Projects/Exporting-Projects.htm

Topics are XHTML .htm files in Content: https://help.madcapsoftware.com/flare2025r2/Content/Flare/Step2-Authoring/Topics/General-Information/Topic-Based-Authoring.htm

## Bring the project across

Start with an empty database, run npm run migrate, and place the extracted folder under imports/. Do not seed a real installation with demo records.

```bash
node scripts/publications.mjs import madcap-flare imports/exported-project --project=PRODUCT --owner="Documentation lead" --due=2026-12-01 --actor="Operator" --dry-run
node scripts/publications.mjs import madcap-flare imports/exported-project --project=PRODUCT --owner="Documentation lead" --due=2026-12-01 --actor="Operator"
```

Set a real review date before running either command. The second command is the complete import. A dry run writes no records. Import is one transaction. A failure leaves no partial topics or archived files.

## What maps

| Flare source | Here |
|---|---|
| Content/*.htm or .html | Topic title, source language, exact source text and retained revision |
| Project/TOCs/*.fltoc | One manual per TOC, flattened in document order |
| Topic links in a TOC | Ordered manual membership |
| Source files | Exact bytes as base64 with original path and SHA-256, retained in the database export |
| Local PNG, JPEG, GIF or WebP images | Embedded in generated manual HTML |
| Local topic links | Links to sections within the assembled manual |

Topic codes derive from project code and original path, so repeated imports do not duplicate them. With no TOC, the importer creates one review manual in source-path order. Imported topics start unapproved. Authors and review dates come from your explicit import arguments, not inferred Flare metadata.

## Conversion work

The base renderer handles headings, paragraphs, lists, basic tabular content, code, emphasis, supported images and links. It is not a Flare rendering engine. Conditions, snippets, variables, cross-reference elements, skins, advanced layouts, merged TOCs, scripts, video and exact pagination require conversion. Unconverted proprietary markup blocks release. Original files remain available. Neither Flare Online comments nor cloud permissions are present in a desktop project export. Recreate review assignments explicitly.

The importer expects UTF-8 XHTML. Conditional or variable TOCs, repeated topic entries and TOC links that do not resolve are rejected. Split exports larger than 100 MB into logical projects, and keep the originals outside Git.

## Check the switch

Compare topic and manual counts with the export. Run /compliance and /release-check, render /documents, inspect images and links, and compare a representative manual with the old output. Convert unsupported content before independent review. Review each current revision, retain a local snapshot, and keep both the original export and your database backup. A representative project can be imported in one session; a complex Flare publishing setup needs conversion before the switch.

Omni by Enterprise DNA can map the source, reproduce your layouts, add your review rules and run the resulting system. One setup fee, then a retainer: https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=madcap-flare
