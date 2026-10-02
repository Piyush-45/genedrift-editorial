# Article Workspace Workflow Polish Setup

Status: v0.5.5 input preservation is live-smoke verified in the migrated
`piyugene02` Creator app from the user's 2026-09-05 screenshots. v0.5.7 is
packaged locally with the v0.5.6 floating publishing notifications plus the
refreshed-article route repair; upload is still required. This guide is now a Phase 1
support reference while the main project focus moves to Phase 2 website design
confirmation.

Latest widget package:

```text
editor-widget/genedrift-editor-widget-support-v0.5.7-refresh-route.zip
SHA-256 4868fce60fc067539e44ccca0418289f3ec36a3b62c9dd976ac5b9d180f30df3
```

## What this release adds

- Post-submit, post-review, and post-publish confirmation panels with clear
  Dashboard, Continue, and Review next actions.
- Recoverable Trash for Draft and Changes Requested articles. Revisions and
  audit history remain intact; there is no permanent-delete action in the
  widget.
- Inline tag creation for Authors and Editorial Admins, and inline category
  creation for Editorial Admins.
- Category optional while drafting but required by both the widget preflight
  and the server before review submission.
- Standard and Regulated policy explanations in the New Article flow.
- Role-focused dashboard attention metrics, publication health, a workflow
  timeline, review feedback, and prior-revision comparison.
- Branded HTML workflow emails with a direct Article Workspace action.
- v0.5.1 routes category/tag persistence through a guarded Deluge function so
  newly created multi-select lookup records are not rejected by the Widget SDK
  with code 3001.
- v0.5.2 routes image Alt Text and Caption through a guarded Deluge function,
  removes Credit from the authoring and published experience, adds image
  sizing/alignment/edit/remove controls, adds cover-removal Undo, and keeps the
  newest drafts at the top when Creator exposes no usable activity timestamp.
- v0.5.3 replaces implicit card navigation with a role-aware Editorial Command
  Center: visible workspace tabs, a personalized Today view, focused list
  workspaces, a dedicated recoverable Archive, and contextual filters.
- v0.5.4 clarifies dashboard live-refresh status, checks active publishing
  every 30 seconds instead of every 5 seconds, and adds an admin-only
  development reset for Creator test content.
- v0.5.5 removes internal whitespace rewriting from author-entered category/tag
  names and image alt text. It also verifies saved image alt text and caption
  immediately after the Creator metadata API returns, so a dropped Caption fails
  visibly instead of being silently lost.
- v0.5.6 moves publishing, schedule, retry, retraction, and in-workspace publish
  outcomes into floating notifications with a Publishing dashboard action.
  Ordinary editor messages remain inline to avoid introducing extra layout
  churn in the writing experience.
- v0.5.7 uses Creator's explicit `#Page:Article_Workspace` URL for dashboard
  and article navigation, and supplies the callback assumed by the current V2
  protected-image helper.

## Incremental upgrade from v0.5.5

Status for the migrated `piyugene02` demo app: packaged locally; live upload
still required.

1. Upload the v0.5.7 widget ZIP.
2. From an approved article, run Publish and confirm the accepted/started
   message appears as a floating notification with a Publishing dashboard
   action.
3. If scheduling or retracting is tested, confirm those publishing messages use
   the same floating notification and do not push the dashboard layout.

## Incremental upgrade from v0.5.4

Status for the migrated `piyugene02` demo app: live-smoke verified from the
user's 2026-09-05 screenshots.

1. Replace `create_editorial_taxonomy_term` with the latest source from
   `creator/functions/create_editorial_taxonomy_term.deluge`.
2. Replace `update_media_metadata` with the latest source from
   `creator/functions/update_media_metadata.deluge`.
3. Upload the v0.5.5 widget ZIP.
4. Create a category named `shit` and confirm it stays `shit`.
5. Create tags named `viral` and `test tagzzz` and confirm both names stay
   exactly as entered after save/reload.
6. Add or edit cover image alt text and caption, save, reopen the dialog, and
   confirm both values remain exactly as entered.

## Incremental upgrade from v0.5.3

Status for the migrated `piyugene02` demo app: complete and reset verified.

1. Add `reset_editorial_test_content` from
   `creator/functions/reset_editorial_test_content.deluge` with the argument
   below.
2. Create its private OAuth2 Custom API with the exact same link name.
3. Upload the v0.5.4 widget ZIP.
4. As an Editorial Admin or CEO, open the dashboard and confirm the Reset test
   content dialog requires the exact phrase `RESET TEST CONTENT`.
5. When intentionally cleaning the development app, run the reset and confirm
   the dashboard returns to zero articles and zero review items.

The reset deletes Creator article workspace content only: Articles,
Article Revisions, Article Contributors, Review Assignments, Review Comments,
Publication Jobs, Media Assets, and Audit Events. It keeps Demo Employees,
Editorial Role Assignments, Approval Policies, Categories, Tags, Site Settings,
and Redirects. Already-published Catalyst/public-site objects are not deleted by
this Creator reset.

## Incremental upgrade from v0.5.2

Add the `reset_editorial_test_content` function/API above, then upload the
v0.5.4 widget ZIP. No schema change is required.

## Incremental upgrade from v0.5.1

The v0.5.1 taxonomy correction has passed live save/reload testing. To install
the latest v0.5.4 release directly from v0.5.1:

1. Add `update_media_metadata` from
   `creator/functions/update_media_metadata.deluge` with the arguments below.
2. Create its private OAuth2 Custom API with the exact same link name.
3. Add `reset_editorial_test_content` and its private OAuth2 Custom API.
4. Upload the v0.5.4 widget ZIP.
5. Add a Caption during upload, save the draft, reload, then edit the Caption
   and reload again. Confirm both values remain and no verification error is
   shown.
6. For Caption-only public rendering of historical media, deploy
   `genedrift-catalyst-appsail-dev-v0.4.3-media-caption.zip` and the current
   `frontend/` build. This is not required to test the Creator widget fix.

No Creator schema change is required. Keep the existing `Credit` field for
historical compatibility; the widget no longer collects it and new public
output no longer renders it.

## Incremental upgrade from v0.5.0

If v0.5.0 and its first three APIs are already installed, only these additional
steps are required:

1. Replace `create_editorial_taxonomy_term` with the latest source so record IDs
   are returned as strings without JavaScript precision risk.
2. Add the `save_article_taxonomy` function and private OAuth2 Custom API defined
   below.
3. Upload the v0.5.1 widget ZIP.
4. Create a tag, apply it, save, reload the article, and confirm it remains
   selected before submitting another workflow test.

## Install in this order

### 1. Take a fresh Creator backup/export

Do not install state-changing functions until a current app export or equivalent
recoverable backup exists.

### 2. Confirm the schema choices

The current DS source already contains:

- `Articles.Workflow_State`: `Archived`
- `Articles.Archived_At`: Date-Time
- `Audit_Events.Entity_Type`: `Taxonomy`

If the live app was created from an older export, add the missing `Taxonomy`
choice to `Audit_Events.Entity_Type`. Do not rename existing link names.

### 3. Replace the updated functions

Update the live Creator functions from these source files:

- `functions/seed_editorial_configuration.deluge`
- `functions/submit_article_for_review.deluge`
- `functions/send_editorial_notification.deluge`

Run `seed_editorial_configuration` once after saving it. It now repairs the two
canonical policies as well as creating them when absent:

| Policy | Required approvals | Distinct reviewers | Default |
| --- | ---: | --- | --- |
| Standard Review | 1 | Yes | Yes |
| Regulated Review | 2 | Yes | No |

### 4. Add the lifecycle, taxonomy, media, and reset functions

Create these functions in the Default namespace with return type `map`:

| Function | Arguments |
| --- | --- |
| `archive_draft_article` | `articleId` (`int`) |
| `restore_archived_article` | `articleId` (`int`) |
| `create_editorial_taxonomy_term` | `termType` (`string`), `termName` (`string`) |
| `save_article_taxonomy` | `articleId` (`int`), `primaryCategoryId` (`string`), `tagIdsCsv` (`string`) |
| `update_media_metadata` | `mediaId` (`int`), `altText` (`string`), `caption` (`string`) |
| `reset_editorial_test_content` | `confirmation` (`string`) |

Paste the matching source from `creator/functions/`. Do not execute the archive,
restore, or reset functions directly against production records.

### 5. Add six private Custom APIs

Create one API for each function above. For all six use:

- Method: POST
- Authentication: OAuth2
- Argument type: Key and Value
- Request body content type: `application/json`
- User scope: All application users
- Function: Default namespace function with the same name
- Response: Standard

The Custom API link names must be exactly:

- `archive_draft_article`
- `restore_archived_article`
- `create_editorial_taxonomy_term`
- `save_article_taxonomy`
- `update_media_metadata`
- `reset_editorial_test_content`

The functions enforce authorization even though all application users can call
the authenticated endpoints:

- Owner, primary author, or Editorial Admin can move an eligible draft to Trash
  and restore it.
- Authors and Editorial Admins can create tags and edit active image metadata;
  an image uploader can also edit their uploaded image.
- Only Editorial Admins can create categories.
- Only a CEO or Editorial Admin can run the development reset, and only after
  submitting the exact confirmation phrase.

### 6. Upload the widget

Upload `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.4-refresh-reset.zip` to the
existing internal Creator widget and keep `/index.html` as its index file.

Open the production page at:

```text
https://creatorapp.zoho.in/piyugene02/genedrift-editorial-platform#Article_Workspace
```

### 7. Run the smoke matrix

Use separate mapped Creator logins; changing role rows on one account is not a
substitute for a role-isolation check.

1. Author
   - Create a draft without a category.
   - Create and apply a tag in the editor.
   - Save and reload; confirm the created tag remains selected with no code 3001
     error.
   - Add a cover and inline image with captions. Save/reload, edit each caption,
     save/reload again, and confirm both captions remain.
   - Select an inline image and verify size, alignment, edit, and remove controls.
   - Remove a cover and use Undo before saving.
   - Confirm Submit is blocked until content, excerpt, category, cover/alt,
     SEO title, and slug are ready.
   - Submit and use the confirmation panel to return to Dashboard.
2. Reviewer
   - Claim or open an assigned review.
   - Record a decision and verify Review next opens the next eligible item when
     one exists.
   - Confirm submitted content is read-only.
3. Editorial Admin
   - Create a category in New Article and in the editor.
   - Move a Draft to Trash, restore it, and confirm its revision and audit trail
     remain available.
   - Open Reset test content, confirm the destructive button remains disabled
     until `RESET TEST CONTENT` is typed, then cancel unless you are intentionally
     cleaning the development app.
   - Confirm the publishing-health and all-work views are visible.
4. Publisher
   - Publish an Approved article.
   - Confirm the success panel and Dashboard action.
   - Confirm failure/reconciliation rows remain visible when present.
5. Email
   - Trigger one review and one publishing notification.
   - Confirm the HTML renders, dynamic text is escaped, and the button opens the
     correct article in the migrated owner URL.

Verify corresponding `Audit_Events` rows for Trash, restore, taxonomy creation,
review, and publication actions.

## Development reset boundary

The reset is intentionally admin-only and confirmation-gated. Use it only in
development/demo Creator apps after a fresh backup. It cleans Creator editorial
test content but does not delete Catalyst immutable objects, Stratus media, or
public-site records already created by publishing. Use Catalyst maintenance
cleanup separately before a true public-site clean slate.
