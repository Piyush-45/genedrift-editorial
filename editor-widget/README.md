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
- Insert reusable inline-image blocks with required alt text, captions, and credit
- Persist mock media in IndexedDB and Creator media in `Media_Assets`
- Select suggested reviewers or shared-queue review slots
- Submit a saved revision through the private Creator Custom API
- Lock submitted revisions and present reviewer claim, discussion, and decision UI
- Show a role-aware dashboard with review work, history, publishing queue,
  publish, and schedule actions

## Creator media prerequisite

`Media_Assets.Draft_File` must be optional at the form level. Creator's add-record
API cannot set file-upload fields, so the widget creates the metadata record and
then uploads the file to that record. Missing files are rejected by editorial
publish validation instead of the form-level required setting.
