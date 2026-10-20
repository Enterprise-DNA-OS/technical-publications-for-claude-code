# Content checks and release policy

Checked 20 October 2026. These checks support a technical writer's review. They do not certify WCAG conformance, product safety or regulatory approval. No rule here claims that every business is legally required to use this workflow.

## Published accessibility criteria

| Criterion | Source | Automated check | Human work still needed |
|---|---|---|---|
| WCAG 2.2 1.1.1 Non-text Content | https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html | Every image needs an alt attribute. Missing attributes block approval and release. Empty alt creates an advisory. | Verify that informative images have equivalent descriptions and empty alternatives are genuinely decorative. Complex diagrams need a full equivalent explanation. |
| WCAG 2.2 2.4.2 Page Titled | https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html | The source document needs a nonempty title. | Verify the title describes the topic or purpose. |
| WCAG 2.2 3.1.1 Language of Page | https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html | The source needs a language attribute matching the topic and manual language. | Verify the language is correct and mark passages in other languages. |

WCAG is a technical standard. These three tests are only a small part of accessibility. Keyboard use, reading order, contrast, links, heading quality, text alternatives and output format still need human review. External links are not fetched. Local fragment destinations are checked against source identifiers.

## Release policy

These are explicit house rules, not quoted law:

1. A topic owner is named, a review date is set, and an independent human reviews the exact revision. The actor label must match the reviewer label. Labels do not verify identity.
2. Content, title, language or owner changes create a retained revision and clear approval. A fresh review assignment also clears approval.
3. A manual release is blocked by unapproved revisions, overdue reviews, archived topics, an empty manual or mixed languages.
4. Missing images, unresolved local links, links to topics outside the manual, unsupported active content and unconverted Flare markup block approval or release.
5. A release retains the topic revisions and rendered HTML. Later changes cannot alter that stored snapshot. This command never publishes it.

The renderer removes active content and event attributes, renders a safe subset of XHTML, embeds supported local raster images and keeps local topic links within the assembled manual. Native Flare conditions, variables, snippets, skins, page layouts, scripts, rich media and merged TOCs need conversion. Original source files remain in the source archive. Review a representative manual side by side with Flare before switching.

Historical revision, release, source-archive and activity records reject updates and deletes. This protects against accidental application changes, not a hostile database administrator. Use separate authenticated roles and protected backups for a shared deployment.
