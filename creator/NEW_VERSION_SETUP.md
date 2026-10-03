# Corrections, new versions and site refresh: setup (October 2026)

This release closes the lifecycle gaps in `docs/EDITORIAL_LIFECYCLE_GAPS.md`.
It touches all three parts, so follow the order below. Each step is safe on
its own: Catalyst 0.5.0 accepts the old Creator payloads too, so nothing
breaks if you stop halfway.

## What it adds

- **Start new version** on any approved, published, unpublished or rejected
  article. The live article stays on the website, unchanged, until the new
  version is reviewed, approved and published. The new version keeps the
  article's web address.
- **Discard new version**, to drop an unsubmitted correction and go back to
  the published version.
- **Retract while a correction is in progress** (the live version is pulled,
  the draft is kept).
- **Slug reservation**: two articles can no longer claim the same web
  address, and a published article's address cannot change.
- **Tables, highlight, subscript, superscript, text alignment and image sizes**
  now reach the website instead of being flattened.
- **Bylines** (primary author, then contributors with Show Publicly ticked)
  and the **first published date** go to the website, which shows
  "20 Sept 2026 · Updated 2 Oct 2026" after a correction.
- **Dates are sent timezone-proof** (no more hard-coded +05:30).
- **The website refreshes within seconds** of a publish, correction or
  retraction (it used to take up to 5 minutes).
- Website side: robots and canonical honoured, share images, `/sitemap.xml`,
  `/rss.xml`.

## Before you start

1. Export the editorial app as a `.ds` backup.
2. Check no publication job is Queued or Processing.
3. The Deluge files here are the repo copies. If the live function in Creator
   differs from the repo copy you are replacing, stop and compare first.

## Step 1. Creator: one new field

In the **Articles** form add a **Drop Down** field:

- Field name (link name): `Public_Status`
- Choices: `Live`, `Withdrawn`
- No default value, not mandatory

It records whether the website is serving the article, separately from the
editorial state, so a correction can be in Draft while the article is live.
Existing articles can stay blank; blank is read as "Live if Published".

## Step 2. Creator: two app variables

Add these in the **Publishing** variable group, next to `Catalyst_Base_URL`
and `Signing_Secret`:

| Variable | Value |
|---|---|
| `Website_Base_URL` | the website origin, for example `https://www.genedrift.com` (no trailing slash) |
| `Revalidate_Secret` | the same value as `REVALIDATE_SECRET` on the website host |

Create both even if you leave them empty for now: the callback function
refers to them and Creator will not save it otherwise. Empty means "do not
refresh the website", and nothing fails.

## Step 3. Catalyst: deploy 0.5.0

Upload `genedrift-editorial-appsail-v0.5.0.zip` to the editorial AppSail
service, then **Deployments → Create Deployment**. Check
`<appsail url>/health` shows `"version":"0.5.0"`. No environment variable
changes.

## Step 4. Creator: functions

Create these three **new** functions first (the others call them):

| File | Returns |
|---|---|
| `functions/article_slug_conflict.deluge` | `string` |
| `functions/start_new_revision.deluge` | `map` |
| `functions/discard_new_revision.deluge` | `map` |

Then replace the body of these existing functions with the repo file:

- `validate_catalyst_publication_request`
- `retract_published_article`
- `handoff_publication_to_catalyst`
- `record_catalyst_publication_result`
- `submit_article_for_review`
- `publish_approved_article`
- `schedule_approved_article`
- `archive_draft_article`

## Step 5. Creator: two Custom APIs

Create them exactly like the existing `retract_published_article` Custom API
(same method, same user scope, same authentication):

| Custom API name | Function | Parameters |
|---|---|---|
| `start_new_revision` | `start_new_revision` | `articleId`, `reason` |
| `discard_new_revision` | `discard_new_revision` | `articleId` |

## Step 6. Widget

Upload `genedrift-editor-widget-v0.6.0-new-version.zip` as the Article
Workspace widget, index file `/index.html`, as before.

## Step 7. Website

Push `genedrift-web` (the host deploys from GitHub). Set `REVALIDATE_SECRET`
on the host if it is not already set, matching step 2.

## Step 8. Test (about 15 minutes)

1. Open a published article. A purple banner says it is locked. Click
   **Start new version**: you are now on revision N+1 in Draft. The slug box
   is locked. The website still shows the old version.
2. Add a table and a highlighted word, save, submit, review, approve, publish.
   The website shows the new text, the table, the original date and
   "Updated <today>", within a few seconds.
3. Start another new version and click **Discard new version**: the article
   is back to Published, the site unchanged.
4. Start another new version, then retract the article from the dashboard.
   The site shows "withdrawn" within seconds; the draft is still there.
   Publish the draft: the article is live again.
5. Create a second article with the first one's slug and submit it: Creator
   refuses with a message naming the article that holds the slug.

## Rolling back

Re-upload the previous widget zip and the previous AppSail zip
(`genedrift-editorial-appsail-rehearsal-v0.4.3.zip`), and paste the previous
function bodies back from git history. The `Public_Status` field and the two
variables can stay; nothing old reads them.

## Known limits, deliberately left

- A scheduled article must publish before a new version can start (there is
  no "cancel schedule" yet).
- Knowledge Hub cards show the latest publish date; the article page shows
  both dates.
- Redirects (`Redirects` form) are still not served.
- The schedule that retries failed hand-offs is still inactive (turn it on
  at the client setup).
