# GeneDrift Manual Verification — 2026-08-30

Updated through: **2026-09-01**

Overall status: **Core workflow verified; release closure in progress.** The
editorial workflow, separate-role matrix, immediate publishing, and scheduled
publishing have passed. 2026-09-01 testing also visually passed the retraction
lifecycle, stale author-edit guard, public published visibility, and final
dashboard polish. Do not promote to a final production-ready claim until fresh
Creator DS audit, duplicate/idempotency stress evidence, media-format
validation, accessibility/public-site smoke checks, and measured scale evidence
are closed.

The consolidated remaining-test order and UX backlog are maintained in
`docs/PHASE_1_RELEASE_CLOSURE.md`.

## Current acceptance tracker

- `UAT-01 Complete Publishing Flow`: **Passed** - authoring, media persistence,
  review, approval, Creator callback, Catalyst publication, public API, and
  Vercel delivery.
- `UAT-02A Standard Review approval evidence`: **Passed** - cross-account
  submission, claim, read-only submitted revision, approval, review feedback,
  review history, and publishing-queue transition.
- `UAT-02B Changes Requested Flow`: **Passed** - request-changes decision,
  discussion comment, editable Revision 2 clone, resubmission, second
  request-changes decision, and editable Revision 3 clone.
- `ROLE-01 Reviewer-only Harshuu`: **Passed** - assigned review, no article
  work, disabled new article, read-only content/metadata, disabled save, comment
  persistence, terminal decision, review history, and no post-decision
  publishing controls.
- `ROLE-02 Author-only Anshika`: **Passed** - author-only badge, article create,
  draft save, submission, read-only In Review state, and no active review or
  publishing actions.
- `ROLE-03 Publisher-only Harshuu`: **Passed** - publisher-only badge,
  empty review/article work, approved queue visibility under `Queue`/`Publishing`,
  read-only open, review-action denial, Publish/Schedule actions visible, and
  scheduled-state transition observed.
- `ROLE-04 Editorial Admin non-owner`: **Passed** - admin-only badge and broad
  All-scope supervision across review, article, publishing, published, and
  retracted work.
- Separate-role denial tests: **Passed**.
- Scheduling and ordinary scheduled recovery: **Passed**. Forced duplicate
  handoff/reconcile remains an optional stress retest; approval/stale-context
  guard and retraction passed visually on 2026-09-01.
- `SCHED-02 Valid scheduled publication`: **Passed** - scheduled article moved
  through processing to Published and appeared on the public frontend. The
  article title `SCHED-01 Too-soon Schedule Rejection` is misleading because the
  chosen time was far enough ahead to be accepted.
- `SCHED-01 Too-soon schedule rejection`: **Passed** - under-two-minute schedule
  attempt showed `Scheduled publication must be at least two minutes in the
  future` and did not schedule the article.
- `RETRY-01 Scheduled Needs retry reconcile`: **Failed before fix / fixes
  prepared** - clicking Reconcile on scheduled `ROLE-03 Publisher-only` first
  returned the approved-revision-pointer guard error because the recovery path
  used the immediate publish API. After the Creator-side fix, Catalyst then
  returned `The given Cron name already exists`, proving duplicate scheduled
  cron creation also needed idempotent handling. Creator, Catalyst, and widget
  fixes were prepared.
- `RETRY-02 Scheduled Reconcile — 01 Sep 2026`: **Passed** - after the latest
  deploy, a fresh scheduled article stayed Scheduled before its due time and
  published at `01 Sep 06:04 AM` with Retract/Open actions visible.
- `RETRACT-01 Public removal` using `RETRY-02 Scheduled Reconcile — 01 Sep
  2026`: **Passed visually / optional HTTP-status evidence pending** - an
  Editorial Admin retracted the article with reason `testing retraction`. After
  refresh it disappeared from the public listing and search. Its former detail
  route shows a dedicated `This article has been retracted` page with the
  supplied reason instead of serving the article. Creator showed the retained
  Unpublished/Retracted record and no normal repeated published-state Retract
  action.
- `SAFETY-01 Stale Approval Guard — 01 Sep 2026`: **Passed visually** -
  submitted author context became read-only, approval/publishing proceeded from
  the approved revision, and the public route served the approved content.
- Dashboard final polish `v0.4.5`: **Passed build/package checks and first live
  visual check** - palette, ownership metadata, scheduled-time visibility,
  approved handoff text, dense-row spacing, and empty-state copy were updated.
- Accessibility/Lighthouse: **Pending**.
- Fresh Creator DS export audit: **Pending**.
- Measured 1,800-post load testing: **Pending**.

## Test MV-23 — Published article retraction

- Article: `RETRY-02 Scheduled Reconcile — 01 Sep 2026`.
- The article had previously completed scheduled publication at `01 Sep, 06:04
  AM` and appeared in the public Insights catalog.
- An Editorial Admin opened the Retract dialog and supplied reason `testing
  retraction`.
- After the retraction and refresh, the article no longer appeared in the public
  listing and could not be found using public search.
- Opening the former public detail route displayed a dedicated publication
  update page: `This article has been retracted`, the supplied reason, and a
  `Browse current insights` action. The public article body was not served.
- Creator showed the retracted article under Retracted articles with
  `Unpublished` status and immutable-publication wording. Opening an unpublished
  record retained the article body and review feedback without showing a usable
  second published-state Retract action.

### Result

- Public listing removal: **Passed**.
- Public search removal: **Passed**.
- Former-detail-route retraction experience: **Passed visually**. The HTTP
  status code was not captured by this screenshot.
- Creator Retracted/Unpublished state and duplicate second-retraction guard:
  **Passed visually**.
- Remaining optional evidence: capture the HTTP status code for the former
  public route if required for release sign-off.

## Test MV-24 — Stale approval guard

- Article: `SAFETY-01 Stale Approval Guard — 01 Sep 2026`.
- Anshika created the article and submitted it for review.
- After submission, the author editor showed `In Review`, Save Draft was not
  usable, and the right-side article fields were not editable from the old author
  context.
- After approval, the article appeared as `Approved` in the author's article
  list, then as `Published` in the author's Published articles panel at `01 Sep,
  06:29`.
- The public article route loaded the approved/submitted article content.

### Result

- Stale author edit prevention: **Passed visually**. The old author context did
  not allow editing after submission.
- Creator-side approved-to-published state: **Passed visually**.
- Public-side stale content check: **Passed visually**.

## Test MV-25 — Dashboard ownership and final visual polish

- Widget package: `genedrift-editor-widget-final-polish-v0.4.5.zip`.
- SHA-256:
  `1210fe55854a2aba1ebffa403c8c87e8a5097ea641e2d17ecbacb0bff0fae8ab`.
- The dashboard was restyled with the approved palette:
  dark deep purple `#241653`, primary purple `#5B3FD2`, light lavender
  `#F0EEFB`, white, dark grey, and very light neutral grey.
- Ownership metadata was added and then visually softened so rows can show who
  wrote, approved, scheduled, published, or retracted an article without
  requiring approval/rejection comments.
- Scheduled rows now expose scheduled date/time in general article rows, not
  only in the publishing queue.
- Approved rows now clarify that the article is waiting for publisher action.
- Dense dashboard rows were tightened for common laptop widths.
- User visual review after upload: `looks better now`.

### Result

- Dashboard final visual polish: **Passed first live visual check**.
- Remaining optional polish: review-feedback hierarchy, durable/dismissible
  recovery messages, calmer media-loading state, and consistent category/tag
  presentation across all article states.

## Test MV-01 — Image-bearing immediate publication

- Article UUID: `ART-b8f319fe6426809bb2b6a666030df281`
- Revision UUID: `REV-ART-b8f319fe6426809bb2b6a666030df281-0001`
- Creator publication job: `471741000000056088`
- Catalyst request: `req_94a10d7557592af82d9bf8012f28080d9c087795`
- Intent: `publish`
- Catalyst result: **Failed safely** after one attempt
- Error code: `CREATOR_MEDIA_DOWNLOAD_REJECTED`
- Error: Creator media `MED-d2cc8cc55c374e803e896df18e6e97d1`
  download returned HTTP 404.
- Creator media record: `471741000000064034`.
- Operator confirmed the media row exists in `Media_Assets_Report`, its
  `Draft_File` link is present, and the report/file link names in that URL are
  `Media_Assets_Report` and `Draft_File`.
- Operator confirmed deployed Catalyst Development currently has
  `CREATOR_ENVIRONMENT=development`, while the tested Creator record is visible
  in the live/default Production application URL.
- Snapshot object and checksum were created before the failure.
- Creator remained `Approved` and recorded failure-notification handoff event
  `EVT-NOTIFY-471741000000064030-1788105404805` for one recipient.

### Classification

- Editorial transition through approval: evidence supplied, exact preceding
  steps still to be confirmed by the operator.
- Media publication: **Failed**.
- Safe failure behavior: **Passed** — no false Published transition was shown,
  and the failure notification handoff ran.
- Root cause hypothesis: **Creator environment mismatch**. Missing media and
  incorrect report/file link names are ruled out. The official Creator API
  treats `environment: development` as a different record lane and uses
  Production when the header is omitted. Confirm by changing only the Catalyst
  Development variable to `production`, redeploying the same AppSail version,
  and publishing a fresh image-bearing article. Do not rewrite the terminal
  failed request.

## Test MV-02 — Fresh image-bearing publication after environment correction

- Operator changed the Catalyst Creator environment target and tested fresh
  articles.
- Dashboard titles observed: `India’s Digital Economy Is Entering Its Next Phase
  of Growth` and `testing for media error`.
- Creator returned: `One or more referenced media records are missing, failed,
  or archived.`
- Both articles remained displayed as `Processing` for several minutes even
  though the handoff validation had already returned an error.
- The operator could not correlate the new article image with a row in the Media
  Library. The supplied screenshot showed 16 existing Draft media rows.

### Confirmed defects

1. **Inline media identity mismatch:** the widget inserts Creator media record
   IDs into TipTap `mediaId` attributes and persists those values in
   `Referenced_Media_UUIDs`. The Creator handoff then queries
   `Media_Assets.Media_UUID` with those record IDs. The record can exist while
   the handoff reports it missing.
2. **Stuck publication state:** media validation returns before the handoff's
   rejection/exception state handling. The newly created `Publication_Jobs`
   record therefore remains Queued, which the dashboard presents as Processing.

### Product feedback recorded

- Category is read-only in the current article inspector and Tags are only
  displayed. Authors need editable category selection and tag assignment within
  the writing workspace.
- Review comments and decision summaries need a clean, persistent discussion/
  feedback presentation in the article UI, especially for Changes Requested,
  rather than being discoverable only inside the review-action dialog or
  dashboard history.
- Changes Requested feedback currently presents decision summary, decision entry,
  and discussion comment in a way that looks repetitive to authors. The data is
  present and functional, but the final client polish should make the labels and
  hierarchy clearer.

### Result

- Fresh media publication: **Failed**.
- Error visibility: **Partial pass** — the message was accurate but disappeared
  too quickly.
- Publication-state recovery: **Failed** — the jobs remained Processing.
- Further image-bearing publication testing is paused until both defects are
  corrected and the stuck test jobs are reconciled.

## Test MV-03 — Inline preview expires after upload

- Operator observed that a newly inserted image rendered briefly, then became a
  broken image box showing only its alt text. The TipTap image node itself was
  therefore retained; the preview source expired.
- Root cause: `mapMediaAsset` called Creator Widget SDK V2 `setImageData` on a
  temporary `Image` object, then copied the resulting `src` into TipTap. The SDK
  contract assigns host-returned image data to the supplied element; that source
  is not a durable application URL that should be copied to another element.
- Fix: prefer `FILE.readFile` and create a widget-owned object URL from the stored
  bytes. Creator host-wrapper, Blob, ArrayBuffer, typed-array, numeric-array, and
  string responses are handled. `setImageData` remains only as a compatibility
  fallback. A newly uploaded file also receives a separate widget-owned preview
  while autosave rehydrates it from Creator.
- The defect is in the Creator editor preview path. Catalyst is not involved until
  publish; all 29 Catalyst media/publication tests still pass.
- Widget TypeScript, production build, ZET validation, packaging, and ZIP archive
  integrity pass. Replacement package SHA-256:
  `cabb80d71ef1b73ae84a4156c166a491673b5820897db9ca8a36e3b5972fe811`.
- Live Creator upload and a harmless-image wait/save/reload smoke test remain
  required. Overall integration status remains **Unverified**.

## Test MV-04 — Sequential media save conflict

- After the stable-preview package was uploaded, both the new cover and inline
  image rendered correctly. Creator displayed the widget-generated error:
  `This draft changed in another tab or session.`
- A read-only live audit confirmed the two new `media testing1` files are present
  in Media Library as distinct `MED-*` rows, with populated Draft File, MIME,
  size, alt text, `Draft` status, and Piyush Tyagi as uploader. Media creation and
  file permissions therefore passed.
- The fresh server copy of article `471741000000063038` still had a blank revision
  and no cover because the stale-write guard rejected the revision save.
- Root cause: the save precondition performed one immediate report read. Creator
  can briefly expose the previous report version after a successful update, so a
  fast cover save followed by inline-image save could be misclassified as a
  second-tab overwrite.
- Fix: revision preconditions now wait through a bounded consistency window for
  the widget's last confirmed checksum/version. A real divergent version never
  matches and remains rejected, preserving multi-tab overwrite protection.
- TypeScript, production build, ZET validation, packaging and ZIP integrity pass.
  Replacement package SHA-256:
  `7f7a6f4dd57f6f744113e57248b0724b7bda631b058bfa95c52185c7a57fd783`.
- Live replacement and a fresh sequential cover/inline save/reload test remain
  required. Overall integration status remains **Unverified**.

## Test MV-05 — Saved media rehydrates as a broken image

- After the consistency package was uploaded, the same cover and inline-image
  workflow reached the green `Saved` state. Both images then rendered as broken
  boxes containing their alt text.
- This confirms that media creation and revision persistence now succeed. The
  remaining failure occurs when the saved revision is rehydrated from Creator.
- Root cause: Creator `FILE.readFile` can return an API file reference (including
  `/api/v2/`, `/api/v2.1/`, and `/publishapi/v2/` paths) or a nested URL wrapper.
  The widget treated an unrecognized string response as raw binary bytes and
  generated an invalid Blob image.
- Fix: recognize Creator API file references and resolve them through Widget SDK
  V2 `UTIL.setImageData`; recognize URL/file-path response wrappers; and, where
  readable, copy the resolved image into a widget-owned Blob URL so it remains
  valid for the editor session.
- TypeScript, production build, ZET validation, packaging, and ZIP integrity pass.
  Replacement package SHA-256:
  `413927f23f6dc6802f6c9e83b9cc531a67caf5a45b6ef285816b1ca322bf8870`.
- Live replacement and a fresh cover/inline save, wait, and reload test remain
  required. Overall integration status remains **Unverified**.

## Test MV-06 — Cross-browser stored-media failure

- The replacement was tested in Safari and Arc under separate Creator accounts.
  In both browsers, the local upload preview appeared briefly and the stored
  image disappeared or became a broken alt-text box after save/reload.
- Arc also showed the guarded stale-session warning once; a hard reload cleared
  that warning, after which the same stored-image failure remained. This confirms
  the media defect is independent of browser cache and the save warning.
- The previous fix still copied a Creator-resolved source from a temporary image
  element. When the editor re-rendered, the replacement image element attempted
  to reuse that protected source instead of requesting a fresh one.
- Fix: persisted Creator image references now use an internal protected-source
  marker. Cover, dialog, and TipTap node-view images pass their actual persistent
  DOM element to Creator Widget SDK `UTIL.setImageData` on every render/reload.
  Temporary resolved Creator URLs are no longer copied between elements.
- TypeScript, production build, ZET validation, packaging, bundle inspection, ZIP
  integrity, and `git diff --check` pass. Replacement package SHA-256:
  `7539085845948824a40cad45bcce1d978367ad21c5236154405a9fc6e366eb5f`.
- Live replacement and a fresh cover/inline save, wait, and reload test remain
  required. Overall integration status remains **Unverified**.

## Test MV-07 — Cover passes; inline node fails at autosave

- With the protected-source package, the cover image remained visible after
  autosave while the inline image disappeared at the exact autosave transition.
- This passes Creator media storage and the mounted cover-image SDK loader. It
  narrows the failure to TipTap's inline media node lifecycle rather than the
  Creator record, file field, account, browser, or generic image loader.
- Fix: replaced the imperative TipTap media node with a React node view. Its
  `CreatorImage` effect runs only after the final inline `<img>` is mounted, so
  `UTIL.setImageData` receives the persistent element that remains in the editor
  after autosave replaces the document.
- TypeScript, production build, ZET validation, packaging, and ZIP integrity pass.
  Replacement package SHA-256:
  `af854c48fd03dd6ec0da7f0b951e4c53fe791324b7ce95aac95f4f55eebc4c67`.
- Live inline-image autosave and reload confirmation remain required. Overall
  integration status remains **Unverified**.

## Test MV-08 — Inline UUID lookup differs from passing cover lookup

- The React node-view package still showed the inline image before autosave and
  lost it after autosave, while the cover remained visible in the same saved
  workspace.
- The two paths differed at media retrieval: featured media used Creator
  `getRecordById`, while inline media rehydration resolved its portable `MED-*`
  UUID from a list-query record. The list response can expose a display-only file
  field value rather than the protected download value used by `setImageData`.
- Fix: after resolving an inline `MED-*` UUID, re-fetch that media by its Creator
  record ID before mapping the file. Cover and inline media now use the identical,
  already-proven record/file retrieval path.
- TypeScript, production build, ZET validation, packaging, ZIP integrity, and
  `git diff --check` pass. Replacement package SHA-256:
  `fd7cc1bf5623590097076ac65181d348e0396e0498a5a9e062ce3050c6e4e673`.
- Live inline autosave/reload confirmation remains required. Overall integration
  status remains **Unverified**.

## Test MV-09 — Fresh inline UUID is not immediately queryable

- The latest screenshot again showed the new inline preview until autosave while
  the cover survived. The document was therefore replaced before Creator's report
  criteria could reliably resolve the freshly created `MED-*` UUID.
- Fix: inline nodes now persist both identities: the portable `MED-*` UUID used by
  Catalyst and the Creator numeric record ID used only for editor hydration. The
  first autosave loads directly by record ID and no longer depends on eventual
  consistency of a UUID list query. The UUID remains the only value written to
  `Referenced_Media_UUIDs` for publication integrity.
- Inline metadata editing also uses the numeric Creator record ID, while old
  documents without the new attribute retain the UUID compatibility path.
- TypeScript, production build, ZET validation, packaging, ZIP integrity, and
  `git diff --check` pass. Replacement package SHA-256:
  `35100750e0f85eaa709350993608984ce6c1485b3fb38a69b9a10ddd54ce38dd`.
- A newly uploaded inline image must pass autosave and reload before media is
  accepted. Overall integration status remains **Unverified**.

### Live result

- **Autosave persistence passed:** a newly uploaded inline image briefly blinked
  during autosave, then returned and remained visible with the workspace in the
  green `Saved` state.
- **Reload and cross-account persistence passed:** the submitted article and its
  inline and cover images loaded in Anshika Tyagi's separate Reviewer session.
  This confirms the displayed media is stored Creator content, not an author-tab
  local Blob preview.
- **Visual continuity remains open:** the autosave-driven transition from the
  local preview to Creator's protected stored source and the initial protected
  cross-account load cause a momentary missing-image/flicker state.
- **MV-09 functional media persistence: Passed.** The loading-state polish remains
  open and does not change overall integration status, which is **Unverified**.

## Test MV-10 — False metadata conflict after same-session autosave

- A Draft article owned by Anshika Tyagi showed `Save failed` with:
  `This draft metadata changed in another tab or session.` The operator confirmed
  that no second editable copy was open; a different Creator account was only
  viewing/reviewing content.
- Read-only live inspection confirmed the server revision remained safely stored
  as Draft with its 2,051-word body, cover-media reference, SEO metadata, checksum,
  and referenced-media UUID. The newly entered excerpt had not reached the server,
  so the browser recovery copy remains the source for that unsaved field.
- Root cause: a queued autosave could begin with the widget's preceding metadata
  token after Creator had already exposed a newer non-body field value. The old
  all-or-nothing token comparison treated that same-session propagation as an
  external edit.
- Fix: the save precondition now performs a three-way metadata comparison using
  the loaded base token, current Creator record, and local draft. Non-overlapping
  metadata changes are merged. Body/checksum changes, media-reference changes,
  workflow-state changes, and same-field divergent edits remain blocked.
- TypeScript, production build, ZET validation, packaging, bundle inspection,
  ZIP integrity, and `git diff --check` pass. Replacement package SHA-256:
  `cfae8494d8d848937af7920f16402a4a34372c0c96c4fe1ff9e2183e95743b13`.
- Live upload and recovery/save confirmation remain required. Overall integration
  status remains **Unverified**.

## Test MV-11 — Taxonomy saved but readback verification failed

- The widget showed `Creator did not verify the saved category and tags` after
  selecting Industry and Market Insights plus Cosmetics and Dossiers.
- A read-only live check of the affected Creator record confirmed that the
  category and both tags were actually stored. The failure was therefore in the
  widget's readback verification, not the update itself.
- The first attempted correction sent multi-select lookup IDs as the REST API's
  documented comma-separated value and relaxed only an omitted Tags readback.
  Live embedded-widget testing later showed that the Widget SDK rejects that
  payload shape with code 3001; see MV-12.
- The desktop writing layout now gives more width to the article, reduces unused
  side padding and wraps toolbar groups when necessary. Local visual verification
  at 1280px showed Undo through Align Right and the revision indicator without
  clipping.
- TypeScript, production build, ZET validation, packaging, ZIP integrity, and
  `git diff --check` pass. Replacement package SHA-256:
  `b6f5d9b24c3e2a31f1eb41c050983d6277d739daf16d3d9cab7f4da5b6e51ba0`.
- Live taxonomy save/reload and Creator-embedded toolbar confirmation remain
  required. Overall integration status remains **Unverified**.

## Test MV-12 — Embedded Widget SDK rejects REST-style tag payload

- The MV-11 package returned `Save article category and tags failed with code
  3001` immediately after a taxonomy edit.
- Root cause: category/tag persistence was coupled to every revision autosave,
  and the embedded Widget SDK rejected the newly introduced comma-separated tag
  value. Earlier live evidence had already proven that this runtime accepts an
  array of tag record IDs.
- Fix: restored the live-proven ID-array payload and separated taxonomy dirtiness
  from revision dirtiness. Body, excerpt, SEO and media continue to autosave;
  category and tags are sent only after the user actually changes taxonomy.
- A taxonomy failure remains retryable through Save draft and does not clear its
  dirty state. Local recovery still includes the selected category and tags.
- TypeScript, production build, ZET validation, packaging, ZIP integrity, and
  `git diff --check` pass. Replacement package SHA-256:
  `7d3f090566140f48444f63d0afcbfdfa58097518cff9f678209c7d9b0d8006e9`.
- Live taxonomy save/reload confirmation remains required. Overall integration
  status remains **Unverified**.

## Test MV-13 — Full media, taxonomy, review, and immediate-publish flow

- Article UUID: `ART-dc7ce0522b7275a39a5421a0f7c47d56`.
- Revision UUID: `REV-ART-dc7ce0522b7275a39a5421a0f7c47d56-0001`.
- Idempotency key:
  `PUB-ART-dc7ce0522b7275a39a5421a0f7c47d56-REV-ART-dc7ce0522b7275a39a5421a0f7c47d56-0001`.
- The operator restored the local recovery copy, added body content, selected
  multiple tags, changed category, waited for `Saved`, made a second body and
  taxonomy change, submitted, and completed a claimed cross-account review with
  a comment and approval.
- Creator accepted Publish at `2026-08-31 15:22:06` IST with HTTP 202. The
  maintained Catalyst public index records publication at
  `2026-08-31T09:52:08.046Z` (`15:22:08.046` IST), approximately two seconds
  later.
- The authoritative public record contains the final body sentence, category
  `Regulatory Affairs`, tags `Drugs`, `Medical Devices`, `Cosmetics`, and
  `Dossiers`, and a content-addressed featured-media Stratus URL.
- Vercel returned HTTP 200 for
  `/insights/dekhti-hai-yeh-nighaeen`, and the rendered response contains the
  final body, category, and tags.
- Creator remained `Processing` with HTTP 202 after refresh. Catalyst callback
  `callback_b531d3e9f0295fafe7f4b571162d4a1d805a0957` is `DeadLetter` after eight
  attempts with `Published media callback contains an invalid mapping.`
- The immutable object contains two otherwise valid media mappings, including
  stable media UUIDs, numeric Creator record IDs, SHA-256 checksums, immutable
  object keys, and HTTPS Stratus URLs. The rejection is therefore confined to
  Creator callback decoding/validation, after the public commit.
- Prepared Creator callback validation that resolves media by stable
  `Media_UUID` and treats the nested numeric record ID as optional. Prepared
  AppSail `0.4.1` terminal-callback replay: a duplicate idempotent handoff reopens
  the existing dead letter and retries it without writing another version or
  advancing the pointer.
- Local Catalyst regression suite: **30/30 passed**. Deployable AppSail package:
  `genedrift-catalyst-appsail-dev-v0.4.1.zip`, SHA-256
  `1d4b35fdded678f36651678ea3d5244775e434f504e4965ebe8a4b971b987b9a`.
- AppSail `0.4.1` is now confirmed live from the Development health endpoint.
  Deployment alone does not reopen an existing dead-letter event; Creator job
  `471741000000063130` still requires one idempotent handoff replay.

### Result

- Recovery, media persistence, sequential autosave, taxonomy save, cross-account
  review/comment/approval, immediate worker execution, immutable media promotion,
  maintained public index, and Vercel serving: **Passed**.
- Creator callback/final status evidence: **Failed safely; correction deployed,
  one-job replay and final evidence pending**.
- Overall integration remains **Unverified** until the remaining Development
  matrix, fresh Creator DS audit, and separate-role negative tests pass.

## Test MV-14 — UAT-02 setup completed through Standard Review approval

- Article: `UAT-02 Changes Requested Flow — 31 Aug 2026`.
- Submission to Anshika Tyagi succeeded and produced the expected email
  notification. Creator showed the article In Review.
- The submitted revision was read-only for the author and reviewer. Cover and
  inline media loaded in the separate reviewer session, and the reviewer claim
  succeeded.
- The reviewer selected Approve, so the article correctly became Approved and
  entered the Publisher/Admin publishing queue.
- The screenshot showed `No comments yet` in the Discussion area. The visible
  review text was in Decision Summary, so a separately saved discussion comment
  has not yet been evidenced.
- Follow-up screenshots confirm the same Decision Summary is visible in the
  article's Review feedback panel and in Anshika Tyagi's Review history/activity
  entry.

### Result

- Submission, notification, cross-account read-only/media, claim, approval,
  review-feedback visibility, review-history visibility, and publishing-queue
  transition: **Passed**.
- Changes Requested, Revision N+1 cloning, discussion-comment persistence, and
  resubmission: **Not exercised**. Continue these on a fresh test article and do
  not alter or delete this Approved record.
- Overall integration remains **Unverified**.

## Test MV-15 — UAT-02B Changes Requested N+1 loop

- Article: `UAT-02B Changes Requested Flow — 01 Sep 2026`.
- The reviewer account, Anshika Tyagi, showed the item in Review history with
  decision `Changes Requested`, source `Author Suggested`, and the standalone
  discussion comment `UAT02B-DISCUSSION-COMMENT`.
- The author account reopened the article after the first request-changes
  decision. Creator showed state `Changes Requested`, an editable workspace, and
  `Revision 2`.
- The cloned draft retained the original body marker `UAT02B-R1-ORIGINAL` and
  the cover/inline media remained visible.
- The article Review feedback panel showed the reviewer decision summary,
  decision entry, and general discussion comment for the reviewed revision.
- The author edited the Revision 2 draft and resubmitted it for review. The
  reviewer then claimed/reviewed Revision 2, added discussion comment
  `i want these changes`, entered decision summary `not approved`, and selected
  Request changes.
- The author account reopened the article after the second request-changes
  decision. Creator again showed state `Changes Requested`, an editable
  workspace, and `Revision 3`, with both request-changes feedback cards visible.

### Result

- Request-changes decision, discussion-comment persistence, N+1 draft cloning,
  media carry-forward, author editability after changes requested, resubmission,
  and a second N+1 request-changes cycle: **Passed**.
- Product feedback: the Review feedback panel is functionally correct but
  visually confusing because decision summary, decision entry, and discussion
  comment appear as repeated stacked messages. Improve labels and hierarchy
  during final UI polish.
- Overall integration remains **Unverified** until the remaining Development
  matrix, fresh Creator DS audit, and separate-role negative tests pass.

## Test MV-16 — ROLE-01 Reviewer-only Harshuu denial check

- Article: `ROLE-01 Reviewer-only Denial`.
- Harshuu was adjusted to remove mixed Publisher access and duplicate active
  Reviewer rows before the test.
- Harshuu's dashboard showed one assigned review item, zero active articles,
  zero review history entries, and no article work.
- The `New article` action was visible but disabled, satisfying the expected
  reviewer-only authoring denial as long as it remains non-actionable.
- Opening the assigned article showed state `In Review`. The submitted body
  marker `ROLE01-HARSHUU-REVIEWER-ONLY` was visible.
- The operator reported the article body was not editable, the right-side
  metadata fields such as excerpt/tags were not editable, and `Save draft` was
  disabled.
- Harshuu claimed the review and added standalone discussion comment
  `ROLE01-REVIEWER-CAN-COMMENT`. The comment appeared in both the article Review
  feedback panel and the review dialog before any terminal decision.
- Harshuu recorded a terminal approval decision. The reviewer-only dashboard then
  showed zero review inbox items, zero active article work, review history with
  the approved decision, `My approvals` count updated to one, and no usable
  Publish, Schedule, or Retract actions.

### Result

- Assigned review access, read-only submitted article, authoring denial,
  disabled save, empty article work, reviewer comment persistence, terminal
  reviewer decision, closed review history, and post-decision publishing denial:
  **Passed**.
- Product feedback: the `New article` action is visible but disabled for the
  reviewer-only user. This is permission-safe, but can be hidden during final UI
  polish if the client prefers less visual noise.
- Overall integration remains **Unverified** until the full separate-role matrix,
  remaining Development tests, fresh Creator DS audit, and measured scale checks
  pass.

## Test MV-17 — ROLE-02 Author-only Anshika denial check

- Article: `ROLE-02 Author-only Denial — 01 Sep 2026`.
- Anshika Tyagi was adjusted to show only the active `Author` role for this
  check.
- The author-only account could create a fresh article, save draft content,
  attach/retain an inline image in the editor, select category/tags, and submit
  the article for review.
- After submission, Creator displayed success message `Article submitted for
  review. 1 assignment created.` and the article state changed to `In Review`.
- The submitted article was no longer editable for the author. The operator
  observed no review decision controls such as claim, approve, request changes,
  or reject.
- The author dashboard showed the active In Review article in Article work and
  no usable Publish, Schedule, or Retract actions.
- Historical review-history cards from Anshika's previous reviewer role remained
  visible. Treat those as historical records only; they are not current active
  reviewer authority.

### Result

- Author-only create, save, submit, submitted-state read-only lock, review-action
  denial, and publishing-action denial: **Passed**.
- Overall integration remains **Unverified** until the full separate-role matrix,
  remaining Development tests, fresh Creator DS audit, and measured scale checks
  pass.

## Test MV-18 — ROLE-03 Publisher-only Harshuu partial check

- Article: `ROLE-03 Publisher-only`.
- Harshuu was adjusted to active Publisher-only for this check.
- The publisher-only dashboard showed the `Publisher` badge, zero review inbox
  items, zero active article work, and zero current review history entries.
- Under the default `Mine` scope, the Publishing queue showed no open work
  because Harshuu does not own the articles.
- Switching to `Queue` scope exposed the expected approved publishing work. The
  `Publishing` tab showed six ready items, including `ROLE-03 Publisher-only`,
  with visible `Publish`, `Schedule`, and `Open` actions.
- Harshuu opened the approved article and observed no review controls such as
  claim, approve, request changes, or reject.
- The operator clarified that the publisher-only account could not edit the
  opened article or persist content/metadata changes.
- Harshuu scheduled `ROLE-03 Publisher-only` for `01 Sep, 01:55`. The queue then
  showed that row as `Scheduled`, with schedule text `scheduled 01 Sep, 01:55`
  and no immediate Publish/Schedule buttons on that row.

### Result

- Publisher-only badge, review-action absence from inbox, empty authoring work,
  approved publishing queue visibility under `Queue`/`Publishing`, review-action
  denial, read-only open, publishing actions, and scheduled-state transition:
  **Passed**.
- The timed scheduled-publication execution remains in progress as a publishing
  workflow test, separate from the publisher-only permission result.
- Overall integration remains **Unverified** until the full separate-role matrix,
  remaining Development tests, fresh Creator DS audit, and measured scale checks
  pass.

## Test MV-19 — ROLE-04 Editorial Admin non-owner visibility

- Account: Harshuu.
- Harshuu was changed to include `Editorial Admin`, but the dashboard header also
  showed active `Publisher`. This is useful mixed admin/publisher evidence but
  does not satisfy the clean admin-only matrix slot.
- With `All` scope selected, the dashboard showed broad supervisory access:
  27 articles, 18 review items, queued review work, active article work,
  publishing queue, and published articles with Retract actions.
- The scheduled `ROLE-03 Publisher-only` row remained visible in the publishing
  queue with `Scheduled` state and schedule text `scheduled 01 Sep, 01:55`.
- Harshuu's active Publisher role was then removed/expired. After refresh, the
  dashboard header showed only `Editorial Admin`.
- With only `Editorial Admin` active, `All` scope still showed broad
  supervisory access: 27 articles, 18 review items, two queued review items, 14
  active article items, four approved/publishing items, five published articles
  with Retract actions, three retracted articles, and closed review history.

### Result

- Clean non-owner `Editorial Admin` visibility and supervision: **Passed**.
- Overall integration remains **Unverified** until the full separate-role matrix,
  remaining Development tests, fresh Creator DS audit, and measured scale checks
  pass.

## Test MV-20 — SCHED-02 valid scheduled publication

- Article: `SCHED-01 Too-soon Schedule Rejection`.
- Despite the title, this was not a true too-soon rejection test because the
  selected schedule time was `01 Sep, 01:11`, far enough ahead to be accepted.
- The article was authored from Anshika's author-only account, approved from the
  ZTM/Admin account, and then scheduled.
- The scheduled row was visible to the relevant publishing/admin queues, entered
  a Processing state, and then completed publication.
- The public frontend showed the article in the Insights listing with title
  `SCHED-01 Too-soon Schedule Rejection`.
- Creator's Published filter showed the same article as `Published`, with
  publish time `01 Sep at 01:11 AM` and a Retract action available.

### Result

- Valid scheduled-publication execution through Creator and public frontend:
  **Passed**.
- Product feedback: an author's `Mine` view focuses owned active work, while
  Approved content moves toward publisher workflow. If the client expects newly
  approved authored work to be more obvious to the author, the dashboard should
  make that handoff clearer.
- Overall integration remains **Unverified** until retry/idempotency,
  stale-revision, retraction, fresh Creator DS audit, accessibility, and measured
  scale checks pass.

## Test MV-21 — SCHED-01 too-soon schedule rejection

- Article selected from an Approved publishing-queue row:
  `UAT-02 Changes Requested Flow — 31 Aug 2026`.
- The operator opened the Schedule dialog and entered `01/09/2026, 01:17 AM`,
  less than two minutes ahead of the current time.
- The dialog showed validation error `Scheduled publication must be at least two
  minutes in the future.`
- The article remained unscheduled/Approved in the queue; no publication handoff
  was started from this invalid attempt.

### Result

- Too-soon schedule prevention: **Passed**.
- Overall integration remains **Unverified** until retry/idempotency,
  stale-revision, retraction, fresh Creator DS audit, accessibility, and measured
  scale checks pass.

## Test MV-22 — RETRY-01 scheduled Needs retry reconcile

- Article: `ROLE-03 Publisher-only`.
- Prior evidence: the article was scheduled for `01 Sep, 01:55` and shown as
  `Scheduled` in the publishing queue.
- The dashboard later showed the row as `Needs retry` with message
  `publication completed but Creator has not confirmed the callback`.
- Clicking Reconcile returned `Only an article with an approved revision pointer
  can be published.`
- After the Creator function was updated locally and retested live, Reconcile
  progressed into Catalyst handoff but returned `The given Cron name already
  exists. Please give a different name`.
- The article then appeared back as Approved/ready for publisher action with the
  Publish button, so this specific record is no longer a clean scheduled-retry
  row for final retest evidence.

### Classification

- This is **not** a failure of the normal scheduled-publish flow; `SCHED-02`
  already proved a scheduled article can reach Creator Published and the public
  frontend.
- This is a **two-layer recovery-path defect**:
  1. Reconcile for a stale Scheduled job was routed through the immediate
     approved-publish guard.
  2. Once the existing schedule job was redelivered, Catalyst treated duplicate
     one-time cron creation as a hard error instead of an idempotent replay.
- The dashboard also exposed Reconcile too early for a future scheduled job. A
  Schedule job accepted by Catalyst but not yet due should remain displayed as
  Scheduled, not as Needs retry.

### Fix prepared

- Local Creator function source updated:
  `creator/functions/publish_approved_article.deluge`.
- The function now allows a `Scheduled` article with an approved revision pointer
  and an existing open Schedule job to redeliver that same job through
  `handoff_publication_to_catalyst`.
- The fix intentionally does not create another publication job or bypass the
  approved-revision requirement.
- Local Catalyst source updated: `catalyst/src/adapters/catalyst.ts`.
- Catalyst now treats the observed duplicate Job Scheduling cron error as
  idempotent for the same generated cron name.
- Regression coverage added in `catalyst/test/publishing.test.ts`.
- Local Catalyst verification: `npm test` passes 31/31 tests.
- Local widget source updated: `editor-widget/src/App.tsx`.
- Future scheduled rows are no longer counted as Processing/Needs retry before
  their due time, and the publishing queue summary can count Scheduled rows
  separately.
- Local widget verification: `npm run typecheck` passes.
- Live retest `RETRY-02 Scheduled Reconcile — 01 Sep 2026` was scheduled for
  `01 Sep, 06:04`. At `06:03`, the Articles view showed the row as `Scheduled`
  rather than `Needs retry`, supporting the pre-due scheduled-display fix.
- At `06:04`, the same article moved to Published. The All Articles list showed
  the row as `Published`, and the Published Articles panel showed it with
  publish time `01 Sep at 06:04 AM` and the expected Retract/Open actions.

### Product polish

- A Scheduled row in the Articles view currently shows only the `Scheduled`
  badge. Add the scheduled date/time beside the badge or in the row subtitle, for
  example `Scheduled for 01 Sep, 06:04`, so publishers/admins do not need to open
  the article or switch panels to know when it will publish.

### Retest

- Update the live Creator `publish_approved_article` function from the local
  source.
- Deploy the updated Catalyst AppSail package containing the duplicate-cron
  idempotency fix.
- Rebuild/reupload the updated Creator widget so future scheduled rows keep the
  Scheduled display instead of exposing Reconcile early.
- Use a fresh or controlled scheduled retry row; `ROLE-03 Publisher-only` already
  rolled back to Approved after the live duplicate-cron failure.
- Expected result: no approved-pointer guard error and no duplicate-cron error.
  The row should either report that Catalyst has accepted/is processing the
  existing job, or move into the normal reconciled Published state after callback
  confirmation.

### Result

- Fresh scheduled publication after recovery fixes: **Passed**.
- Forced duplicate/reconcile recovery: **Pending optional stress retest**. The
  earlier `ROLE-03 Publisher-only` record remains valid defect evidence but is
  not a clean post-fix retest because it rolled back to Approved before the
  Catalyst duplicate-cron fix was deployed.
- Overall integration remains **Unverified** until retry/idempotency,
  stale-revision, retraction, fresh Creator DS audit, accessibility, and measured
  scale checks pass.
