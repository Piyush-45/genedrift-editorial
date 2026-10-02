# Work Log

## 2026-09-07 - Phase 2 handoff and CMS architecture consolidated

- Added `docs/CURRENT_CHECKPOINT_2026-09-07.md` as the new first-read context for
  the next chat, whose active task is applying client feedback to the Phase 2
  website concepts.
- Consolidated the website editing plan into a structured Website Workspace:
  nine IA areas, about 14 reusable frontend page families, a provisional 37–46
  curated launch-page range, 17 underlying website content/governance record
  types, and 7–8 client-facing workspace areas.
- Kept Insights in the existing Article Workspace and specified forms,
  relationships, controlled sections and real preview for ordinary website
  pages. The first CMS implementation remains a Home vertical slice through
  Creator, Catalyst and Next.js.
- Updated HANDOFF and STATUS resume pointers. No Creator, Catalyst, widget or
  public frontend source was changed as part of this documentation closure.

## 2026-09-06 - Cross-account workflow test and OAuth publishing support

- Added ZTM as a separate Creator application user with platform role
  `Editorial Author` and permission `Write`, then assigned internal Author and
  Reviewer responsibilities.
- Piyu submitted `testing role based acess version -v` to ZTM. ZTM opened the
  revision read-only, claimed and approved it. Piyu saw the resulting Approved
  publishing queue item and matching audit/notification activity.
- Added Publisher internally to ZTM for capability testing. The ZTM dashboard
  then exposed Publish and Schedule controls for the approved item. The test was
  an assigned-review case; it did not freshly exercise a shared-queue claim.
- Diagnosed article refresh failures. Expired Creator browser authorization
  first produced HTTP 401/code 2945/Z223. The explicit
  `#Page:Article_Workspace?...` route reconstructed refreshed detail state more
  reliably than the shortened hash route. The prepared v0.5.7 widget package
  remains without captured live-upload evidence.
- Publish request for `test with Akshay 2`, revision 2, was accepted with HTTP
  202 but remained Processing in Creator. Catalyst request
  `req_23feb000c4517b7790cdfef39a93eddd66885ada` showed RetryScheduled,
  attempt 3 and `CREATOR_OAUTH_REFRESH_FAILED` / HTTP 200.
- Identified the failure as a missing usable `access_token` from the Creator
  OAuth refresh response, commonly caused by placing a temporary Self Client
  code in the refresh-token variable. The operator generated and exchanged a
  new India Self Client code, updated Catalyst and redeployed the current
  `genedrift-catalyst-appsail-dev-v0.4.3-media-caption.zip` package.
- The operator reported remediation complete, but the final Catalyst request,
  Creator Succeeded state and public URL were not captured in this chat.

## 2026-09-05 - Revised design reference redirect deployed

- Added the temporary public redirect `https://genedrift.site/revised-designs`
  to `https://starlit-gumption-65a19b.netlify.app/meridian/`.
- Frontend typecheck and production build passed before deployment.
- Deployed the current frontend to the existing linked Vercel project
  `genedrift-vercel-preview-0.4`; Vercel aliased the deployment to
  `https://genedrift.site`.
- Live verification passed: the new route returns HTTP 307 with the intended
  Netlify destination, the followed destination returns HTTP 200, and both the
  homepage and `/insights` continue to return HTTP 200.
- A user-supplied non-expiring Vercel access token was used only in a hidden
  deployment-session variable and was unset locally after deployment. It should
  be revoked in Vercel after this deployment.

## 2026-09-05 - Dashboard refresh and development reset packaged

- Clarified the dashboard live status so it shows the automatic check interval
  and the last refresh without contradictory `updated 1m ago / every 5s` copy.
- Slowed active publication polling from 5 seconds to 30 seconds and set idle
  dashboard polling to 1 minute.
- Added an admin-only Reset test content button with an exact
  `RESET TEST CONTENT` confirmation phrase.
- Added guarded Creator function
  `creator/functions/reset_editorial_test_content.deluge`. It deletes Creator
  article workspace test content while preserving users, roles, policies,
  taxonomy, site settings, and redirects.
- TypeScript, production build, ZET validation, ZET packaging, and ZIP integrity
  pass.
- Packaged
  `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.4-refresh-reset.zip`,
  SHA-256
  `091f7bff1877b963b71ef1b5bc937840b10ea10dfe56dd7eb98af073a65b4d42`.
- Upgrading from v0.5.3 requires one new private Custom API:
  `reset_editorial_test_content`.
- User uploaded v0.5.4, added the matching function/API, and verified the live
  dashboard reset returns the migrated `piyugene02` Creator app to a clean
  zero-count workspace. Full role-by-role smoke testing after reset remains
  pending.
- After Creator reset, the user cleaned the Catalyst/public side for orphaned
  development posts `editable-tags-checking`, `smoke-test-1`, and `hanumaaaan`;
  the public frontend no longer shows those posts. Future durable cleanup should
  keep `GD_Public_Index` and `GD_Published_Pointers` in sync by `Article_UUID`.

## 2026-09-04 - Editorial Command Center dashboard packaged

- Replaced implicit metric-card navigation with visible role-aware Today,
  Articles, Reviews, Publishing, and Archive workspace tabs; avoided adding a
  second sidebar beside Zoho Creator navigation.
- Added a personalized Today summary, contextual search/filter controls, compact
  connected attention metrics, and focused full-width operational list views.
- Consolidated removed drafts into a dedicated recoverable Archive and removed
  duplicate Published, Retracted, Trash, and review-history panels from
  unrelated dashboard views.
- Added responsive overflow, keyboard focus treatment, and reduced-motion
  behavior. TypeScript, production build, ZET validation, mock visual checks,
  and ZIP integrity pass.
- Packaged
  `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.3-command-center.zip`,
  SHA-256
  `dfd448e1ed812ebc091d3de0f6e2f817f5c7c8721095117bb71322b27eb56b6a`.
- Upgrading from v0.5.2 requires only this widget ZIP. Upgrading directly from
  v0.5.1 still requires the `update_media_metadata` function and private Custom
  API introduced for v0.5.2.

## 2026-09-04 - Media polish and newest-first drafts packaged

- Confirmed from live testing that Alt Text persisted but Caption could be
  silently dropped or end in `Creator did not verify the updated image details`.
- Added guarded `update_media_metadata` Deluge persistence for Alt Text and
  Caption and routed both new uploads and later edits through it.
- Removed Credit from the authoring UI and new public Caption rendering while
  retaining the Creator field and historical payload shape for compatibility.
- Added live Caption preview, no-change save protection, stable dialog scrolling
  and save states, inline image size/alignment/edit/remove controls, and Undo for
  cover removal.
- Added descending Creator record ID as the fallback for Most recent article
  sorting, preventing timestamp-less drafts from reverting to title order.
- Added publishing regression coverage proving Caption renders and Credit does
  not. Widget, Catalyst, and frontend type checks/builds pass; all 31 Catalyst
  tests pass; local mock Caption edit/reopen and cover Undo checks pass.
- Packaged
  `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.2-media.zip`,
  SHA-256
  `8ea5fba0d89489e660c7591cd1ca947a0fd5260a127fd2940adf36d0ae04cb92`.
- Packaged the matching Caption-only inline renderer as
  `genedrift-catalyst-appsail-dev-v0.4.3-media-caption.zip`, SHA-256
  `cdd7eb7e45e2a25ab4214bbdda71a5b94ce386171ff4d588f25e25070eec6e4b`.
- Live installation requires only the new `update_media_metadata` function/API
  plus the widget ZIP; no Creator schema change is required.

## 2026-09-04 - Newly created tag code-3001 correction packaged

- The first live v0.5.0 smoke test confirmed that a tag could be created and the
  article could publish without tags, but applying the new tag failed at the
  article taxonomy save boundary with Creator code 3001.
- Isolated the failure from the review/publishing workflow: the Tag record was
  created successfully; the Widget SDK rejected the subsequent multi-select
  lookup update.
- Added guarded `save_article_taxonomy` Deluge persistence. It accepts record IDs
  as strings, verifies article ownership/state and active taxonomy records,
  converts tag IDs to Creator's required Number list, saves Category and Tags,
  and records an audit event.
- Updated `create_editorial_taxonomy_term` to return its record ID as text so an
  18-digit Creator ID cannot be rounded by JavaScript.
- Replaced the widget's direct Article lookup update with the new private Custom
  API call.
- TypeScript, production build, `git diff --check`, ZET validation, bundle API
  inspection, and ZIP integrity pass.
- Packaged
  `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.1-taxonomy-fix.zip`,
  SHA-256
  `1068232c6d529c4df7a0c573d9b58e699321ccc83149f0837e684362bb4634bd`.
- Live Creator installation and tag save/reload confirmation remain pending.

## 2026-09-04 - Article Workspace workflow-polish candidate completed locally

- Completed the requested workflow UX pass across the Article Workspace,
  dashboard, review, and publishing surfaces.
- Added post-submit, post-review, and post-publish outcomes with Continue,
  Review next, and Dashboard routes.
- Added recoverable draft Trash/restore with server-side role/state checks and
  audit events; no permanent delete is exposed.
- Added governed inline taxonomy creation: tags for Authors/Admins and categories
  for Editorial Admins, with duplicate reuse/reactivation.
- Made category optional while drafting but mandatory in both client and server
  review-submission preflight. Exposed Standard/Regulated approval counts and
  descriptions during article creation.
- Added role-specific attention metrics, publication health, article workflow
  history, saved review feedback, and previous-revision comparison.
- Replaced plain-text workflow notification bodies with escaped branded HTML and
  deep links back to the Article Workspace.
- TypeScript, production build, `git diff --check`, ZET validation, packaging,
  ZIP integrity, mock dashboard/editor visual inspection, review preflight,
  workflow timeline, and browser console checks pass.
- Packaged
  `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.0.zip`, SHA-256
  `74b23dbb48587a2c4b9f4b6c45e96ce2fae8602f56e2ecdd91f651bbf106fa13`.
- Added `creator/WORKFLOW_POLISH_SETUP.md` with the exact Creator function/API
  installation order and separate-role smoke matrix.
- Live Creator upload and role verification remain pending. v0.4.16 remains the
  known-good rollback until those checks pass.
- Deliberately excluded a whole-database reset. It requires a non-production
  environment guard and explicit test-data marker before it can be safe.

## 2026-09-04 - Creator account migration dry run completed

- Migrated/imported the Creator app under owner `piyugene02` and verified the
  correct production app route:
  `https://creatorapp.zoho.in/piyugene02/genedrift-editorial-platform#Article_Workspace`.
- Recreated Creator Custom APIs under Microservices with the new owner in the
  endpoint URLs.
- Confirmed approval policies: Standard Review uses one approval; Regulated
  Review is dynamic through the `Required Approvals` policy value and currently
  supports two or more distinct reviewers when configured.
- Uploaded and validated widget
  `editor-widget/genedrift-editor-widget-dashboard-ux-v0.4.16-save-verify-fix.zip`.
  This supersedes the v0.4.15 faster-load package because v0.4.15 could produce
  false draft save-verification failures.
- Updated Catalyst AppSail environment variables for the new Creator owner/app
  and direct OAuth path. `CREATOR_CONNECTION_NAME` must remain blank/deleted for
  this setup.
- Generated a new Zoho Self Client refresh token for the `piyugene02` account
  using scopes `ZohoCreator.customapi.EXECUTE,ZohoCreator.report.READ`, then
  stored the resulting refresh token in Catalyst `CREATOR_OAUTH_REFRESH_TOKEN`.
- Redeployed AppSail with `genedrift-catalyst-appsail-dev-v0.4.2.zip`.
- Final result: a fresh publish test succeeded in Catalyst and the blog appeared
  on the public frontend.
- Follow-up: rotate any OAuth credentials exposed during manual debugging before
  a real client-owned production handoff.
- Documentation updated: `docs/CREATOR_ACCOUNT_MIGRATION_RUNBOOK.md` is now the
  primary future account-transfer guide, and
  `docs/CURRENT_CHECKPOINT_2026-09-04.md` captured that migration checkpoint.

## 2026-09-01 - Duplicate Catalyst cron retry handled idempotently

- After the Creator-side scheduled reconcile fix, clicking Reconcile on
  `ROLE-03 Publisher-only` reached Catalyst but returned
  `The given Cron name already exists. Please give a different name`.
- The article then appeared back in the publishing queue as Approved/ready with
  the Publish button, indicating the failed retry rolled the stale scheduled
  article back to publisher action.
- Classification: second recovery-path defect. The original schedule handoff had
  already created or attempted the one-time Catalyst cron; the duplicate retry
  tried to create the same cron name and Catalyst rejected it.
- Local fix: `catalyst/src/adapters/catalyst.ts` now treats duplicate one-time
  Job Scheduling cron creation as idempotent, matching the already-existing
  duplicate handling for immediate Job Pool submissions.
- Regression coverage added in `catalyst/test/publishing.test.ts` for Catalyst's
  observed `The given Cron name already exists` error text.
- Verification: `npm test` in `catalyst/` passes 31/31 tests. AppSail package
  `genedrift-catalyst-appsail-dev-v0.4.2.zip` was created with SHA-256
  `1834f1924a953c21919d242e79f1d0bdaf847bd3abe35415697dd829afc9c3ff`.
- Additional dashboard fix: `editor-widget/src/App.tsx` no longer marks a future
  scheduled article as `Needs retry` merely because its Catalyst handoff has
  been Processing for more than five minutes. Future Schedule jobs remain shown
  as Scheduled until their due time, and the queue summary can count scheduled
  rows separately.
- Verification: `npm run typecheck` in `editor-widget/` passes.
- Live retest started with `RETRY-02 Scheduled Reconcile — 01 Sep 2026`,
  scheduled for `01 Sep, 06:04`. At `06:03`, the Articles view showed the row as
  `Scheduled` instead of `Needs retry`, which supports the pre-due dashboard fix.
- At `06:04`, `RETRY-02 Scheduled Reconcile — 01 Sep 2026` moved to Published.
  The All Articles list showed the row as `Published`, and the Published
  Articles panel showed it with publish time `01 Sep at 06:04 AM` plus the
  expected Retract/Open actions.
- Result: fresh scheduled publication after the Creator/Catalyst/widget recovery
  fixes passes. A forced duplicate/reconcile case remains useful but is no
  longer needed to prove ordinary scheduled publication.
- Product-polish note: in the Articles view, a Scheduled badge without the
  scheduled date/time is too vague. Show `Scheduled · 06:04` or
  `Scheduled for 01 Sep, 06:04` wherever a scheduled article row is displayed,
  not only inside the publishing queue detail line.
- Retest needed after deploying the updated Catalyst AppSail package: trigger a
  duplicate/reconcile path for an existing scheduled job and confirm the cron
  duplicate is accepted as the same scheduled trigger rather than reported as a
  handoff failure.

## 2026-09-01 - Scheduled reconcile defect diagnosed and fixed locally

- Clicking Reconcile on scheduled article `ROLE-03 Publisher-only` returned
  `Only an article with an approved revision pointer can be published.`
- Classification: recovery-path defect, not a failure of normal scheduled
  publication. The earlier valid schedule test still reached the public frontend.
- Cause: the Reconcile action routes through `publish_approved_article`. That
  function accepted already-published idempotency and approved immediate
  publishing, but rejected a `Scheduled` article before redelivering its existing
  open schedule job.
- Local fix: `creator/functions/publish_approved_article.deluge` now allows a
  `Scheduled` article with an approved revision pointer and an open Schedule job
  to call `handoff_publication_to_catalyst` for that existing job. It does not
  create a duplicate publication job.
- Retest needed after updating the live Creator function: click Reconcile once
  on `ROLE-03 Publisher-only`. Expected result is either a safe
  already-processing/accepted message or successful callback reconciliation, not
  the approved-pointer guard error.

## 2026-09-01 - Too-soon schedule prevention passed

- The Schedule dialog for approved article `UAT-02 Changes Requested Flow — 31
  Aug 2026` rejected `01/09/2026, 01:17 AM` because it was less than two minutes
  ahead of the current time.
- The user-facing validation message was `Scheduled publication must be at least
  two minutes in the future.`
- Result: too-soon schedule prevention passes; no publication handoff was
  started for the invalid attempt.

## 2026-09-01 - Valid scheduled publication reached public frontend

- Anshika authored `SCHED-01 Too-soon Schedule Rejection`, ZTM/Admin approved it,
  and the article was scheduled for `01 Sep, 01:11`.
- This did not exercise the true too-soon rejection path because the selected
  schedule was far enough ahead to be accepted. Treat the article title as a
  misleading test label.
- The row entered Processing and then appeared as Published in Creator with a
  Retract action. The public frontend Insights listing also showed the article,
  proving scheduled publication reached delivery.
- Result: valid scheduled publication passes for this article. The genuine
  under-two-minute rejection test remains pending.
- Product-polish note: authored Approved items move out of active author work
  toward publisher workflow. If the client expects newly approved authored work
  or latest updates to surface more prominently per role, refine dashboard
  sorting/discoverability before demo.

## 2026-09-01 - ROLE-04 admin-only visibility passed

- Harshuu was changed to include Editorial Admin, but the dashboard header still
  showed active Publisher as well. Treat this as mixed admin/publisher evidence,
  not clean admin-only verification.
- In `All` scope, Harshuu could see broad supervisory data: 27 articles, 18
  review items, queued reviews, active article work, publishing queue, and
  published articles with Retract actions.
- The scheduled `ROLE-03 Publisher-only` row remained visible as Scheduled for
  `01 Sep, 01:55`.
- Harshuu's Publisher role was then removed/expired. After refresh, the header
  showed only `Editorial Admin`, and `All` scope still exposed broad
  supervision: queued reviews, active article work, publishing queue, published
  articles with Retract actions, retracted articles, and closed review history.
- Result: non-owner admin-only visibility and supervision pass. The separate
  Author-only, Reviewer-only, Publisher-only, and Editorial Admin role matrix is
  now complete, while the wider integration remains unverified until scheduled
  execution, remaining publishing edge cases, fresh DS audit, accessibility, and
  scale checks pass.

## 2026-09-01 - ROLE-03 publisher-only queue visibility in progress

- Harshuu was adjusted from reviewer-only to active Publisher-only for the
  publisher matrix test.
- Anshika authored/submitted `ROLE-03 Publisher-only`, and ZTM/Admin approved it
  so it was ready for publisher action.
- Harshuu's Publisher-only dashboard showed zero review inbox items, zero active
  article work, and no current review-history work. Under the default `Mine`
  scope, the Publishing queue was empty because Harshuu does not own the article.
- Switching to `Queue` scope and/or the `Publishing` tab exposed the approved
  publishing queue with six ready items, including `ROLE-03 Publisher-only`, and
  visible Publish/Schedule/Open actions.
- Opening the approved article showed no claim/approve/request-changes/reject
  controls. Harshuu then scheduled `ROLE-03 Publisher-only` for `01 Sep, 01:55`;
  the publishing queue changed that row to `Scheduled` with no immediate
  Publish/Schedule buttons on the row.
- Follow-up clarification confirmed Harshuu could not edit the opened article or
  persist content/metadata changes.
- Result: publisher-only can see approved publishing work in the proper queue
  scope, does not show reviewer/author work, cannot make review decisions,
  cannot edit content, and can schedule approved work. Publisher-only permission
  behavior passes. The timed schedule execution remains a separate publishing
  workflow check.

## 2026-09-01 - ROLE-02 author-only denial passed

- Anshika Tyagi was adjusted to active Author-only for the negative role matrix.
- Fresh article `ROLE-02 Author-only Denial — 01 Sep 2026` was created, saved,
  given taxonomy/media content, and submitted for review. Creator reported
  `Article submitted for review. 1 assignment created.`
- After submission, the article moved to `In Review` and became read-only for
  the author. The account showed no active claim/approve/request-changes/reject
  controls and no usable Publish/Schedule/Retract actions.
- Historical review-history cards from Anshika's earlier reviewer-role tests
  remain visible as legacy records only; current active role evidence is
  Author-only.
- Result: author-only can create/save/submit owned work and cannot review or
  publish. Permission behavior passes.

## 2026-09-01 - ROLE-01 reviewer-only denial passed

- Harshuu was adjusted away from mixed Reviewer+Publisher access for the
  reviewer-only matrix test. Duplicate active Reviewer rows were removed before
  the test run.
- Fresh article `ROLE-01 Reviewer-only Denial` was submitted to Harshuu only.
  The reviewer dashboard showed one assigned review, zero active articles, zero
  history, and no article work.
- The `New article` action was visible but disabled. The assigned submitted
  article opened in `In Review`, with the article body and right-side metadata
  non-editable and `Save draft` disabled.
- Harshuu claimed the review and added `ROLE01-REVIEWER-CAN-COMMENT`, which
  appeared in the article Review feedback panel and review dialog before any
  approve/request-changes/reject decision.
- Harshuu recorded a terminal approval decision. The reviewer-only dashboard then
  showed zero inbox items, zero article work, the approved decision in Review
  history, one `My approvals` count, and no usable Publish/Schedule/Retract
  actions.
- Result: reviewer-only can receive, claim, comment, and decide on assigned work,
  but cannot author, save article edits, or publish. Permission behavior passes.
- Product-polish note: the reviewer-only dashboard still shows a disabled `New
  article` action. This is permission-safe, but hiding it may make the client
  demo cleaner.

## 2026-09-01 - UAT-02 Changes Requested N+1 loop passed

- Piyush created fresh article `UAT-02B Changes Requested Flow — 01 Sep 2026`
  and completed the real Request Changes branch with Anshika Tyagi as reviewer.
- Anshika added a standalone discussion comment, entered a decision summary, and
  selected Request changes. The decision closed into Review history as
  `Changes Requested`.
- The author account reopened the article in Changes Requested state and saw an
  editable cloned Draft Revision 2 with the original Revision 1 content and media
  still visible.
- After the author edited and resubmitted, Anshika claimed/reviewed Revision 2
  and requested changes again. The author account then saw the article back in
  Changes Requested with editable Draft Revision 3 and both feedback cards
  visible.
- Functional result: multi-cycle Changes Requested, N+1 clone creation,
  resubmission, feedback persistence, and media carry-forward pass.
- Product-polish note: the Review feedback panel currently shows decision
  summary, decision entry, and general comment as separate stacked text blocks
  that look repetitive. Keep the data model intact, but improve labels/hierarchy
  before client demo if time allows.
- Overall integration status remains Unverified until the complete Development
  matrix, fresh Creator DS export audit, and separate-role negative tests pass.

## 2026-09-01 - UAT-02 setup reached Standard Review approval, not Changes Requested

- Piyush created `UAT-02 Changes Requested Flow — 31 Aug 2026`, saved and
  submitted it to Anshika Tyagi. The submission notification email arrived and
  the article moved to In Review.
- The submitted revision was non-editable in both the author and reviewer
  sessions. Cover and inline media were visible in the separate reviewer
  session. Anshika claimed the assignment successfully.
- Anshika selected Approve. The article consequently moved to Approved and
  appeared in the Publisher/Admin publishing queue, which is correct for the
  Standard Review approval path.
- The supplied review-dialog evidence showed `No comments yet` in Discussion;
  the visible text was entered in Decision Summary. Standalone discussion-comment
  persistence is therefore not yet proven by this packet.
- Follow-up evidence confirmed the decision summary appears under the article's
  Review feedback panel and in Anshika Tyagi's Review history/activity entry.
  Decision-summary persistence and closed-review discoverability therefore pass
  for the approval path.
- Preserve this Approved article as positive Standard Review evidence. It cannot
  complete the Changes Requested case; a fresh article must use Request changes,
  verify immutable Revision 1 plus cloned Draft Revision 2, then resubmit.
- Overall integration status remains Unverified.

## 2026-08-31 - Fresh UAT media publication passed end to end

- Piyush completed the clean `UAT-01 Complete Publishing Flow` author, save,
  review, approval, and immediate-publish path without the prior media, taxonomy,
  concurrency, or callback error recurring.
- Creator reached `Published` at 23:34 IST and exposed the normal Retract action.
  The Vercel Insights search displayed the article and its cover image.
- The live Development detail API independently confirms publication
  `pub_60c71fd69ef455df0e4605a6589321aecf50fe79`, pointer version 1, the final
  Regulatory Affairs category, five tags, and two immutable media mappings.
  Both inline and cover media have content-addressed Stratus object keys and
  HTTPS public URLs, and the rendered HTML references the published media URL.
- This fresh positive flow passes. The two older `Syncing` cards remain legacy
  callback-recovery records and are not evidence of a UAT-01 failure. The overall
  integration is still not marked verified until the remaining Development
  matrix, fresh Creator DS export audit, and separate-role negative tests pass.

## 2026-08-31 - Creator media callback JSON decoding defect isolated

- Re-read the live immutable public object for `dekhti hai yeh nighaeen` and
  confirmed that both published media mappings contain the required stable media
  UUID, Creator record ID, checksum, immutable object key, and HTTPS URL.
- Isolated the remaining Creator rejection to Deluge parsing: `toJSONList()`
  yields JSON values, but the callback used ordinary map `get()` for each item.
  Zoho's supported JSON-list pattern reads those values with `getJSON()`.
- Updated `record_catalyst_publication_result` to use `getJSON()` for every media
  callback field while retaining UUID-first Creator record resolution. Catalyst's
  complete 30-test regression suite remains green and `git diff --check` passes.
- The installed Creator callback function must be updated once, followed by one
  idempotent `Reconcile` of job `471741000000063130`. Do not create or republish
  another article for this recovery check.
- Piyush pasted the updated callback exactly (294/294 lines) and the reconciled
  articles moved from `Needs retry` into `Published articles`, proving Creator
  applied the success callback. The remaining `processing the retraction` text
  was a dashboard classification defect: every active job attached to a
  Published article was described as a retraction regardless of its Action.
- The dashboard now chooses the newest active job for each article and labels
  only `Unpublish` as `Retracting`; a residual Publish/Schedule confirmation is
  shown as `Syncing`. Typecheck, production build, ZET validation, packaging,
  and archive integrity pass. The updated `zet.zip` SHA-256 is
  `3fee7b34c1ef7034601b98d0f0e028efc00f1f2b887f8bec35d8dee421a08c9b`.

## 2026-08-31 - Callback recovery deployed and dashboard reconciliation packaged

- Confirmed the Development health endpoint is serving AppSail `0.4.1`.
- Re-ran the focused Catalyst suite after deployment preparation: all 30 tests
  pass, including verified media promotion and dead-letter callback replay
  without a second version or pointer advance.
- Confirmed the live public index still contains one publication for `dekhti hai
  yeh nighaeen`, with the same publication ID, final category, four tags, and
  immutable featured-media URL. `testing image 5` is likewise publicly
  published while its Creator callback status remains unreconciled.
- Changed the Publisher dashboard to distinguish Ready, Processing, and
  Processing-over-five-minutes states. A stale item now shows `Needs retry` and
  offers a safe `Reconcile` action that redelivers the existing Creator job and
  idempotency key instead of creating another publication.
- Rebuilt, ZET-validated, and packed `editor-widget/zet/dist/zet.zip`; archive
  integrity passed and SHA-256 is
  `8c50bf7ee6b00272317e58fda84fd6c04e693f511ae84d5a9e7bc60527b876bb`.
- The existing job `471741000000063130` must still be replayed once and observed
  as Creator Succeeded / callback Delivered before this callback case passes.

## 2026-08-31 - Full image/taxonomy/review publication passed; callback evidence pending

- Fresh article `ART-dc7ce0522b7275a39a5421a0f7c47d56` passed recovery,
  inline and cover media persistence, multiple sequential body/taxonomy saves,
  claimed cross-account review with comment, approval, and immediate Publish.
- Creator accepted the handoff at 15:22:06 IST. AppSail `0.4.0` published the
  exact revision into the maintained public index at 15:22:08.046 IST with its
  final category, four tags, immutable content, and content-addressed featured
  media.
- The live Vercel article route returned HTTP 200 and rendered the final content.
  Catalyst's 29-test regression suite remains green.
- Creator was observed retaining `Processing`/HTTP 202 after the public commit.
  The publication worker is therefore not stuck; inspect the matching
  `GD_Callback_Outbox` row and refresh Creator before classifying the remaining
  issue as callback retry/failure or stale UI state.
- Do not mark the integration verified: final callback evidence, the rest of the
  Development matrix, a fresh Creator DS audit, and separate-role negative tests
  remain required.

## 2026-08-31 - Media success callback dead letter diagnosed and recovery prepared

- Catalyst callback `callback_b531d3e9f0295fafe7f4b571162d4a1d805a0957`
  dead-lettered after eight Creator rejections with `Published media callback
  contains an invalid mapping`, explaining the stale Creator Processing state.
- The immutable publication contains two complete valid media mappings. Changed
  Creator callback application to resolve each mapping by stable `Media_UUID`;
  nested `creatorRecordId` is now only an optional lookup optimization.
- Added terminal-callback self-healing to AppSail: a duplicate handoff for an
  already Succeeded/Failed request reopens its existing dead-letter callback and
  redelivers it, without republishing or advancing the pointer.
- Extended the safe Creator reconciliation sweep to redeliver Processing jobs
  older than five minutes using the same idempotency key.
- AppSail version `0.4.1` passes 30 tests including exact dead-letter replay and
  single-version/single-pointer assertions. Package
  `genedrift-catalyst-appsail-dev-v0.4.1.zip` has SHA-256
  `1d4b35fdded678f36651678ea3d5244775e434f504e4965ebe8a4b971b987b9a`.
- Deploy the three Creator functions and AppSail package, then redeliver the
  existing Processing job. Do not create a new article until Creator reaches
  Succeeded and the existing callback reaches Delivered.

## 2026-08-30 - Maintained public index and scale-test tooling implemented locally

- Created the repository's first preservation checkpoint, commit `da11492`,
  before starting the next implementation phase.
- Implemented AppSail `0.4.0` with compact `GD_Public_Index` rows. Publish and
  retract workers update the index after pointer CAS and before success;
  list/search/facets/feeds no longer load every immutable article object.
- Slug detail verifies the compact row against the authoritative pointer and
  loads exactly one immutable document. Added an authenticated rebuild route for
  existing catalogs and documented the seventh table and rollout order.
- Expanded the Catalyst suite to 29 passing tests, including compact-list reads,
  one-object detail, index rebuild, and stale-index rejection.
- Built and integrity-checked
  `genedrift-catalyst-appsail-dev-v0.4.0.zip`; SHA-256
  `fc3fec70f8aafd5e7a4a6405be8988dd5df02d2bc2897758f3393babb7821d06`.
- Added a deterministic 1,800-visible-article fixture plus retracted case, local
  public API, staged k6 read suite, and performance-report template.
- Made frontend sitemap generation request-time so transient Development API
  limits cannot fail or freeze a build. Out-of-range archive pages now redirect
  to the last valid filtered page.
- Local fixture build and browser checks passed for homepage, deep-page
  correction, search/filter, article detail, retraction/noindex, 390px long-title
  layout without overflow, and zero console warnings/errors.
- Opened the signed-in Creator Application IDE and located its DS Export action,
  but the browser did not produce a saved file. A fresh DS audit therefore
  remains pending. The app-access view also did not provide separate Publisher
  and Admin test identities, so the negative role matrix remained pending at
  this checkpoint. Later 2026-09-01 visual separate-role checks passed; direct
  API/security evidence remains open.
- Captured a complete positive Creator audit loop for
  `ART-022254fb3b8ade6547c08e54b3c79187`: Catalyst Published at 23:49:05 and
  Catalyst Retracted at 23:49:44 on 2026-08-29, including retraction job
  `471741000000056044` and callback
  `callback_36498adcbe77a6b2f2a48614bc45ddbc221e7f0c`.
- Staged a clean 24-file frontend upload in Vercel as
  `genedrift-vercel-preview-0.4`, then deployed it after explicit confirmation.
  Configured the Development public API and canonical Vercel origin and completed
  the configured redeployment at `https://genedrift-vercel-preview-04.vercel.app`.
- Live Vercel checks passed for homepage, archive/category, detail,
  canonical/JSON-LD, robots, sitemap, missing 404, retraction/noindex, no console
  warnings/errors, and 390px long-title layout. The retracted Next.js page still
  returns HTTP 200 rather than strict 410.
- Provisioned `GD_Public_Index` and all 24 documented application columns in
  Catalyst Development, deployed AppSail `0.4.0`, and configured
  `PUBLIC_SITE_BASE_URL` to Vercel. `/health` reports version `0.4.0` and its
  configuration check passes.
- With explicit approval, used the existing `INTERNAL_JOB_SECRET` for the one-time
  rebuild without printing it or storing it in the repository. The rebuild
  returned success and indexed nine current pointers; both mode-0600 temporary
  bridge files were deleted immediately afterward.
- Post-rebuild public listing returns five Published articles. Live checks pass
  for search/filter/pagination, detail, ETag/304, sitemap, RSS, missing GET 404,
  retracted GET 410 with `no-store`, Vercel archive rendering, and deep-page
  correction. AppSail still answers retracted HEAD with 200, and the retracted
  Next.js page still returns 200; retain both as explicit host/frontend gaps.
- Fresh Creator DS/negative-role evidence and the remaining Development matrix
  still remain pending, so the integration remains unverified.

## 2026-08-30 - Continuity checkpoint synchronized

- Reconciled the handoff, status, and product checkpoint with the live adaptive
  dashboard, AppSail `0.3.1` public API, positive retraction result, and built
  Next.js frontend.
- Added the Vercel/client migration guide and pre-client demo/scale test plan to
  the mandatory new-task reading order. Development remains unverified until the
  complete matrix, fresh Creator DS audit, and then-pending role tests passed.
  Later 2026-09-01 visual separate-role checks passed; direct API/security
  evidence remains open.

## 2026-08-29 - Vercel hosting and client migration runbook added

- Added `docs/VERCEL_HOSTING_AND_CLIENT_MIGRATION_GUIDE.md` with the recommended
  client-owned account model, Vercel Git deployment steps, exact frontend/Creator/
  Catalyst variable boundaries, custom-domain wiring, environment separation,
  safe rotation order, client-account migration phases, troubleshooting map, and
  final client handoff packet.
- Explicitly records that Vercel reads only the Catalyst public API and must never
  receive Creator OAuth credentials or publication-signing/internal-job secrets.
- Flags rotation of the Development internal job secret exposed during live
  testing before client or Production use.

## 2026-08-29 - Next.js public frontend foundation built

- Added `frontend/`, pinned to patched Next.js `16.3.3` with React 19 and strict
  TypeScript. Dependency audit reports zero known vulnerabilities.
- Implemented a responsive public homepage, searchable/filterable/paginated
  Insights archive, article detail pages, category/tag navigation, generated
  metadata and JSON-LD, robots/sitemap output, and clear 404/service/retraction
  states.
- The frontend consumes only the Catalyst public DTO. Article details use
  `no-store` so a retraction is never held in the frontend data cache; list data
  revalidates every 15 seconds.
- Added accessible navigation, skip link, keyboard focus behavior, reduced-motion
  support, long-title wrapping, mobile layouts, and resilient article-body styles.
- `npm run typecheck` and the optimized Next.js production build pass. Deployment,
  browser/device QA, Lighthouse checks, final brand/content design, and production
  domain wiring remain pending.
- The canonical Catalyst slug endpoint returns true HTTP 410. The first App Router
  page renders the retraction notice with `noindex`; verify the chosen host's
  response status behavior and add a fast host/proxy 410 rule if strict page-level
  HTTP 410 is required.

## 2026-08-29 - Public read API live core passed; cache safety tightened

- Development `0.3.0` returned five current Published articles. The known
  retracted article `ART-767af2ab02d5961458d3dd6a7ba584d1` was absent.
- Live detail and taxonomy returned HTTP 200; filtered pagination returned the
  expected article; repeating the detail request with its ETag returned 304.
- Retracted slug `hehehheehe` returned HTTP 410 with the matching article UUID,
  timestamp, reason, and null replacement path.
- Live headers exposed a five-minute `stale-while-revalidate` allowance. Version
  `0.3.1` removes stale serving, limits article-detail caching to five seconds,
  and makes HTTP 410 responses `no-store` so retracted content cannot remain in
  a stale cache window.
- All 28 tests and ZIP integrity pass. Deploy
  `genedrift-catalyst-appsail-dev-v0.3.1.zip`; SHA-256
  `13018639a290a6366c0c348e191d97ac9907ab158cf3b339301f831c619573f6`.
- Development deployment was then confirmed through `/health` as `0.3.1`.
  Published detail returned `Cache-Control: public, max-age=5, s-maxage=5,
  must-revalidate`; the retracted slug returned HTTP 410 with
  `Cache-Control: no-store`. The cache-safety correction is live verified.

## 2026-08-29 - Public content API `0.3.0` built and packaged

- Added public published-only list/search/filter/pagination, slug resolution,
  taxonomy facets, sitemap, and RSS endpoints to AppSail.
- Reads are authorized exclusively by current `GD_Published_Pointers` and their
  immutable public Stratus documents. Retracted articles are removed from lists
  and slug reads return HTTP 410 with timestamp, reason, and replacement path.
- Public responses remove Creator record IDs, approved pointers, and internal
  editor documents; they expose sanitized HTML and publication metadata only.
- Added CORS GET boundaries, ETags, bounded query inputs, short caching, slug
  conflict detection, and pointer/object identity validation. Sitemap/RSS only
  include `Index Follow` articles and require `PUBLIC_SITE_BASE_URL`.
- All 28 tests, typecheck, build, and ZIP integrity pass. Deployment artifact:
  `genedrift-catalyst-appsail-dev-v0.3.0.zip`; SHA-256
  `97caf31612d0b6742c853bfe965ecfc8015cb22fadd765a52c9f2818015f51e7`.
- Development deployment and live endpoint/retraction checks remain pending.
  This first read model scans current pointer objects; introduce a maintained
  public index before the catalog grows large.

## 2026-08-29 - Adaptive dashboard live updates packaged

- Added one-batch adaptive dashboard refresh: every five seconds while any
  publication job is Queued/Processing and every 45 seconds while idle.
- Refresh pauses while the browser tab is hidden and runs immediately when the
  user returns. Concurrent manual, action-triggered, and automatic reloads are
  deduplicated so only one Creator dashboard request batch is in flight.
- Added a visible live/refreshing/error indicator with the latest successful
  update time. Manual Refresh remains available and automatic failures retain
  the current dashboard while retrying later.
- Typecheck, production build, ZET validation/pack, and ZIP integrity pass.
  Historical upload artifact SHA-256:
  `ca2dad31734250c40a2b540d3f78b72b4b8a19f86175e7f61833516fff4dbf1b`.
  This is superseded by 2026-09-01 widget
  `genedrift-editor-widget-final-polish-v0.4.5.zip`.
- The package was uploaded and the complete live workflow was exercised in
  Creator. State changes appeared automatically without manual Refresh; the
  adaptive dashboard update behavior is live verified.

## 2026-08-29 - Immediate retraction positive path passed live

- Live article `ART-767af2ab02d5961458d3dd6a7ba584d1`, revision 1, completed
  an Unpublish request in one attempt with HTTP 200. Creator requested it at
  18:10:08 and recorded completion at 18:10:09 IST.
- The Creator dashboard moved the article from Published Articles to Retracted
  Articles and displayed its workflow state as Unpublished.
- Catalyst retained publication `pub_7596ccdb472fbe5f3330aae22f70ab6541eb7339`
  and its immutable revision/object identity. The current pointer advanced to
  version 2 with `Serving_Status = Retracted`, `Retracted_At` set to
  `2026-08-29T12:40:08.460Z`, reason `sdsdsds`, and retraction event
  `retract_35b5c56abc79199413aac01211dc4be54d52ce65`.
- Capture the matching Creator `Catalyst Article Retracted` audit event to close
  the positive-path evidence packet. Negative role tests, the remaining
  Development matrix, and a fresh Creator DS export are still required; the
  overall integration remains unverified.

## 2026-08-29 - Immediate dispatch passed; retraction API missing live

- Fresh article `ART-b800764c248d8837e812a5c8e568b8e0`, revision 1,
  published successfully through AppSail `0.2.1` in one attempt and HTTP 200.
  Creator requested at 16:54:05 and completed at 16:54:08 IST, confirming the
  immediate Job Pool path completes in about three seconds.
- The first Retract click did not reach Catalyst. Creator returned code `9350`:
  Custom API `retract_published_article` does not exist in the live app.
- Install the Default-namespace function and create the exact private OAuth2
  Custom API before retrying retraction on the same Published article.

## 2026-08-29 - Immediate publishing fast path prepared

- Split publication dispatch by intent. Publish and Retract now use Catalyst's
  immediate Job Pool submission API instead of a one-time cron, removing the
  artificial two-minute wait from normal publisher actions.
- Future Schedule requests still use a one-time cron at the exact chosen time.
  Times less than two minutes away are rejected clearly rather than silently
  moved. Automatic publication/callback retries retain the safety lead.
- Bumped AppSail to `0.2.1` with scheduler payload marker 4. All 25 tests pass.
- Uploadable ZIP: `genedrift-catalyst-appsail-dev-v0.2.1.zip`; SHA-256
  `e30dfe4581c1506ed132961fd47aa385f5455f6d4f19bd11adc5185778282efb`.
- Replace the live Creator `schedule_approved_article` function so its validation
  also requires a schedule at least two minutes in the future.

## 2026-08-29 - Publication action locking and pointer diagnostics

- The live `testing retraction` publish was accepted, then a second click was
  correctly rejected as already processing. Creator Publishing Health later
  showed attempt 1 in Processing with transient `POINTER_CONTENTION` and a
  scheduled retry at 16:20:54 IST. Final success/failure evidence is pending.
- Added a synchronous per-article action lock so rapid repeated Publish,
  Schedule, and Retract clicks cannot issue duplicate widget requests.
- The dashboard now loads active Creator `Publication_Jobs`; queued/processing
  articles show a Processing state and no publish/schedule/retract control,
  including after refresh and across browser tabs.
- Replaced Safari's stock dashboard selects with styled, focus-visible controls
  and a consistent chevron.
- Fixed Catalyst pointer insertion so a failed insert is treated as contention
  only when a pointer actually appeared. Schema, validation, and permission
  failures now retain the real Catalyst error instead of being mislabeled.
- Widget typecheck/build, ZET validation/pack, and ZIP integrity pass. Widget
  SHA-256: `7145f54e3084238fc271ecc853b022d5e759e9e85321f1c2b94efd1d6a191c83`.
- The pointer diagnostic is included in the newer AppSail `0.2.1` bundle above.
- Both updated artifacts require deployment before live verification.

## 2026-08-29 - Retraction lifecycle implemented locally

- Added signed `retract` handoffs to AppSail `0.2.0`, execution-time Creator
  preflight, CAS pointer serving state, required reason, optional replacement
  path, independent callback, and retry/replay convergence.
- Retraction preserves immutable snapshots, versions, public JSON, and media.
  `GD_Published_Pointers` alone advances to Retracted with pointer version +1.
- Added the guarded `retract_published_article` Creator function, Unpublished
  callback transition, audit/notification behavior, reconciliation coverage,
  and DS fields for retraction reason/replacement path.
- Added Publisher/Admin dashboard action, confirmation dialog, Unpublished
  filter, and Retracted Articles panel. Author/Reviewer access remains denied by
  the Custom API guard even if they attempt a direct call.
- Catalyst build and all 23 tests pass, including immutable retraction, required
  reason validation, stale-pointer rejection, and
  duplicate-worker convergence. Widget typecheck/build, ZET validation, and ZET
  packaging pass.
- Built `genedrift-catalyst-appsail-dev-v0.2.0.zip` with SHA-256
  `031d4358b495e5e2e0c2f6ecfc073d382074bf52aded0555159a3303fe22dd7a`.
  Widget ZIP SHA-256 is
  `853969cdf4e605339946b2c51ba96b55d7991cceccb6ca2878931a159edd598d`.
- Deployment and live verification remain pending; public HTTP 410/redirect
  enforcement will be completed by the upcoming public read API.

## 2026-08-29 - Product checkpoint and next-boundary sync

- Consolidated the completed editor, review, dashboard, and Catalyst publication
  capabilities in `docs/PRODUCT_CHECKPOINT_2026-08-29.md`.
- Recorded the exact remaining Development promotion, media, fresh DS, and
  negative role-test order. The integration remains unverified.
- Defined the public frontend dependency that was previously implicit: a
  read-only Catalyst list/slug/taxonomy API or immutable public index must sit
  between current-pointer/Data Store state and the Next.js browser experience.
- Documented the proposed Next.js Insights routes, server-side query path,
  caching/revalidation, SEO, RSS/sitemap, and error-state requirements.
- Confirmed retract/unpublish is not implemented end to end. Added a proposed
  serving-state lifecycle that preserves immutable versions, returns HTTP 410 or
  a redirect, records a signed callback/audit, and creates a new version on
  republish.
- Synchronized Status, Handoff, Architecture, Workflow, Data Model, Decision Log,
  Catalyst README, and the integration checklist with this boundary.

## 2026-08-29 - Dashboard navigation and scroll redesign prepared

- Reworked the Article Workspace dashboard into role-aware All Work, Articles,
  Reviews, and Publishing views. Publishing is hidden from users without that
  permission, and reviewer-only approval metrics now open approved review
  decisions rather than an unavailable publishing surface.
- Corrected scope semantics so `Mine` means articles owned/authored by the
  current employee and reviews assigned to that employee, even for admins;
  `Queue` and permitted `All` are now distinct datasets.
- Added state, category, and sort controls, clearable full-text search, a filter
  reset, filtered-result counts, refresh control, and metric-card shortcuts.
- Removed eight-record truncation. Dashboard panels now have independent
  340px scroll regions with visible scrollbars, long titles wrap to two lines,
  and action controls stay grouped without squeezing the title column.
- Added responsive single-column panels and horizontally scrollable metric
  cards. Browser checks passed for view switching, role-aware options, status
  reset, search reset, desktop layout, and a 720px layout whose metrics
  overflow horizontally while the main grid remains one column.
- TypeScript and Vite production builds passed. ZET validation/packing and ZIP
  integrity passed. Upload package `editor-widget/zet/dist/zet.zip`; SHA-256
  `b5822dcdc99a83f3d8aad27f94cb03b7c6b2235a864983b428c80121565b552f`.

## 2026-08-29 - Fresh scheduled publication succeeded after lease fix

- Fresh article `ART-82592a969d343c8107c7723190490df8`, revision 1, was
  scheduled for 09:35 IST with idempotency key ending in epoch
  `1787976300000`.
- Creator requested it at 09:32:41 and recorded Succeeded at 09:35:02 with one
  attempt and HTTP 200. This is the expected due-time behavior from AppSail
  service `0.1.5` and confirms the timezone lease fix operationally.
- Capture the matching Catalyst request/version/pointer/callback rows and the
  Creator Published audit event before closing the scheduled matrix evidence.

## 2026-08-29 - Scheduled timezone lease defect fixed locally

- Catalyst Job Pool history proved job `gdpub1a187e28e88e302` ran at the
  intended 22:25 IST time and completed successfully in 28 ms. The one-time
  cron and Job Pool/AppSail delivery therefore worked.
- Correlated that HTTP success with the unchanged Scheduled request and zero
  attempts. The AppSail endpoint returned the existing request without a lease
  because the ZCQL predicate compared a `+05:30` scheduled DateTime with a UTC
  ISO string. Equivalent instants could fail the database-side comparison.
- Moved Scheduled and RetryScheduled due-time evaluation into JavaScript, where
  both timestamps are normalized to epoch milliseconds, while retaining a
  conditional state/lease update in ZCQL for concurrency safety.
- Added the exact `2026-08-28T22:25:00+05:30` versus
  `2026-08-28T16:55:00.100Z` regression. All 20 tests pass.
- Prepared AppSail service `0.1.5` bundle
  `genedrift-catalyst-appsail-dev.zip`; SHA-256
  `c5e470ba02eaab97ebcf2f95e29e2eb54399aa992adea13d73c4a37db42e0746`.
  Deployment and a fresh scheduled live test remain pending.

## 2026-08-29 - Scheduled cron configuration confirmed

- Found dynamic cron `gdpub1a187e28e88e302d928b7595c`. Its one-time date,
  22:25 Asia/Kolkata time, AppSail target, Job Pool, POST method, and request ID
  are all correct.
- Narrowed the failure to cron submission into the Job Pool or later Job Pool
  execution; inspect job `gdpub1a187e28e88e302` next.
- The operator's copied cron details exposed the internal-job header secret. Do
  not record it in project files; rotate `INTERNAL_JOB_SECRET` before further
  testing and redact all future header values.

## 2026-08-29 - Scheduled Catalyst worker invocation failure confirmed

- Inspected the preserved request evidence for scheduled Creator jobs
  `471741000000055104` and `471741000000055122`.
- Both requests have immutable snapshots and valid scheduled timestamps but
  remained at attempt count zero overnight with no worker result. The dynamic
  one-time crons were accepted, but no AppSail publication worker ran.
- Narrowed the next diagnostic to Catalyst Job Scheduling Cron/Jobs. The exact
  second identities are cron `gdpub1a187e28e88e302d928b7595c` and job
  `gdpub1a187e28e88e302`; preserve the current In Review article until those
  records are inspected.

## 2026-08-29 - Rebuilt dashboard passed live Creator check

- Uploaded the rebuilt widget and confirmed the dashboard now excludes orphaned
  assignments: one real In Review article, one queued reviewer slot, and zero
  stale closed-history rows remain in the operational view.
- Preserved current test article
  `ART-82592a969d343c8107c7723190490df8` in In Review while the two earlier
  scheduled Catalyst requests are inspected. No new scheduled test should be
  created until that diagnostic determines whether their workers ran.

## 2026-08-29 - Orphan review rows hidden and Published dashboard added

- Confirmed Creator All Articles has only one current Article. The dashboard's
  old `Untitled article` entries are orphaned Review Assignments whose deleted
  Article/Revision lookups no longer resolve, not articles restored by Catalyst.
- Excluded assignments without both lookup IDs from dashboard inbox/history
  counts and activity fallback, changed the unresolved-label fallback to
  `Unavailable article`, and disabled invalid snapshot navigation.
- Added `Published` to the dashboard status selector and a dedicated Published
  Articles panel using each article's last-published timestamp.
- TypeScript, production build, ZET validation, packaging, and a local Published
  filter UI check pass. The current `editor-widget/zet/dist/zet.zip` SHA-256 is
  `642a94b96bf60368d8b5a61b67a574bd70134357cbf211024d4fe1c29ddd448d`.

## 2026-08-29 - Empty dashboard and wrapped editor title fixed

- Diagnosed the post-deletion `Workspace unavailable` state as Creator code
  `9220` (`No records exist in this report`) being treated as fatal. The widget
  now treats both known empty-report codes, `9220` and `9280`, and the stable
  no-records message as an empty collection.
- Added measured auto-growth for the article-title textarea and explicit safe
  wrapping for the title and TipTap body headings. A local narrow-viewport check
  confirmed the title expanded from one line to two with equal client and scroll
  heights, so no text was clipped.
- TypeScript, production build, ZET validation, and ZET packaging pass. Rebuilt
  `editor-widget/zet/dist/zet.zip` has SHA-256
  `b84f5f0661a095b4498bcb00352648e67bb8184d28afabd2a4692aba5fb0d229`.
- The previously accepted scheduled jobs `471741000000055104` and
  `471741000000055122` remain inconclusive because terminal Catalyst evidence
  was not captured before all Creator articles were deleted. Their Catalyst
  request/attempt rows and due-time AppSail logs still need inspection; do not
  classify the scheduler from the missing Creator UI state alone.

## 2026-08-28 - Scheduled publication test 1 accepted; due result pending

- Creator accepted scheduled job `471741000000055104` for article
  `ART-a2252680524acd3536e3f5d19fbe74dd` at 22:13:53 IST and retained the
  Scheduled state.
- The 22:19 IST screenshot is pre-outcome evidence only. The exact scheduled
  time and Catalyst request state are required before classifying the job as
  delayed or failed.

## 2026-08-28 - Published-article Creator UI guard passed

- Confirmed `otesting whole flow 1` no longer exposes a Publish action after its
  successful callback and does not appear in the Approved publication queue.
- Recorded this as the Creator UI-level republish guard only. The separate
  signed Catalyst duplicate-handoff/idempotency test remains outstanding.

## 2026-08-28 - Clean immediate Catalyst publication fully passed

- Captured the successful request, immutable version, version-1 pointer, and
  Delivered callback rows for Creator job `471741000000055086`.
- Fetched the exact public Stratus object successfully (HTTP 200). Its schema,
  publication ID, article/revision identities, title, content hash, timestamp,
  and empty media array match the Catalyst rows and Creator test.
- Marked only the clean no-media immediate-publish matrix case Passed. Scheduled,
  idempotency/duplicate, revoked approval, stale revision, transient failure,
  callback outage/replay, and media cases remain, as do the fresh Creator DS
  export and negative role tests. The overall integration remains unverified.

## 2026-08-28 - Clean immediate Catalyst publication succeeded

- Added the missing `GD_Published_Versions.Revision_UUID` column and ran a fresh
  full draft/review/approve/publish test on `otesting whole flow 1`.
- Creator job `471741000000055086` succeeded in one attempt with HTTP 200 and no
  error at 20:35:32 IST.
- Creator Recent Activity shows `Catalyst Article Published` in Published state
  and the subsequent Published notification handoff, proving the successful
  callback applied the final Creator transition.
- The matching Catalyst request/version/pointer/outbox rows and public object
  were subsequently captured and verified, as recorded in the entry above. The
  remaining Development matrix, fresh Creator DS export, and negative role tests
  remain outstanding; the overall integration is unverified.

## 2026-08-28 - Clean immediate worker and failure callback executed

- Ran a clean draft-to-review-to-approval-to-publish test on `testing cat
  creat1`, Creator job `471741000000055060`, article
  `ART-20e69bb454a2316020e5de731c56f162`.
- Catalyst accepted the handoff, the scheduled worker ran after the two-minute
  lead, and the signed callback updated Creator, proving those boundaries live.
- The worker failed on attempt 1 with HTTP 409,
  `CATALYST_INVALID_INPUT`, and `Invalid input value for column name`.
- The failure is now narrowed to the worker's Catalyst persistence operations.
  Matching request/attempt/version/pointer/outbox rows and live table column
  definitions are required before changing code. The integration remains
  unverified.
- Captured the matching rows: request and attempt failed consistently, the
  failure callback was Delivered in one attempt, and no Published Versions row
  exists.
- Fetched the deterministic public Stratus article object successfully (HTTP
  200). Its publication identity, article/revision data, hash, and timestamp are
  correct. This proves the failure is exactly the next
  `GD_Published_Versions` insert, not preflight, rendering, or object storage.
- Next: capture the live Published Versions Schema View and compare its columns
  with the required insert fields before making any schema change.
- The live Add Row view identified the mismatch: `GD_Published_Versions` is
  missing `Revision_UUID` while all seven other application columns are present.
  This exactly explains the failed insert. Audit Published Pointers for the same
  omission, then add all missing schema columns together before retrying.
- Published Pointers contains all eight required application columns, including
  `Revision_UUID`; it needs no change. Add only required `VARCHAR(128)`
  `Revision_UUID` to Published Versions, preserve the terminal failed request,
  and run the next immediate-publish test with a fresh no-media article.

## 2026-08-28 - Catalyst handoff and scheduling submission accepted live

- Deployed service version `0.1.4` / scheduler payload version `3` and retried
  the same approved publication request.
- Creator returned `Catalyst accepted the publication job.`, proving the signed
  handoff and dynamic AppSail Job Scheduling submission now pass live.
- Worker execution, immutable version/pointer writes, callback delivery, and the
  final Creator Published transition remain to be captured before the immediate
  publish case passes. The overall integration remains unverified.

## 2026-08-28 - Full Catalyst scheduling payload audit

- Version `0.1.3` passed the corrected 20-character `job_name` validation and
  exposed Catalyst's next sequential constraint: `cron_name should be within
  1-30 char length`.
- Audited the complete dynamic one-time AppSail cron payload against the installed
  SDK, current Zoho examples, and live validation evidence instead of applying
  another isolated field patch.
- Capped deterministic cron names at 30 characters and job names at 20, limited
  generated identifiers to conservative lowercase alphanumeric characters,
  removed optional description and platform retry metadata, retained Zoho's
  documented Unix-seconds execution time, and added a two-minute minimum lead
  for immediate jobs to avoid clock/rounding races.
- Expanded the exact payload regression test across names, optional fields,
  AppSail routing, request body, and immediate-job timing.
- Service version `0.1.4`, scheduler payload version `3`, TypeScript, and all 19 automated tests pass. Rebuilt
  `genedrift-catalyst-appsail-dev.zip`; SHA-256 is
  `c7146b38e373948873f707676eb3ec15a1a8c1e354df68981f1972ad588085d2`.
- Deployment and one retry of the same queued Creator job remain pending. The
  integration remains unverified.

## 2026-08-28 - Catalyst 20-character job-name limit corrected

- The version `0.1.2` diagnostic build successfully exposed Catalyst's actual
  Job Scheduling validation response: `job_name should be within 1-20 char
  length`.
- Split the long deterministic cron identity from a separate deterministic
  20-character `job_name`, and extended the scheduling payload regression test
  to enforce its exact length and format.
- Service version `0.1.3`, TypeScript, and all 19 automated tests pass. Rebuilt
  `genedrift-catalyst-appsail-dev.zip`; SHA-256 is
  `8e9c36a2adf007b7cc4c6a75d144c6f6f875f6eb22c98d2bce3e89653992656c`.
- Deployment and a single retry of the same queued Creator job remain pending.
  The integration remains unverified.

## 2026-08-28 - Catalyst SDK scheduling error diagnostics corrected

- Confirmed AppSail service version `0.1.1` and scheduler payload version `2`
  were live, then captured a second immediate-publish rejection for Creator job
  `471741000000050109` and article
  `ART-7ddf051b85dc92d69699ba38d61a2a12`.
- Creator retained the Approved state. AppSail still logged only
  `UNEXPECTED_ERROR` / `Unexpected publication error`.
- Found that the installed Catalyst Node SDK rejects unsuccessful HTTP responses
  as plain `{ statusCode, code, message }` objects. The service handled only
  `Error` instances and therefore discarded the actionable API response.
- Added safe scalar-only SDK error normalization and a regression test that
  proves unrelated request/header data is not serialized.
- Service version `0.1.2`, TypeScript, and all 19 automated tests pass. Rebuilt
  `genedrift-catalyst-appsail-dev.zip`; SHA-256 is
  `1551f6784b47f64cfa254ff07d6077a0857181b06000e2c5706fbe6ac5b23537`.
- Deployment of the diagnostic build and capture of the real Job Scheduling API
  rejection remain pending. The integration remains unverified.

## 2026-08-28 - Catalyst request-row inspection blocked safely

- Resumed from the live checkpoint and preserved the first immediate-publish
  request without retrying it.
- Attempted to inspect `GD_Publication_Requests` for Creator job ID
  `471741000000050093`, but the in-app browser could not open the India Catalyst
  console because its administrator policy verification was unavailable.
- No live state was changed. The request row's `Status`, `Snapshot_Object_ID`,
  `Request_ID`, `Last_Error_Code`, and `Last_Error_Message` remain the next
  mandatory evidence. The integration remains unverified, and the Development
  matrix, fresh Creator DS export, and role tests were outstanding at this
  historical checkpoint. Later 2026-09-01 visual separate-role checks passed;
  direct API/security evidence remains open.
- The operator subsequently supplied the row. It is `Queued`, has the expected
  immutable `Snapshot_Object_ID`, has `Attempt_Count = 0`, and has no stored
  error. This proves the Data Store attachment succeeded and narrows the live
  failure to Catalyst Job Scheduling submission.
- Found a concrete Job Scheduling payload mismatch in the deployed source:
  `job_config.retry_interval` was sent as the string `"60"`, while the Catalyst
  SDK contract requires a number. Corrected it to `60`, switched to the current
  `cron()` accessor with backward compatibility, and added a focused payload
  regression test. Deployment and live reconciliation remain pending.
- TypeScript and all 18 automated boundary tests pass. Added `/health` build
  markers for service version `0.1.1` and scheduler payload version `2`, then
  rebuilt and verified `genedrift-catalyst-appsail-dev.zip` with SHA-256
  `492c7e6d102e288a352bd91a96fcf55739208cfd2fb3b79124540a803f009c5b`.

## 2026-08-26 - Catalyst Stratus media boundary implemented locally

- Accepted Catalyst Stratus as the final published-content and media provider,
  replacing the earlier generic S3-compatible/open-provider wording and the
  File Store deployment path.
- Split storage into an authenticated private Stratus bucket for approved
  snapshots and a public-read bucket for immutable article JSON and media.
- Upgraded `zcatalyst-sdk-node` from 2.5.0 to 3.4.0, the installed release that
  exposes the documented Stratus bucket API; the production dependency audit
  reports zero known vulnerabilities.
- Upgraded the signed handoff to schema version 2. Creator now supplies exact
  media record/file identities and approval metadata rather than requiring a
  manually populated permanent URL before handoff.
- Added execution-time Creator media download through API v2.1 using the narrow
  `ZohoCreator.report.READ` scope. The worker enforces supported raster formats,
  maximum size, magic-byte MIME, SHA-256 checksum, and exact dimensions before
  writing content-addressed media objects.
- Extended the signed callback/outbox with deterministic media mappings. Creator
  verifies record ID, media UUID, and checksum before applying
  `Published_Object_Key`, `Published_URL`, and `Status = Ready`.
- Expanded Data Store and environment instructions for Stratus bucket names,
  public base URL, Creator file-download identifiers, media limit, and bounded
  object keys. Callback retries reload media mappings from the immutable
  published document instead of duplicating a potentially large JSON array in
  Data Store.
- Added the ordered Creator/Catalyst operator checklist and Stratus-specific
  Development/Production promotion tests.
- Rebuilt, ZET-validated, and packed the updated Article Workspace at
  `editor-widget/zet/dist/zet.zip` after adding normalized media persistence.
- Added widget-managed `Article_Revisions.Referenced_Media_UUIDs` and changed the
  Creator handoff to query only the exact inline/featured/social assets for the
  approved revision, with de-duplication and a 200-asset cap. This removes the
  prior full-library scan and keeps handoff work proportional to article size at
  the client's expected 1,800-post annual volume.
- TypeScript compilation and seventeen automated tests pass, including successful
  media ingestion, callback media rehydration, and permanent
  checksum/type/size/dimension-drift rejection. Deployment and live
  verification remain pending, and the Creator checkpoint remains unverified
  until a fresh DS export and negative role matrix pass.

## 2026-08-26 - Catalyst publishing boundary implemented locally

- Rechecked the Creator checkpoint before implementation. No fresh post-cleanup
  DS export was available; the newest export and SHA-256 still match the
  previously audited unverified file. The live Creator page could not be opened
  under the administrator browser policy. Recorded the checkpoint as Unverified
  without inferring success.
- Implemented a Node.js 22 Catalyst AppSail boundary with signed/replay-protected
  Creator handoff, strict approved-snapshot validation, safe TipTap rendering and
  sanitization, immutable content-addressed snapshot/version objects, insert-only
  version rows, and a versioned conditional current pointer.
- Implemented leased idempotent workers, stale-revision protection, bounded
  exponential retry, deterministic one-time publication/retry jobs, attempt
  history, and terminal error classification.
- Added a fresh execution-time Creator preflight for exact job, state, approved
  pointer, UUID, revision, and checksum validation.
- Added a separate Creator callback outbox with signed events, independent retry
  and dead-letter behavior, plus Creator-side idempotent audit/state application.
- Wired Creator API calls through the Catalyst SDK connector with OAuth client
  credentials and a refresh token, avoiding a production dependency on manually
  pasted one-hour access tokens.
- Replaced Creator-local publish/schedule completion with queued Catalyst handoff.
  Creator now reaches Published only from the signed callback. The old Creator
  date-field processor is reduced to safe handoff reconciliation and cannot
  publish.
- Added Catalyst schema/deployment/promotion instructions and Creator variables,
  Custom APIs, scheduling-switch, and negative/live-test instructions.
- TypeScript compilation and thirteen automated boundary tests pass. The boundary
  remains not deployed and not live verified.

## 2026-08-26 - Live Creator DS export audited

- Audited `GeneDrift_Editorial_Platform-4.ds` against the local production DS,
  widget read models, current functions, and live screenshots.
- Confirmed the expected 17 forms and reports, active date-field scheduler,
  idempotent publication jobs, notification helper, and successful first timed
  scheduling evidence.
- Confirmed Schedule and Publish job rows both Succeeded in one attempt and the
  article is Published with matching Scheduled At and Last Published At values.
  Revision 1 and the final published pointer remain to be checked directly.
- Found live function drift: claim, decision, publish, and schedule still contain
  older ungrouped criteria, and claim/decision/immediate-publish lack their latest
  notification calls. The current repository versions must be re-saved.
- Found broad Author/Reviewer profiles, no dedicated Publisher/Admin profiles or
  Creator roles, absent Publisher/Admin sharing, raw-form navigation exposure,
  and missing report fields required for stable widget and operational reads.
- Confirmed the previously suspected `Review_Comments_RA` target is corrected in
  this export. Retained `Article_Revision_rA` only as a documented temporary N+1
  draft bridge.
- Removed raw forms from the local production DS web menu and expanded local job
  and audit reports with start/publication identifiers and notification metadata.
- Added `docs/LIVE_DS_AUDIT_2026-08-26.md` as the authoritative cleanup order.

## 2026-08-26 - Notification delivery path live verified

- Re-saved `send_editorial_notification` with recipient-list delivery and
  explicit `Notification Failed` diagnostics, then re-saved the submission
  caller.
- Live submissions recorded `Notification Handoff` for one and two reviewer
  recipients.
- Confirmed Creator Built-in Email is the active outgoing channel and that the
  application is not attached to Development/Stage/Production environments, so
  environment notification redirection is not involved.
- Executed direct delivery diagnostics to the admin Gmail and
  `hello@piyushtyagi.work`. Creator accepted both sends; the Gmail copy arrived
  in Spam from `notifications@trial.zohocreatormail.com`.
- Marked the Creator notification mechanism verified. Custom-domain inbox
  delivery remains a recipient-domain/provider concern; production should use
  authenticated-domain delivery with logs, bounces, and webhooks.
- Removed the temporary direct-send diagnostic after testing.

## 2026-08-25 - Permission setup, notifications, and scheduling prepared locally

- Re-read the local handoff/status/publishing/architecture/decision docs and
  checked official Zoho documentation before finalizing the scheduling path.
- Corrected the scheduling architecture: Creator's generic custom schedule only
  repeats Daily/Weekly/Monthly/Yearly/Once, so the scalable Creator-local demo
  path is an `Articles.Scheduled_At` date-field workflow that processes the
  specific article record. Catalyst Job Scheduling/Cron remains the production
  execution boundary.
- Added `process_scheduled_publication(articleId)` as the single-article
  idempotent scheduled publish executor and reduced
  `process_scheduled_publications()` to a manual/backfill sweep.
- Added `docs/SCHEDULING_AND_NOTIFICATIONS.md` to capture the Creator-local and
  Catalyst production scheduling boundaries.
- Added `creator/PERMISSION_SHARING_SETUP.md` with least-privilege Creator
  profile guidance, explicit Data Sharing bridges, known rule cleanup, and a
  real-user verification matrix for Author, Reviewer, Publisher, and Editorial
  Admin.
- Added `send_editorial_notification` as a shared Deluge notification helper and
  wired best-effort notification handoffs into submission, claim, review
  decision, publish, schedule, and scheduled-publication flows.
- Added `schedule_approved_article` for Publisher/Admin scheduling of Approved
  content, with validation, queued `Publication_Jobs`, `Scheduled_At`, audit,
  and author notification handoff.
- Kept `process_scheduled_publications` as a due-article backfill sweep that
  delegates to the single-article processor.
- Added `creator/NOTIFICATION_SCHEDULING_SETUP.md` with function/API/scheduled
  workflow installation steps and live smoke-test criteria.
- Added dashboard scheduling support beside Publish in the Publisher/Admin
  publishing queue, plus Creator and mock repository methods for
  `schedule_approved_article`.
- Rebuilt the widget, passed ZET validation, and repacked
  `editor-widget/zet/dist/zet.zip`.
- The first live notification test on `GeneDrift Workflow Verification 01`
  successfully submitted one Harshuu assignment but produced no inbox email or
  `Notification Handoff` event. Hardened the helper to use Zoho's supported
  recipient-list value and to record `Notification Failed` with the caught
  runtime message and line number. Live notification delivery remains pending.
- A live scheduled-publication test on `hew one with regulated` passed the
  primary date-field workflow path: scheduling and its notification handoff were
  recorded at 18:52, then automatic publication and its notification handoff
  were recorded at 18:53. Inspect the related `Publication_Jobs`, article
  pointers/timestamps, and revision state before marking the full scheduling
  integrity test complete.
- Live Zoho installation and verification remain pending for permission profile
  cleanup, notification handoffs, the schedule Custom API, the scheduled
  processor, and separate role-isolated Author/Reviewer/Publisher/Admin users.

## 2026-08-25 - Publisher/Admin local publishing boundary

- Added a guarded `publish_approved_article` Deluge function for the first
  Creator-local publishing boundary.
- Added widget repository support for the `publish_approved_article` Custom API
  and mapped approved/published article pointers and timestamps.
- Added a Publisher/Admin dashboard publish action for Approved articles in the
  Publishing queue, with success/error feedback and dashboard refresh.
- Added local mock publishing behavior so the dashboard can exercise the same
  Approved-to-Published transition without Creator.
- Documented Creator installation and smoke-test steps in
  `creator/PUBLISHING_SETUP.md`.
- Rebuilt, ZET-validated, and repacked `editor-widget/zet/dist/zet.zip`.
- Installed the publishing function and Custom API in Creator. Admin live smoke
  testing passed: the dashboard showed `Article published.` and Audit Events
  recorded `Article Published` from Approved to Published.
- Publisher smoke testing passed after Harshu was given an active Publisher role
  in addition to Reviewer. Harshu saw publishing work, published approved
  articles, the ready queue cleared for both Harshu and Admin, and Recent
  Activity/Audit Events recorded the published revisions.

## 2026-08-25 - Regulated review queue hardening

- Live regulated-review testing showed the expected two shared-queue slots for a
  two-approval policy, but also exposed stale queue rows after Harshu requested
  changes on one claimed slot.
- Compared the live DS export with local source and found the live
  `claim_review_assignment` and `record_review_decision` functions still contain
  older ungrouped `OR` filters. The local files already contain the corrected
  grouped conditions and should be re-saved in Creator before the next regulated
  review test.
- Hardened the dashboard so open review inbox/admin queue counts only include
  active assignments whose visible parent article is still `In Review`.
- Hid remaining shared-queue slots from a reviewer once that reviewer has already
  participated in the same revision, while keeping them visible to other eligible
  reviewers and admin oversight.
- Deduplicated identical shared-queue slots in non-admin reviewer dashboards so a
  regulated review appears as one claimable article instead of repeated rows.
- Sorted review inbox, review history, recent activity, and article work by
  parsed activity timestamps so newly changed items float to the top more
  predictably.
- Live-verified the corrected regulated-review path with two distinct reviewers:
  first approval kept the article In Review, second approval moved it to
  Approved, and shared-queue reviewer UX remained single-row while admin retained
  queue-slot visibility.

## 2026-08-24 - Dashboard live test and draft role isolation correction

- Confirmed the multi-role model in live setup: Anshika can move between
  Author-only, Reviewer-only, and Author+Reviewer behavior through active
  `Editorial_Role_Assignments`, while Creator app access remains controlled by
  the assigned Creator role/permission set.
- Polished the Article Workspace dashboard locally with role badges, richer
  operational metrics, reviewer/source/status row context, compact review
  history rows, and a recent review timeline for a more modern multi-user
  editorial home.
- Refined the dashboard clarity after live screenshots: deduplicated repeated
  role badges, changed Review History into decision cards with decision,
  reviewer, source, summary, and reviewed-snapshot open action, and changed the
  timeline into recent activity cards with event, status, actor, article, detail,
  and timestamp.
- Added missing dashboard pieces locally: a `Mine / Queue / All` scope switch,
  Publisher/Admin publishing queue for Approved articles, Admin overview cards
  for queue/in-review/changes-requested/ready-to-publish counts, and dashboard
  loading for `Audit_Events_Report` so Recent Activity can use audited workflow
  events when the user's data sharing allows it.
- Added a production-oriented dashboard command bar with cross-dashboard search
  and status filtering, then refined the visual system with a calmer desktop
  workspace background, clearer command controls, stronger card hierarchy, and
  more modern dashboard surface styling.
- Rebuilt, ZET-validated, and repacked the polished dashboard package at
  `editor-widget/zet/dist/zet.zip`. Live upload and visual verification remain
  pending.
- Re-read the handoff, status, edge-case audit, review setup, decisions, and
  worklog before resuming from the Immediate Next Test.
- Rebuilt the editor widget, confirmed TypeScript and production build pass,
  reran ZET validation, and repacked `editor-widget/zet/dist/zet.zip`.
- Attempted to open the live Zoho Creator app for upload and role-isolation
  retest, but the in-app browser was blocked by an admin-policy verification
  failure for `creator.zoho.in`. The corrected package remains unuploaded and
  the Harsh/admin live checks remain unverified.
- Live-verified the role-aware dashboard in both the admin and Harsh Reviewer
  accounts, including New Article, Review Inbox, Review History, row navigation,
  assignment claim, and Changes Requested refresh behavior.
- Hardened the dashboard against Creator report lookup visibility gaps: review
  assignments now keep Article/Revision lookup display text when available,
  reviewer-owned assignments can fall back to display-name matching if Zoho omits
  the reviewer lookup ID, and the review dialog uses the same fallback for
  assigned/claimed state. The server-side Custom APIs remain the authority for
  claim, comment, and decision permissions.
- Corrected article-only workspace loading for Changes Requested articles: when
  the active draft pointer is stale or points to a non-Draft revision, the widget
  now falls through to the latest Draft revision so the owner/author/admin opens
  the editable N+1 draft.
- Hardened owner/primary-author matching for Creator report lookup visibility
  gaps. If Zoho exposes an article's author display name but omits the lookup ID
  in a shared/report response, the dashboard and draft editor can still recognize
  the signed-in author; self-review blocking uses the same fallback.
- Audited the live DS export and data-sharing screenshots. Added
  `docs/DATA_SHARING_AUDIT.md` with present rules, missing Publisher/Admin
  sharing, a mis-targeted `Review_Comments_RA` rule, and the prototype-broad
  Author permission-profile risk.
- Live-verified that New Article creates a draft and opens the Article Workspace
  editor instead of leaving the user in the raw Creator form.
- The real Harsh test exposed a role-isolation defect: after requesting changes,
  opening the article by article ID loaded the author's N+1 Draft and enabled
  Save Draft and Submit for Review for the reviewer.
- Corrected editability so only the article owner, primary author, CEO, or
  Editorial Admin can edit, recover, save, or submit a Draft revision.
- Added the same ownership/administration authorization check inside the draft
  save repository operation and prevented unauthorized users from opening a
  working Draft through either an article-only or explicit Draft revision URL.
- Review History now opens the exact reviewed revision through `revisionId`, so
  a closed review cannot silently switch to the author's newer working draft.
- Closed reviewer assignments no longer show a stale Review action while another
  reviewer is still pending, and reviewer approval counts now reflect the
  reviewer's own completed approvals.
- Rebuilt successfully. Live verification remains pending for this corrected
  package before role isolation can be marked passed.

## 2026-08-23 - Editorial dashboard and reviewer inbox built locally

- Added a no-article mode to Article Workspace. Opening the page without an
  `articleId` now loads a role-aware editorial dashboard instead of showing a
  workspace error.
- Added dashboard data loading for current employee, articles, and review
  assignments from Creator reports.
- Added Review Inbox, Article Work, and Review History panels with counts and
  one-click Open actions that route into the existing article workspace with the
  correct article record ID.
- Kept the existing article editor/review path unchanged when `articleId` is
  present.
- Rebuilt, validated, and packed `editor-widget/zet/dist/zet.zip`.
- Pending live verification: upload the new widget package, open Article
  Workspace from the sidebar without a URL parameter, then confirm Harsh sees the
  dashboard and can open assigned work from the inbox.
- Follow-up fix: dashboard buttons now use Zoho Creator's
  `navigateParentURL` parent-window navigation instead of iframe-local browser
  navigation. Rebuilt, validated, and repacked the widget.
- Upgraded the dashboard New Article flow from opening the raw Creator form to
  a compact widget dialog. The widget creates a Draft `Articles` record with the
  current employee, selected category, and approval policy, then opens the
  Article Workspace editor for that new record. The full Creator form remains
  available as a fallback from the dialog.

## 2026-08-23 - Changes Requested N+1 implemented locally

- Verified the real Harsh reviewer could see shared review records after adding
  Creator Data Sharing rules from CEO to Reviewer for the required forms.
- Verified the live approval path moved the assigned article and revision to
  Approved.
- Verified the live Changes Requested path moved the assignment and article to
  Changes Requested while leaving Revision 1 Submitted.
- Updated `record_review_decision.deluge` so Changes Requested now creates the
  next Article Revision as Draft, clones the submitted revision's editor document
  and editable metadata, points `Active_Draft_Revision_ID` at the new revision,
  and records audit metadata.
- Updated widget result handling to surface the newly-created draft revision
  number returned by the Custom API.
- Installed the updated function in Creator and verified live that
  `testing new workflow n+1` now has Revision 1 Submitted and Revision 2 Draft
  after Harsh requested changes.
- Found that the live `Articles_Report` export omitted `Active_Draft_Revision_ID`,
  which made Article Workspace load the submitted Revision 1 fallback and appear
  read-only even though Revision 2 existed. Added a widget fallback that loads
  the latest Draft revision for Draft or Changes Requested articles when the
  pointer is missing from the report read model.
- After Revision 2 was resubmitted, the same hidden pointer made the reviewer
  workspace fall back to Revision 1 and show the old Changes Requested
  assignment. Extended the widget fallback so In Review articles load the latest
  Submitted revision and Approved articles load the latest Approved revision when
  explicit revision pointers are hidden.
- Uploaded the corrected widget and verified Harsh could see the Revision 2
  assignment, claim it, and approve it. Article Revisions shows Revision 2
  Approved while Revision 1 remains Submitted.
- Next: test Regulated Review, shared queue, and role isolation, then build
  review history and the role-aware dashboard.

## 2026-08-23 - Real reviewer setup started

- Began configuring `hello@piyushtyagi.work` as real reviewer test identity
  `REAL-REVIEWER-EDITOR-001` (`Harsh`).
- Created Creator application role `Reviewer` and least-privilege permission set
  `Editorial Reviewer`.
- Kept the setup marked incomplete until invitation acceptance, user assignment,
  exact login mapping, team membership, editorial role assignment, and live
  reviewer testing are verified.

## 2026-08-23 - Release edge-case audit

- The live recovery test exposed an invisible trailing-character mismatch in the
  excerpt: recovery restored 41 characters while Creator normalized the stored
  value to 40. Canonicalized title, slug, excerpt, SEO fields, and robots values
  before both persistence and verification to prevent this false failure.
- Uploaded the corrected widget and completed the live recovery-to-submission
  path on article `471741000000032030`. The submission created one reviewer
  assignment, moved the article to In Review, made the revision read-only,
  populated Review Queue, and created the corresponding audit event.
- Corrected the live new-article path after Creator returned missing-file code
  `3730` as a resolved response object; the widget now recognizes both resolved
  and rejected variants as a valid empty revision.
- Re-ran the live first-save test on fresh article `471741000000032030` and
  confirmed formatted body, excerpt, SEO title, and SEO description persisted
  after a full reload.
- Completed the media portion of that live test: cover and inline images, image
  metadata, placement, and surrounding formatted content persisted after reload.
- Passed the live stale-tab test by saving in tab A and attempting a different
  metadata save from the older tab B; the second write was rejected.
- Audited first save, autosave serialization, delayed Creator reads, malformed
  file responses, recovery restoration, media persistence, submission during
  save, workflow-state changes, multi-tab editing, queue claiming, comments, and
  review decisions before producing another widget package.
- Added a full editable-revision version token in addition to the body checksum,
  preventing metadata-only stale tabs from silently overwriting newer changes.
- Added pre-upload and post-upload conflict checks and complete metadata readback
  verification with longer consistency retries.
- Corrected recovery restoration so the TipTap canvas follows restored state and
  damaged local recovery data cannot break the workspace.
- Preserved review-comment text when a Creator request fails.
- Hardened Creator reviewer functions against duplicate reviewer participation,
  closed review discussions, invalid parent comments, and oversized comments or
  decision summaries.
- Documented the limits that require server-owned production controls: atomic
  revision saves, atomic shared-queue claims, immutable N+1 revisions after
  Changes Requested, media security, and real-account permission testing.
- Added `docs/EDGE_CASE_AUDIT.md` as the release test and risk record.

## 2026-08-23 - Multiple-reviewer workflow foundation

- Confirmed the client-requested multi-reviewer model matches the existing
  relational `Review_Assignments`, `Review_Comments`, and `Audit_Events` schema.
- Prepared an idempotent seed for representative Author, Reviewer, and Publisher
  directory records, memberships, and roles.
- Executed the workflow seed successfully in Creator; the directory now contains
  the demo admin, one Author, two Reviewers, and one Publisher.
- Compiled and saved the guarded `submit_article_for_review` map function in the
  Creator Default namespace.
- Prepared a guarded server-side Submit for Review function that validates the
  actor and revision, creates selected assignments and shared queue slots, freezes
  the revision, advances article state, and records an audit event.
- Selected a private OAuth2 Creator Custom API as the supported widget-to-Deluge
  boundary for state-changing workflow operations.
- Created and enabled the POST Custom API at
  `https://www.zohoapis.in/creator/custom/opensourceindia22/submit_article_for_review`
  using OAuth2, application/json, Key and Value arguments, All users, and the
  Standard response wrapper.
- Connected the Article Workspace to active employees with active Reviewer roles;
  the primary author is excluded from the eligible list.
- Added a focused Submit for Review dialog with suggested-reviewer multi-selection,
  shared queue mode, approval-policy context, and remaining-slot queue behavior.
- Added save-before-submit coordination, Custom API response normalization,
  successful-transition feedback, and read-only locking after submission.
- Verified the local flow end to end: Ravi and Meera appear as eligible reviewers,
  shared queue creates one Standard-policy assignment, the article becomes In
  Review, the revision becomes Submitted, and editing controls are disabled.
- Rebuilt, validated, and packed `editor-widget/zet/dist/zet.zip` for the live
  Creator smoke test.
- The first live submission reached the Custom API and correctly loaded eligible
  reviewers, but the actor guard compared the stored email with `zoho.loginuser`.
  Corrected identity resolution to match `Work_Email` with `zoho.loginuserid`,
  with `Creator_Username` and `zoho.loginuser` retained as a fallback.
- Retried the live submission with Ravi Reviewer after the identity correction.
  Creator reported one assignment created, advanced the article to In Review,
  advanced Revision 1 to Submitted, and the widget enforced read-only mode.
- Verified the resulting Creator records: Ravi Reviewer is Assigned from Author
  Suggested, and Audit Events records Piyush Tyagi moving the article from Draft
  to In Review with one review assignment.

## 2026-08-22

- Established the initial product definition, architecture, workflow, data model,
  delivery phases, and decision log.
- Confirmed that the repository started without product code or Git metadata.
- Next: answer the product-definition questions and finalize Milestone 0.
- Confirmed configurable multiple approvals, role-separated publishing,
  English-only content, category and tag taxonomy, public blog discovery features,
  and Asia/Kolkata scheduling.
- Defined the premium editor direction and initial feature scope.
- Confirmed reusable approval policies, suggested-reviewer validation, shared
  review queues, no review deadline, controlled publishing, and rejection rules.
- Began the field-level Zoho Creator application specification.
- Verified that the demo account is on the India data center, supports Creator 6
  Environments, and currently has a 13-day trial with sufficient prototype limits.
- Identified an older `genedrift-editorial-platform-practical-v3` application and
  reserved it as read-only reference rather than reusing it.
- Selected DS import as the Creator bootstrap method. The already-created blank
  application remains untouched while the imported application is validated.
- Reviewed the supplied practice DS strictly as a Creator 6 syntax reference;
  none of its editorial architecture was adopted.
- Generated the first production schema baseline at
  `creator/Genedrift_Editorial_Platform_Production.ds`: 17 forms, 17 reports,
  relationships, sharing scaffold, responsive settings, and role-oriented menu.
- Added `creator/IMPORT.md` with the validation-import procedure and boundaries.
- Next: run the DS through Creator's importer, correct any parser-specific issue,
  then add seed configuration and lifecycle workflows against validated links.
- Creator validation pass 1 reported the 255-character maximum for single-line
  fields. Corrected all four schema fields that exceeded that platform limit.
- Creator validation pass 2 reported missing Web section mapping. Added every
  form to exactly one role-oriented app-menu section; visibility will be reduced
  later through section visibility and permission configuration.
- Creator validation pass 3 succeeded. The complete 17-form schema, reports,
  relationships, and Web menu are now live in the validation application.
- Next: seed controlled configuration records, confirm generated link names,
  and implement lifecycle validation and transition workflows.
- Confirmed the validation app link name as `genedrift-editorial-platform` and
  mapped the current Creator login to the demo administrator identity.
- Added an idempotent one-time configuration seed function for the demo employee,
  editorial team, role assignments, approval policies, taxonomy, and site settings.

## 2026-08-23

- Confirmed the seed totals and successfully created the first Draft article.
- Installed the Articles Created -> Load workflow that generates the article UUID,
  defaults owner/author/policy, and protects lifecycle-managed fields.
- Verified the stored article export: generated UUID, Piyush Tyagi ownership,
  Standard Review policy, Regulatory Affairs category, and Draft state.
- Scaffolded `editor-widget` with React, TypeScript, Vite, TipTap 3, Lucide icons,
  Creator Widget SDK V2, and an isolated mock repository for local development.
- Implemented Creator article loading, idempotent Revision 1 creation, active draft
  pointer updates, structured-document upload/read, revision metadata updates,
  checksum generation, metrics, autosave, and local recovery.
- Built the first editorial workspace UI with a writing canvas, compact formatting
  toolbar, metadata inspector, SEO fields, preview mode, responsive behavior, and
  explicit loading/save/error states.
- Verified local typing, autosave, reload persistence, preview read-only behavior,
  and 390px mobile layout with no page overflow.
- TypeScript and production builds pass. Production dependencies have zero known
  audit findings. Zoho ZET validation passes and produces a 243 KB widget ZIP.
- Added the first complete image workflow: cover image upload/edit/replace/remove,
  inline image insertion and metadata editing, required alt text, captions,
  credits, image dimensions, checksums, and reusable Media Asset persistence.
- Kept canonical TipTap JSON portable by storing media IDs rather than temporary
  browser object URLs; media previews are rehydrated when the workspace loads.
- Verified cover and inline image upload, autosave, metadata editing, reload
  persistence, desktop layout, 390px mobile layout, and zero horizontal overflow.
- Updated the Creator schema so `Media_Assets.Draft_File` supports Creator's
  required two-step record creation and file upload process. The rebuilt 249 KB
  widget ZIP passes TypeScript, production build, and Zoho ZET validation.
- Next: make `Draft_File` optional in the live validation app, upload the updated
  widget to Creator, create the Article Workspace page,
  map its `articleId` parameter, and validate live Revision 1 creation.
- Uploaded the widget into Creator, created the Article Workspace page, and mapped
  the `articleId` page parameter to the widget.
- Diagnosed and fixed Creator File API response differences: uploaded TipTap JSON
  can be returned as an already-parsed `{type, content}` document.
- Prevented TipTap initialization normalization from triggering a blank startup
  autosave that could overwrite stored revision metadata.
- Added a serialized autosave queue, direct editor-document verification, delayed
  metadata readback checks, and field-aware verification for Creator responses.
- Confirmed Creator persisted excerpt, SEO metadata, plain text, document checksum,
  word count, reading time, cover image, inline images, and structured body content.
- Added widget-managed fields to the Article Revisions report so metadata reloads
  correctly through Creator's report API.
- Completed the live persistence smoke test, including new-image upload followed by
  full page refresh. The editor foundation is now accepted for the prototype.
- Next: implement test editorial identities and the complete submit, assignment,
  review, changes-requested, approval, and publishing-permission lifecycle.

## 2026-08-28

- Provisioned a clean Catalyst Development project named
  `gd-genedrift-publishing-dev` with private/public Stratus buckets, the six
  publishing Data Store tables, an AppSail deployment, and the AppSail Job Pool
  `gdgenedriftpublishing`.
- Confirmed AppSail health and configuration checks, including development-mode
  Creator endpoints and presence of refreshable OAuth configuration.
- Installed the Creator Catalyst variables, handoff/validation/callback functions,
  and enabled the two private OAuth2 Custom APIs. Disabled the legacy local
  publishing schedules during boundary testing.
- Ran the first no-media immediate-publish test. Creator safely retained the
  Approved state and recorded `Catalyst Handoff Rejected` with
  `Unexpected publication error`.
- Confirmed Catalyst created the request nonce and stored the complete immutable
  private snapshot. The fault is therefore after snapshot storage, narrowed to
  the request-row snapshot/status update or Job Pool submission.
- Recorded identifiers, evidence, and the exact next diagnostic in
  `docs/CATALYST_LIVE_CHECKPOINT_2026-08-28.md`.
- The integration remains unverified. Fresh Creator export/negative role tests,
  the full Catalyst Development test matrix, secret rotation, and production
  promotion remain required.

## 2026-08-29

- Added `docs/PRE_CLIENT_DEMO_AND_SCALE_TEST_PLAN.md` with a concise product,
  frontend, role, recovery, media, security, and demo-rehearsal checklist.
- Defined separate evidence for a 1,800-item catalog test, read-only k6 traffic
  test, and controlled publication-workflow throughput test. Recorded that the
  maintained public index is required before claiming a credible large-catalog
  Catalyst benchmark; the current public API still scans all pointer objects.

## 2026-08-31

- Diagnosed the live inline-image disappearance as an expiring Creator preview
  source: the media node remained and displayed alt text, but the widget copied
  a host-owned `setImageData` source from a temporary image into TipTap.
- Changed Creator media hydration to prefer `FILE.readFile` bytes and generate a
  widget-owned object URL, with nested host-response handling and `setImageData`
  retained only as a compatibility fallback. Newly uploaded images also use a
  separate widget-owned preview during the first autosave.
- TypeScript, production build, ZET validation, ZIP archive integrity, and all 29
  Catalyst publication/media tests pass. Repacked
  `editor-widget/zet/dist/zet.zip`; SHA-256
  `cabb80d71ef1b73ae84a4156c166a491673b5820897db9ca8a36e3b5972fe811`.
- Live widget replacement and manual wait/save/reload verification remain pending;
  the integration is not marked verified.
- Confirmed live that the next cover and inline uploads created valid Media Library
  rows; image permissions and storage succeeded. The revision save instead failed
  on the widget's stale-version guard, leaving the server revision blank.
- Added bounded save-precondition consistency reads so Creator's temporarily stale
  report state cannot turn sequential same-session media edits into a false
  multi-tab conflict. Genuine divergent checksums/tokens remain blocked.
- Rebuilt and ZET-validated the widget. Current package SHA-256 is
  `7f7a6f4dd57f6f744113e57248b0724b7bda631b058bfa95c52185c7a57fd783`.
- The next live test reached `Saved`, but both the saved cover and inline image
  rehydrated as broken image boxes. This narrowed the remaining defect to the
  widget decoding Creator's post-save file response, not storage or saving.
- Updated Creator image hydration to recognize SDK API file paths and nested URL
  wrappers, resolve Creator-protected image sources through `UTIL.setImageData`,
  and retain a widget-owned Blob URL when the resolved source can be read.
- TypeScript, production build, ZET validation, packaging, and ZIP integrity pass.
  Current `editor-widget/zet/dist/zet.zip` SHA-256 is
  `413927f23f6dc6802f6c9e83b9cc531a67caf5a45b6ef285816b1ca322bf8870`.
  Live wait/save/reload confirmation remains required; integration is unverified.
- Cross-browser Safari and Arc testing showed the stored image still failed after
  the local preview and confirmed the defect is not browser cache. Arc's separate
  stale-session warning cleared on hard reload; the image failure remained.
- Replaced copied temporary Creator preview URLs with protected-source markers.
  Cover, media-dialog, and TipTap node-view images now give their actual DOM image
  element to Creator SDK `UTIL.setImageData` after every render and reload.
- TypeScript, production build, ZET validation, bundle inspection, packaging, ZIP
  integrity, and `git diff --check` pass. Current package SHA-256 is
  `7539085845948824a40cad45bcce1d978367ad21c5236154405a9fc6e366eb5f`.
  Live media persistence verification remains pending; integration is unverified.
- The next live test confirmed the cover survives autosave but the inline image
  disappears at the autosave transition. Creator media retrieval therefore passes;
  the remaining failure was isolated to TipTap's inline node lifecycle.
- Replaced the imperative inline media node with a React node view so Creator's
  protected image loader runs after the final editor image element is mounted.
- TypeScript, production build, ZET validation, packaging, and ZIP integrity pass.
  Current package SHA-256 is
  `af854c48fd03dd6ec0da7f0b951e4c53fe791324b7ce95aac95f4f55eebc4c67`.
  Live inline autosave/reload verification remains pending; integration is unverified.
- The mounted inline node still failed after autosave while the cover continued
  to pass. The remaining difference was the media lookup response: inline `MED-*`
  UUIDs used a list query, while the cover used a full record-by-ID response.
- Inline UUID resolution now re-fetches the matched Creator record by ID before
  resolving `Draft_File`, making inline and cover retrieval identical.
- TypeScript, production build, ZET validation, packaging, ZIP integrity, and
  `git diff --check` pass. Current package SHA-256 is
  `fd7cc1bf5623590097076ac65181d348e0396e0498a5a9e062ce3050c6e4e673`.
  Live inline autosave/reload verification remains pending; integration is unverified.
- The follow-up made the remaining timing boundary explicit: immediately after
  upload, the new media row is available by Creator record ID before a `MED-*`
  report criteria query is guaranteed to expose it.
- Inline media nodes now retain both the portable UUID and Creator record ID. The
  editor hydrates by direct record ID on the first autosave; publication continues
  to persist and validate only the portable media UUID.
- TypeScript, production build, ZET validation, packaging, ZIP integrity, and
  `git diff --check` pass. Current package SHA-256 is
  `35100750e0f85eaa709350993608984ce6c1485b3fb38a69b9a10ddd54ce38dd`.
  Fresh inline autosave/reload verification remains pending; integration is unverified.
- Live inline autosave now functionally passes: the image briefly blinked while
  switching from the local preview to Creator's protected source, then returned
  and remained visible in the Saved state. Reload persistence is still required;
  the momentary autosave flicker is retained as a UI-polish defect.
- Cross-account reload now passes in Anshika Tyagi's Reviewer session: the article
  entered In Review and both inline and cover media loaded from Creator. Media
  persistence is functionally passed. The initial missing-image/blink remains a
  tracked loading-state polish item; overall integration remains unverified.
- Diagnosed the later `draft metadata changed` save failure with a read-only live
  record audit. The server still held the complete 2,051-word Draft, media, SEO,
  and checksum; the new excerpt alone remained in local recovery. A separate
  account merely viewing the article did not cause the conflict.
- Replaced the save precondition's all-or-nothing metadata comparison with a
  three-way merge. Non-overlapping metadata propagation is accepted, while body,
  media, workflow-state, and same-field divergent edits retain strict conflict
  protection. Publishing and media code paths were not changed.
- TypeScript, production build, ZET validation, packaging, bundle inspection,
  ZIP integrity, and `git diff --check` pass. Current package SHA-256 is
  `cfae8494d8d848937af7920f16402a4a34372c0c96c4fe1ff9e2183e95743b13`.
  Live replacement and recovery/save confirmation remain pending; integration is
  unverified.
- Live inspection confirmed the later category/tag error was another false
  negative: Creator stored Industry and Market Insights, Cosmetics and Dossiers
  even though widget readback reported failure. The first correction used the
  REST API's documented comma-separated multi-select value and allowed an
  omitted Tags readback after a successful update.
- Widened the desktop writing surface, reduced unused canvas padding, narrowed
  the inspector slightly and allowed toolbar groups to wrap instead of clipping.
  Local visual verification at 1280px displayed the entire formatting toolbar.
- TypeScript, production build, ZET validation, packaging, ZIP integrity, and
  `git diff --check` pass. Current package SHA-256 is
  `b6f5d9b24c3e2a31f1eb41c050983d6277d739daf16d3d9cab7f4da5b6e51ba0`.
  Live taxonomy save/reload and embedded-layout confirmation remain pending;
  integration is unverified.
- Live embedded-widget testing rejected that REST-style tag payload with code
  3001. Restored the ID-array value already proven by the current Widget SDK.
- Decoupled taxonomy from routine revision autosaves. Body, excerpt, SEO and
  media still autosave, while category and tags are written only when the user
  actually changes them. Failed taxonomy saves remain dirty and retryable, and
  local recovery retains taxonomy selections.
- TypeScript, production build, ZET validation, packaging, ZIP integrity, and
  `git diff --check` pass. Current package SHA-256 is
  `7d3f090566140f48444f63d0afcbfdfa58097518cff9f678209c7d9b0d8006e9`.
  Live taxonomy save/reload confirmation remains pending; integration is
  unverified.

## 2026-09-01

- Completed and deployed the public website revamp checkpoint to the existing
  Vercel project `genedrift-vercel-preview-0.4`. Stable live alias:
  `https://genedrift-vercel-preview-04.vercel.app`; deployment ID:
  `dpl_2XJVNVS1f34WSebPsGs6RkW9o6fc`.
- Recovered Vercel dashboard context for future handoff: account
  `opensourceindia22-8134` / `opensourceindia22@gmail.com`, team slug `ztm2`,
  team ID `team_8OHZR3PCWIiPgfRTWDp7crr8`, project ID
  `prj_Nz73OBb1V6bZBIV6W6Qdjj2S2gpG`.
- Confirmed the Vercel project is not connected to Git. The latest deploy was a
  direct CLI production deploy to the existing project. A temporary one-hour
  project-scoped token was created, used, revoked in Vercel, and removed from
  local temporary storage.
- Fixed the Vercel production build by removing `output: "standalone"` from
  `frontend/next.config.ts`; Vercel's managed Next.js build expected the standard
  output layout and had failed with missing `.next/next-server.js.nft.json`.
  Committed this as `cdea0c0 Fix Vercel frontend deployment config`; the public
  revamp commit immediately before it is `a55a727 Revamp GeneDrift public
  website frontend`.
- Post-deploy live checks passed for `/`, `/insights`, and one article detail
  route. The pages rendered the new design/content and had no browser console
  warnings/errors in the checked browser session.
- Continued Phase 1 release-closure testing against the live Creator/Catalyst/
  Vercel setup. Core blog product behavior is now functionally strong, but the
  final release claim still requires fresh Creator DS audit, duplicate/
  idempotency evidence, media-format validation, accessibility/public-site QA,
  and measured 1,800-post scale evidence.
- Completed separate-role visual checks for Author-only, Reviewer-only,
  Publisher-only, and Editorial Admin configurations. Inapplicable actions were
  unavailable; publisher/admin views exposed publishing work correctly; authors
  did not receive review or publishing controls after submission.
- Verified too-soon schedule validation: attempts less than two minutes in the
  future are rejected with a clear error and do not start publication.
- Verified a valid scheduled publication path using
  `SCHED-01 Too-soon Schedule Rejection` at `01 Sep, 01:11`; despite the title,
  the selected time was valid. The article processed, became Published, and
  appeared on the public frontend.
- Diagnosed the stale scheduled-reconcile path from `ROLE-03 Publisher-only`.
  The first live Reconcile attempt hit the approved-revision-pointer guard; the
  next attempt exposed duplicate cron-name handling. Fixes were prepared so a
  Scheduled article with an approved pointer and existing open Schedule job can
  redeliver the same handoff, and duplicate scheduled cron creation is treated
  idempotently for the same generated cron name.
- Deployed/tested the corrected scheduled path with
  `RETRY-02 Scheduled Reconcile — 01 Sep 2026`. The article showed Scheduled
  before its due time, published at `01 Sep, 06:04`, appeared in the Published
  panel and public frontend, then was retracted with reason
  `testing retraction`.
- Verified public retraction behavior visually: the retracted article disappeared
  from public listing/search and its former detail route showed
  `This article has been retracted` with the supplied reason and a browse-current
  action instead of serving the article body. Creator retained the
  Unpublished/Retracted record and immutable-publication wording.
- Verified stale author-edit guard visually using
  `SAFETY-01 Stale Approval Guard — 01 Sep 2026`. After submission, the author
  context was read-only and Save Draft was unusable. After approval/publish, the
  public route served the approved content.
- Added dashboard workflow ownership traces so rows can show who wrote,
  approved, scheduled, published, or retracted an article even when approval or
  rejection comments are blank.
- Applied final dashboard polish using the requested palette: dark deep purple
  `#241653`, primary purple `#5B3FD2`, light lavender `#F0EEFB`, white,
  dark/dark-grey text, and very light neutral surfaces. Ownership traces were
  softened from bulky pills to quieter inline metadata. Scheduled rows now show
  scheduled date/time in general article lists; Approved rows explain they are
  waiting for publisher action; dense laptop-width row spacing was tightened.
- Final widget artifact:
  `genedrift-editor-widget-final-polish-v0.4.5.zip`, SHA-256
  `1210fe55854a2aba1ebffa403c8c87e8a5097ea641e2d17ecbacb0bff0fae8ab`.
  TypeScript, production build, ZET pack, and ZIP integrity passed.
- Latest AppSail artifact present:
  `genedrift-catalyst-appsail-dev-v0.4.2.zip`, SHA-256
  `1834f1924a953c21919d242e79f1d0bdaf847bd3abe35415697dd829afc9c3ff`.
- Added `docs/CURRENT_CHECKPOINT_2026-09-01.md` as the new first-read checkpoint
  for fresh chats. Updated resume/status/release-closure/pre-client docs to
  point at it and record the latest artifact hashes, tested behavior, remaining
  release gates, and Phase 2 boundary.
- Received the client's Phase 2 website-revamp email and attachments:
  `Genedrift Final Sitemap Vendor Development Brief.docx`,
  `Genedrift LF20 Website Design Philosophy 2 (1).pdf`, and
  `Genedrift Presentation.pdf`.
- Extracted the durable Phase 2 requirements into
  `docs/PHASE_2_WEBSITE_REVAMP_CLIENT_BASELINE.md`. Key baseline: bottom-up
  enterprise website rebuild, not current-site reskin; nine-pillar IA of Home,
  Explore, Expertise, Markets, Knowledge Hub, Client Success, Company, Careers,
  Contact; LF20 visual system is the design source of truth; avoid generic stock
  imagery; prepare three initial design/template concepts before full website
  development.
- Captured the production architecture interpretation for client-editable
  website content: Creator remains the CMS/editorial workspace, Catalyst remains
  the approved public content/version/API layer, and Vercel/Next.js remains the
  public presentation layer. Public visitors should not read directly from
  Creator; Phase 2 should extend the already-proven Insights publishing model to
  homepage, expertise, market, company, client-success, careers and other page
  families.
- Diagnosed and fixed the v0.5.4 author-input preservation defect found during
  manual Creator testing on 2026-09-05. The server-side taxonomy and media
  metadata functions used `replaceAll("[[:space:]]+"," ")`, which Zoho Deluge
  treated in a way that removed letters such as `s`, `a`, and `e` from category
  names, tag names, and image alt text. Updated
  `create_editorial_taxonomy_term` and `update_media_metadata` to preserve
  entered display text with only edge trimming, aligned the mock repository, and
  added widget-side verification that saved image alt text and Caption are
  returned and readable after metadata updates.
- Packaged
  `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.5-input-preserve.zip`,
  SHA-256
  `c30186d81ff2d14558df67afb0de0864e9a5ce424aa784670305c03811ee77fe`.
  Typecheck, production build, ZET validation, and ZET packing passed. Live
  Creator upload/function replacement is still pending.
- The user then installed/tested the v0.5.5 function/widget changes manually and
  shared screenshots showing clean taxonomy preservation, cover alt text and
  edited Caption readback, inline image Caption readback, Saved state, and
  submit-for-review retention for `SMOKE v0.5.5 Input Preserve Final Test`.
- Added v0.5.6 publishing-notification polish: dashboard publish, schedule,
  retry, retraction, and in-workspace publish outcomes now render as floating
  notices with a Publishing dashboard action, while ordinary editor notices stay
  inline. Packaged
  `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.6-floating-publishing-notice.zip`,
  SHA-256
  `2ed7f79bcfd2670266501b695fef13f6d9c43de69e4d787739184c1eaafd1561`.
  Typecheck, production build, ZET validation, and ZET packing passed; live
  upload and publish-message verification are still pending.
- Updated the project handoff context for the Phase 2 transition. Phase 1
  Article Workflow Platform is now treated as completed/shared and in
  support/testing mode, with v0.5.5 input preservation visually verified and
  v0.5.6 prepared. The forward project focus is Phase 2 Website Design
  Confirmation: prepare three website template/design concepts, compare them
  against the LF20 design philosophy and current staging references, get client
  direction, then proceed to the full Next.js frontend rebuild after approval.
# 2026-09-05 — Creator refreshed-article support package v0.5.7

- Reproduced the intermittent article-refresh failure in live Creator. An
  expired Creator session first produced HTTP 401 / code 2945 / Z223 responses;
  after a fresh login, the shortened `#Article_Workspace?...` route could still
  strand Creator's live-page loader while `#Page:Article_Workspace?...`
  successfully reconstructed the article after refresh.
- Changed dashboard and article navigation to Creator's explicit `#Page:` URL
  form. Added a no-op callback to `UTIL.setImageData` because the current V2 SDK
  invokes the documented-optional callback on some protected-image failures.
- TypeScript, production build, and ZET validation pass. Packaged
  `editor-widget/genedrift-editor-widget-support-v0.5.7-refresh-route.zip` with
  SHA-256 `4868fce60fc067539e44ccca0418289f3ec36a3b62c9dd976ac5b9d180f30df3`.
- Live upload and manual refresh verification remain pending.
