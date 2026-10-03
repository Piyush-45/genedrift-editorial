# Editorial platform: article lifecycle gaps (checked in code, 3 Oct 2026)

Scope: the life of a blog article from first draft to retirement, across the
Creator app (.ds export 2 Oct), the Article Workspace widget
(`P/editor-widget/src`), the editorial Catalyst service (`P/catalyst/src`)
and the website (`genedrift-web`). Secrets and test-only tools are out of
scope here (handled at migration). Each item says where it was confirmed.

## The lifecycle as built

Draft → Submitted / In Review → Approved → (Scheduled) → Published →
Unpublished (retracted). Side paths: Changes Requested (new draft revision),
Rejected, Archived (Trash) and Restore.

## A. Dead ends in the lifecycle (most important)

| # | Gap | What a user experiences | Confirmed in |
|---|---|---|---|
| A1 | **A published article cannot be edited or corrected.** Only `Draft` revisions are editable, and nothing creates a new draft from a Published article. | A typo, a changed regulation or a wrong date on a live article cannot be fixed. The only way out is retract it and write a new article, which then cannot reuse the same web address (A5). For a regulatory publisher this is the main gap. | widget `getRevisionAtExpectedVersion` ("no longer editable"), `loadWorkspace`; no Creator function starts a revision from Published |
| A2 | **An Approved (not yet published) article cannot go back to draft.** | A reviewer approves, then someone spots an error before publishing. It must be published as-is, or left stuck. | same; `schedule/publish_approved_article` only |
| A3 | **A retracted (Unpublished) article cannot be republished or revised.** | Withdraw by mistake, or withdraw to correct: there is no way back. | no function accepts `Unpublished` except retract (idempotent) |
| A4 | **Rejected is final.** | A rejected draft cannot be reworked and resubmitted; the author must start again. | `record_review_decision` sets Rejected; restore only accepts Archived |
| A5 | **Web addresses (slugs) are not reserved per article.** Uniqueness is only enforced at Catalyst's public index, at publish time. | Two articles with the same slug both pass review; the second fails only when the publisher clicks Publish. A retracted article still holds its address. | Creator `Slug` not unique by design (revisions share it); `GD_Public_Index.Slug` unique |

**Fix shape (one feature, covers A1 to A4):** a "Start new revision" action on
Approved, Published, Unpublished and Rejected articles that copies the latest
revision into a new Draft (the same copy logic already used for "Changes
Requested"), keeps the article's identity and slug, and runs the normal review.
Publishing the new revision replaces the live one (the Superseded state
already exists for this). Plus a slug check at submit and approve: no other
article may hold that slug. Roughly 2 to 3 days including tests.

## B. Content that changes on the way to the site

| # | Gap | Effect | Confirmed in |
|---|---|---|---|
| B1 | **Tables, highlight, subscript, superscript and text alignment** are in the editor, but Catalyst's renderer does not output them. Unknown blocks are flattened to their text. | A fee or timeline **table published as a jumble of text**, silently. Superscript in a citation loses its formatting. | widget imports `@tiptap/extension-table`, `-highlight`, `-subscript`, `-superscript`, `-text-align`; `catalyst/src/snapshot.ts` renders only paragraph, headings, lists, quote, hr, image, bold/italic/underline/strike/code/link |
| B2 | **Image size and alignment** chosen in the editor are dropped by the website. | Every inline image shows full width. | Catalyst adds `data-size`/`data-alignment`; website `sanitize.ts` allows no figure attributes |

**Fix:** either render tables (and sub/superscript) in Catalyst and allow them
in the website sanitiser and CSS (tables matter on a regulatory site), or
remove those buttons from the editor until supported. Image size/alignment:
allow the two attributes and style them. About 1 to 2 days.

## C. Fields editors fill in that the site ignores

| # | Field in Creator | Used on the site? |
|---|---|---|
| C1 | `Robots_Directive` (Index / Noindex) | **No.** Article pages do not set robots from it; a "Noindex" article is still indexable once the site is opened to search engines |
| C2 | `Canonical_URL_Override` | **No** |
| C3 | `Social_Media` image | **No** Open Graph image; links shared on LinkedIn show no picture |
| C4 | `Article_Contributors.Show_Publicly`, authors | **No** public byline (not in the API) |
| C5 | `Redirects` form | **Not served** by the API or used by the site |
| C6 | `Site_Settings` (SEO title pattern, RSS, search, related toggles) | **Mostly no** |

Confirmed: website `app/insights/[slug]/page.tsx` metadata sets only title and
description; `map-article.ts` reads but does not use robots/canonical/social.

## D. Search engines and feeds

| # | Gap | Confirmed in |
|---|---|---|
| D1 | **The website has no sitemap.** `robots.ts` points search engines at `/sitemap.xml`, which does not exist (404). Catalyst already produces an article sitemap that nothing uses. | no `app/sitemap.ts`; `app/robots.ts` |
| D2 | **No RSS on the website.** Catalyst has `/v1/public/rss.xml`; the site does not expose it. | no feed route |
| D3 | **Retraction takes up to ~5 minutes to show** on the site: article pages cache for 5 minutes and publishing does not refresh the article cache. Acceptable, but should be a stated, agreed delay. | `catalyst.ts` default revalidate 300; revalidate route has no article collection |

## E. Operational

| # | Gap |
|---|---|
| E1 | The reconciliation schedule that retries failed hand-offs is **inactive**. |
| E2 | Scheduled times are sent as **+05:30** (India) regardless of the app's time zone. Fine while the app is on Asia/Kolkata; must change if the client's app uses another zone. |
| E3 | `First_Published_At` is kept in Creator but the site shows only the latest version's date, so a corrected article (once A1 exists) would look newly published. Decide which date readers see ("Published 3 Oct, updated 9 Oct" is the norm). |

## Suggested order

1. A1 to A4 (new revision from any closed state) and A5 (slug reservation).
2. B1 (tables) and C1 (robots), because both can publish something wrong.
3. D1 (sitemap), C3 (share image), E1 (schedule on).
4. C4 bylines, C5 redirects, D2 RSS, E3 dates, B2 image sizing.

All of this is engineering inside the existing design; none of it needs the
architecture changed.


## Status, 3 Oct 2026 (later the same day): fixed in code

| Item | Status |
|---|---|
| A1 to A4 | Fixed. `start_new_revision` (Creator) and the widget's Start new version / Discard new version. Retraction works while a correction is in progress (`Public_Status` field). |
| A5 | Fixed. `article_slug_conflict` runs at submit, publish and schedule; a published article's slug is locked in the widget and in Creator. |
| B1 | Fixed. Catalyst 0.5.0 renders tables, highlight, sub/superscript and alignment; website sanitiser and CSS updated. |
| B2 | Fixed. Website keeps and styles image size and alignment. |
| C1, C2, C3 | Fixed on the website (robots, canonical, Open Graph/Twitter image). |
| C4 | Fixed. Bylines from Primary Author plus public contributors. |
| D1, D2 | Fixed. Website `/sitemap.xml` and `/rss.xml`, fed by Catalyst `/v1/public/discoverable`. |
| D3 | Fixed. The publication callback calls the website's revalidate (`collection: articles`). |
| E2 | Fixed. Dates go to Catalyst as epoch milliseconds. |
| E3 | Fixed. Article page shows the first published date and "Updated" date. |
| C5, C6, E1 | Open (redirects, Site_Settings, retry schedule). |

Rollout steps: `creator/NEW_VERSION_SETUP.md`.
