# GeneDrift Editorial Widget

React and TypeScript editorial workspace embedded in Zoho Creator. The widget
uses TipTap for structured editing and Creator Widget SDK V2 for records and
file storage.

## Local development

```sh
npm install
npm run dev
```

Local development uses the seeded GeneDrift test article through an in-browser
mock repository. Creator SDK access is enabled automatically in production
builds when the widget is embedded in Creator.

## Build and package

```sh
npm run build
cd zet
../node_modules/.bin/zet validate
../node_modules/.bin/zet pack
```

The uploadable artifact is `zet/dist/zet.zip`. Set the widget index file to
`/index.html` in Creator.

## Widget parameter

The manifest declares one string parameter named `articleId`. Map this parameter
to the Creator page variable containing the target Articles record ID.

## Current vertical slice

- Load an Articles record by Creator ID
- Find or idempotently create Revision 1
- Connect the article's active-draft pointer
- Edit structured TipTap JSON
- Autosave the JSON file and revision metadata
- Maintain local recovery data during failed saves
- Reject stale writes across simultaneous tabs with a complete revision token
- Render a read-only preview
- Upload, preview, replace, remove, and edit article cover images
- Insert reusable inline-image blocks with required alt text and optional captions
- Resize, align, edit, and remove inline images directly in the editor
- Edit image metadata through a guarded Creator action that reliably persists captions
- Persist mock media in IndexedDB and Creator media in `Media_Assets`
- Select suggested reviewers or shared-queue review slots
- Submit a saved revision through the private Creator Custom API
- Lock submitted revisions and present reviewer claim, discussion, and decision UI
- Show a role-aware dashboard with review work, history, publishing queue,
  publish, and schedule actions
- Organize the dashboard as an editorial command center with visible Today,
  Articles, Reviews, Publishing, and Archive workspaces
- Refresh live dashboard checks every 30 seconds during active publishing and
  every minute otherwise, with clearer status text
- Prioritize role-specific attention counts and publishing failures on the
  dashboard
- Move eligible drafts to recoverable Trash and restore them without deleting
  revisions or audit history
- Reset development test content from an admin-only dashboard action after an
  exact confirmation phrase
- Create and apply tags inline; allow Editorial Admins to create categories
- Enforce a review-submission preflight and explain approval policies when a
  draft is created
- Show article workflow history, review feedback, and a comparison with the
  preceding revision
- Present clear post-action choices after submission, review, and publication

## Latest packaged release

`genedrift-editor-widget-support-v0.5.7-refresh-route.zip`

SHA-256:
`4868fce60fc067539e44ccca0418289f3ec36a3b62c9dd976ac5b9d180f30df3`

Live status: v0.5.5 input preservation is live-smoke verified in the migrated
`piyugene02` Creator app. v0.5.7 is packaged locally and must be uploaded before
retesting refreshed article routes and floating publishing notifications.

v0.5.7 uses Creator's explicit `#Page:Article_Workspace` route for dashboard and
article navigation so a browser refresh can reconstruct the page consistently.
It also supplies the callback that Creator's current V2 protected-image helper
invokes even though Zoho documents it as optional.

v0.5.6 moves publishing, schedule, retry, retraction, and in-workspace publish
outcomes into floating notifications with a Publishing dashboard action.
Ordinary editor notices remain inline.

v0.5.5 preserves author-entered category/tag names and image alt text instead
of collapsing internal whitespace, and verifies that Creator returns and stores
the exact image alt text and caption after metadata saves.

v0.5.4 keeps the role-aware Editorial Command Center: a visible workspace tab
bar, personalized Today summary, focused full-width list views, a dedicated
recoverable Archive, contextual search and filters, and less duplicated
dashboard content. It also changes live dashboard polling to 30 seconds during
active publishing, 1 minute while idle, and adds an admin-only development reset
button backed by the `reset_editorial_test_content` Custom API. It includes the
v0.5.2 media work, which saves Alt Text and Caption through the guarded
`update_media_metadata` Custom API, removes Credit from authoring/published
output, adds direct inline-image controls and reversible cover removal, and
uses newest Creator record ID as the fallback for Most recent dashboard order.

The matching Creator installation and smoke-test sequence is in
`../creator/WORKFLOW_POLISH_SETUP.md`.

## Creator media prerequisite

`Media_Assets.Draft_File` must be optional at the form level. Creator's add-record
API cannot set file-upload fields, so the widget creates the metadata record and
then uploads the file to that record. Missing files are rejected by editorial
publish validation instead of the form-level required setting.
