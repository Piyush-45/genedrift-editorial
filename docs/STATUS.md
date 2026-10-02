# Current Status

Last updated: 2026-09-07

## Active Milestone

Milestone 6: Phase 2 website design confirmation and frontend rebuild planning

Phase 1 Article Workflow Platform is completed and shared with the client for
testing. A 2026-09-04 Creator-account migration dry run to `piyugene02` now has
one successful end-to-end publish after fixing widget/account/OAuth setup, and
the 2026-09-05 v0.5.5 smoke test confirmed input preservation, media caption
readback, save/reload, and submit-for-review retention. The client-facing
tracker now positions the project as:

- Phase 1 Article Workflow Platform: completed/shared for testing.
- Phase 2 Website Design Confirmation: pending client confirmation.
- Phase 3 Final Website Frontend Build: estimated 3-5 days after design and
  blog workflow approval.
- Phase 4 Client System Migration and Deployment: estimated around 2 days after
  frontend/workflow approval.

The default forward focus is now Phase 2. Treat Article Workspace work as
support/testing unless the user explicitly asks for more Creator changes.

Current shared staging links:

- Blog / Insights: `https://genedrift.site/insights`
- Design references: `https://genedrift.site/designs`

Latest resume snapshot is `docs/CURRENT_CHECKPOINT_2026-09-07.md`.

The three Phase 2 hero concepts are implemented and awaiting application of the
client's review. The full homepage remains intentionally unbuilt until a
direction is selected. Website information/editing planning now defines nine IA
areas, about 14 reusable page families, a provisional 37–46 curated launch-page
range, and a structured Creator → Catalyst → Next.js content flow. See
`docs/PHASE_2_WEBSITE_INFORMATION_AND_EDITING_ARCHITECTURE_2026-09-05.md` and
`docs/PHASE_2_CMS_FORM_AND_COMPONENT_BLUEPRINT_V1.md`.

The 2026-09-06 cross-account test proved that a separate Creator user with base
`Editorial Author` / `Write` access could perform internally assigned Author and
Reviewer responsibilities, claim an assigned review and approve it; adding the
internal Publisher responsibility exposed Publish/Schedule controls. This is
functional evidence, not final least-privilege evidence, because the broad
Creator Write profile exposes native application areas.

One subsequent Publish request stalled because Catalyst could not refresh its
Creator OAuth token. The Catalyst row reached RetryScheduled/attempt 3 with
`CREATOR_OAUTH_REFRESH_FAILED` and HTTP 200. The operator reports regenerating
and exchanging the India Self Client code, updating the real refresh token and
redeploying AppSail v0.4.3. The affected request's final Succeeded/public state
was not captured and remains a support verification item.

Current live-smoke verified Creator widget package for the migrated
`piyugene02` app:

- `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.5-input-preserve.zip`
- SHA-256:
  `c30186d81ff2d14558df67afb0de0864e9a5ce424aa784670305c03811ee77fe`

Prepared local notification-polish package for upload:

- `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.6-floating-publishing-notice.zip`
- SHA-256:
  `2ed7f79bcfd2670266501b695fef13f6d9c43de69e4d787739184c1eaafd1561`
- Changes publishing/schedule/retry/retraction outcomes to floating notices
  with a Publishing dashboard action. Ordinary editor notices stay inline.

Previous rollback reference:

- `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.1-taxonomy-fix.zip`
- SHA-256:
  `1068232c6d529c4df7a0c573d9b58e699321ccc83149f0837e684362bb4634bd`

The v0.5.4 install and admin reset are live verified from the user's
2026-09-05 screenshot: the Editorial Command Center loads, Reset test content
returns the dashboard to zero articles/review items, and the live refresh copy
shows the idle one-minute check interval cleanly. Manual post-reset testing then
exposed a v0.5.4 server-side input-preservation defect: category/tag names and
image alt text were rewritten by an invalid whitespace regex. v0.5.5 removed
the rewriting and verifies saved image metadata. The user's v0.5.5 screenshots
confirm clean category/tag preservation, cover alt text and edited Caption
readback, inline Caption readback, save/reload, and submit-for-review retention.
Cross-account reviewer claim/approval and Publisher-control visibility have now
passed. The OAuth-remediated publication's final Succeeded/public state and
v0.5.6 floating publishing notices still lack captured verification.
Setup and smoke matrix:
`creator/WORKFLOW_POLISH_SETUP.md`.

Post-reset public cleanup is also complete for the three development posts that
remained visible from Catalyst after Creator was emptied:
`editable-tags-checking`, `smoke-test-1`, and `hanumaaaan`. The user confirmed
the frontend no longer shows them. Future durable public cleanup should keep
`GD_Public_Index` and `GD_Published_Pointers` aligned by `Article_UUID`.

The live v0.5.0 smoke test published successfully without tags but exposed code
3001 when a newly created tag was applied. v0.5.1 moved taxonomy persistence to
the guarded `save_article_taxonomy` Custom API and now passes live save/reload
and publication. v0.5.2 addressed the subsequent Caption persistence defect
through `update_media_metadata`; v0.5.5 retesting confirmed cover and inline
Caption readback again after the input-preservation fix.

Latest Catalyst AppSail package:

- `genedrift-catalyst-appsail-dev-v0.4.3-media-caption.zip`
- SHA-256:
  `cdd7eb7e45e2a25ab4214bbdda71a5b94ce386171ff4d588f25e25070eec6e4b`
- v0.4.3 keeps legacy Credit in the immutable payload shape but no longer
  renders it into inline-image HTML. The current frontend build applies the
  same Caption-only rule to cover images.

Migration note:

- Current migrated Creator owner: `piyugene02`
- Current app link: `genedrift-editorial-platform`
- Working app URL:
  `https://creatorapp.zoho.in/piyugene02/genedrift-editorial-platform#Article_Workspace`
- Use `docs/CREATOR_ACCOUNT_MIGRATION_RUNBOOK.md` before any future client
  transfer.
- Rotate OAuth credentials that were exposed during debugging before any real
  production/client handoff.

The latest widget UX pass made approved authored articles visible to authors,
separated review decision notes from discussion comments, clarified selected
tags in the sidebar, preserved latest in-widget category/tag state through
submit/resubmit, reduced dashboard controls, added person/date filters, capped
panels at five rows, and kept destructive retraction behind a confirmation
dialog/overflow path.

The remaining immediate work is to begin Phase 2 design confirmation: prepare
the three requested website template/design concepts, compare them against the
LF20 design philosophy and current staging references, capture client direction,
then start the full Next.js website frontend build after design approval.

## Previous Milestone Context

Milestone 4: Development verification and client-demo readiness

The Phase 1 Insights/blog product is functionally strong after 2026-09-01 live
testing. The editor, recovery, conflict detection, submission boundary, reviewer
claim, review decisions, N+1 changes-requested loop, role-aware dashboard,
shared queue, regulated two-reviewer approval, separate-role visual matrix,
immediate publication, scheduled publication, too-soon schedule rejection,
public listing visibility, and retraction flow have all passed live functional
checks. The first public website revamp pass for homepage, Insights archive, and
article detail pages is also live on the existing Vercel project.

The previous resume snapshot was `docs/CURRENT_CHECKPOINT_2026-09-01.md`.

Do not call Phase 1 fully release-ready yet. The remaining evidence gates are:
fresh Creator DS export audit, duplicate/idempotency stress retest, one fresh
regulated-review confidence run, media-format validation, accessibility/public
site QA, and measured 1,800-post scale evidence.

Phase 2 website-revamp baseline has now been received from the client and is
summarized in `docs/PHASE_2_WEBSITE_REVAMP_CLIENT_BASELINE.md`. It defines a
bottom-up enterprise website rebuild aligned to the LF20 presentation/design
system, with three initial sample templates/design concepts requested before
full development.

Latest deployable artifacts:

- Public frontend:
  `https://genedrift-vercel-preview-04.vercel.app`
  - Vercel project `genedrift-vercel-preview-0.4`, deployment
    `dpl_2XJVNVS1f34WSebPsGs6RkW9o6fc`.
  - Latest local commits: `a55a727 Revamp GeneDrift public website frontend`
    and `cdea0c0 Fix Vercel frontend deployment config`.
  - Vercel account shown in dashboard: `opensourceindia22-8134`
    (`opensourceindia22@gmail.com`), team/workspace `ztm2`.
  - Vercel project is not connected to Git; the latest deploy was direct CLI
    deployment to the existing project. The temporary one-hour token used for
    deployment was revoked and removed locally.
- Creator widget:
  `genedrift-editor-widget-dashboard-ux-v0.4.8.zip`
  SHA-256
  `684e9b57d32688b99b5b25ae56a8039ef899b0b5ca7cdfb145b4541996250020`.
- Catalyst AppSail:
  `genedrift-catalyst-appsail-dev-v0.4.2.zip`
  SHA-256
  `1834f1924a953c21919d242e79f1d0bdaf847bd3abe35415697dd829afc9c3ff`.

## Completed

- Production-oriented Creator schema imported and validated: 17 forms and reports.
- Idempotent seed data for the demo administrator, team, memberships, editorial
  roles, approval policies, categories, tags, and site settings.
- Draft article initialization with generated UUID, owner, author, approval policy,
  category, workflow state, and active Revision 1 relationship.
- React, TypeScript, TipTap, and Creator Widget SDK V2 Article Workspace.
- Structured document persistence in `Article_Revisions.Editor_Document`.
- Autosave, manual save, serialized save queue, checksum verification, and local
  recovery after failed or interrupted saves.
- Cover and inline image upload, metadata, replacement, removal, rehydration, and
  Creator `Media_Assets` persistence.
- The widget now persists a normalized `Referenced_Media_UUIDs` list per
  revision. Catalyst handoff queries only that revision's inline/featured/social
  media (capped at 200), avoiding a full media-library scan at the expected
  editorial volume.
- Excerpt, SEO title, SEO description, robots directive, word count, and reading
  time persistence.
- Live Creator smoke test passed for body content, metadata, cover image, inline
  image, autosave, and reload persistence.
- Creator report configuration exposes widget-managed revision fields so API
  reloads return persisted metadata.
- Five representative editorial identities and their active role assignments are
  available for workflow testing: admin, author, two reviewers, and publisher.
- The guarded `submit_article_for_review` Deluge function is installed and exposed
  through a private OAuth2 Creator Custom API.
- The widget loads eligible reviewers, supports suggested reviewers or the shared
  queue, saves before submission, invokes the Custom API, advances the UI to In
  Review, and locks the submitted revision.
- Local submission tests passed for reviewer discovery, queue submission, state
  transition, assignment count feedback, and read-only enforcement.
- The updated widget passes TypeScript, production build, ZET validation, and ZET
  packaging.
- The first live suggested-reviewer submission passed: Creator created one
  assignment, moved the article to In Review, moved Revision 1 to Submitted, and
  the widget locked editing.
- Creator record verification passed: Ravi Reviewer has an Author Suggested,
  Assigned review row and Audit Events contains the Draft-to-In Review submission
  event with Piyush Tyagi as actor.
- Guarded reviewer functions now cover assignment claiming, threaded-data-ready
  discussion comments, independent decisions, distinct approval counting,
  terminal state transitions, cancellation of remaining work, and audit events.
- The Article Workspace now presents reviewer actions in a focused dialog and
  keeps submitted content read-only while review decisions are made.
- The reviewer widget package passes TypeScript, production build, ZET validation,
  and ZET packaging.
- Brand-new revisions with no uploaded editor document now initialize as an empty
  TipTap document. This covers both rejected and resolved Creator response code
  `3730` variants instead of treating the response object as corrupt content.
- The fresh-article live retest passed after that correction: formatted body,
  excerpt, SEO title, and SEO description survived save and full reload.
- The same fresh revision also passed cover-image and inline-image persistence;
  the uploaded media and its metadata remained intact after a full reload.
- The live two-tab test passed: a stale tab could not overwrite a newer metadata
  save and reported save failure instead of a false `Saved` state.
- Full revision version checks now detect stale tabs even when only excerpt, SEO,
  robots, media, title, slug, metrics, or other metadata changed.
- Save verification now covers document content and all editable metadata with
  delayed Creator consistency retries.
- Recovery restoration synchronizes the editor canvas, is limited to editable
  drafts, and safely reports malformed recovery data.
- User-facing revision metadata is normalized before write and verification, so
  restored trailing whitespace or CRLF differences cannot cause false save
  failures after Creator trims stored values.
- The release edge-case article passed live recovery and suggested-reviewer
  submission after the normalization fix: Creator created one assignment,
  advanced the article to In Review, locked the revision, updated Review Queue,
  and recorded the matching audit event.
- Reviewer claim and comment functions reject duplicate participation, closed
  discussions, invalid parents, and oversized input.
- The release risks, production boundaries, and structured smoke-test matrix are
  recorded in `docs/EDGE_CASE_AUDIT.md`.
- A real Harsh reviewer test successfully reached both terminal review paths:
  approval moved the article and revision to Approved, and Changes Requested
  moved the article to Changes Requested while leaving Revision 1 Submitted.
- `record_review_decision` now includes the N+1 draft revision operation locally:
  Changes Requested clones the submitted revision into the next Draft revision,
  points `Active_Draft_Revision_ID` at it, and records audit metadata.
- The N+1 operation passed live verification on `testing new workflow n+1`:
  Revision 1 remained Submitted and Revision 2 was created as Draft.
- A live export of `Articles_Report` omitted `Active_Draft_Revision_ID`, causing
  the workspace to fall back to Revision 1 and appear read-only. The widget now
  falls back to the latest Draft revision for Draft or Changes Requested articles
  when the active draft pointer is missing from the report read model. Creator
  should still expose `Active_Draft_Revision_ID` in `Articles_Report`.
- The full N+1 resubmission loop passed live verification on
  `testing new workflow n+1`: Revision 2 became Approved while Revision 1 stayed
  Submitted.
- Article Workspace now has a dashboard mode when opened without `articleId`.
  It loads current user, articles, review assignments, review inbox, article
  work, and review history, then routes Open actions into the existing article
  editor by record ID.
- The dashboard package passes TypeScript, production build, ZET validation, and
  ZET packaging.
- Dashboard, row navigation, New Article, reviewer inbox, claim, and review
  history have passed live tests in the admin and Harsh accounts.
- The dashboard has passed the 2026-09-01 separate-role visual matrix for
  Author-only, Reviewer-only, Publisher-only, and Editorial Admin contexts.
  Inapplicable actions are hidden or unavailable; publisher/admin users see
  publishing work in Queue/Publishing; authors see active authored work without
  review or publishing controls.
- Draft editing is now limited in the widget and save repository to the owner,
  primary author, CEO, or Editorial Admin. Review history carries the exact
  reviewed `revisionId` and unauthorized reviewers cannot open a working Draft.
- Regulated Review has passed live testing with two distinct reviewer approvals:
  the first approval keeps the article In Review, and the second approval moves
  the article to Approved.
- Shared queue behavior has passed live testing: reviewer dashboards show one
  claimable row per regulated revision, while admin can still see queue-slot
  detail.
- Dashboard polish now includes the GeneDrift purple/lavender palette,
  less-heavy workflow ownership metadata, scheduled date/time visibility on
  Scheduled rows, clearer approved-to-publisher handoff text, better empty-state
  copy, and denser laptop-width row spacing.
- Historical Publisher/Admin local publishing was implemented in the widget and Deluge:
  Approved articles can be published through a guarded Custom API, creating a
  `Publication_Jobs` row, marking the approved revision Published, moving the
  article to Published, storing published pointers/timestamps, and writing an
  audit event.
- Admin publishing passed live testing: the Custom API is installed, the
  dashboard returned `Article published.`, and Audit Events recorded
  `Article Published` from Approved to Published.
- Publisher publishing passed live testing with Harshu as a combined
  Reviewer+Publisher user: the dashboard exposed publishing work, the Publish
  action succeeded, the ready-to-publish queue cleared for both Harshu and Admin,
  and Recent Activity/Audit Events recorded the published revisions.
- A fresh Creator Audit Events inspection captured a later complete Catalyst
  publish-to-retract loop for article
  `ART-022254fb3b8ade6547c08e54b3c79187`: the publish callback moved Approved to
  Published at 23:49:05 on 2026-08-29, followed by retraction job
  `471741000000056044` and callback
  `callback_36498adcbe77a6b2f2a48614bc45ddbc221e7f0c`, which moved Published to
  Unpublished at 23:49:44. This closes positive Creator audit evidence for that
  later loop only; it does not replace the fresh DS or negative-role gates.
- Creator permission/profile and data-sharing setup guidance is prepared in
  `creator/PERMISSION_SHARING_SETUP.md`. It is not live verified.
- Notification handoffs are implemented locally for submission, claim, review
  decision, changes requested, ready-for-publishing, scheduled, and published
  states through `send_editorial_notification`. After the helper and submission
  function were re-saved, live reviewer submissions recorded handoffs for one and
  two recipients. A direct Built-in Email test was accepted for both Gmail and
  the custom-domain address, and the Gmail message was delivered to Spam through
  Creator's trial sender. The Creator notification mechanism is live verified;
  custom-domain inbox delivery remains a mail-domain concern.
- Historical Publisher/Admin scheduling was implemented through
  `schedule_approved_article`, `process_scheduled_publication`, the
  `Articles.Scheduled_At` date-field workflow pattern, and the dashboard
  Schedule action. The batch `process_scheduled_publications` function is a
  manual/backfill safety net. The widget package has been rebuilt,
  ZET-validated, and repacked. A live 18:53 test passed the primary path:
  `Article Scheduled` appeared at 18:52 and `Scheduled Article Published` at
  18:53, with notification handoffs at both transitions. Publication-job and
  article-state/timestamp checks passed: Schedule and Publish jobs both
  Succeeded in one attempt, and the article is Published with matching Scheduled
  At and Last Published At timestamps. The final Revision 1 Published-state
  check and a second independently timed article remain pending.
- The 2026-08-26 live DS export has been audited in
  `docs/LIVE_DS_AUDIT_2026-08-26.md`. It confirms the expected 17-form/17-report
  structure, but also exposes older ungrouped authorization/query criteria in
  four live functions, broad Author/Reviewer profiles, absent Publisher/Admin
  profiles and Creator roles, incomplete Publisher/Admin sharing, raw-form menu
  exposure, and missing report read-model fields.
- The local production DS web menu now exposes reports rather than raw forms and
  its operations reports include notification metadata, job start time, and the
  future Catalyst publication identifier.
- A Node.js 22 Catalyst AppSail publishing service is implemented under
  `catalyst/`. It validates signed/replay-protected handoffs, stores an immutable
  approved snapshot, creates content-addressed published versions, advances a
  versioned current pointer, and prevents stale revisions from replacing newer
  content.
- Publication workers are idempotent and lease-guarded, with bounded exponential
  retries. One-time Catalyst jobs own both scheduled publication and retry
  execution.
- The worker performs a fresh Creator preflight immediately before publication,
  confirming the exact open job, article/revision identities, approved pointer,
  state, and document checksum.
- Creator result delivery uses a separate Catalyst outbox and retry policy.
  Creator applies signed callback events idempotently through
  `Audit_Events.Event_UUID`; callback failure cannot roll back publication.
- Creator publish/schedule functions now queue and hand off work instead of
  marking records Published locally. Only the signed Catalyst callback path may
  complete the Creator transition.
- Catalyst TypeScript compilation and twenty automated boundary tests pass,
  covering HMAC tampering/skew, duplicate delivery, immutable publication,
  stale revisions, retries, callback isolation, due-time scheduling, media
  source mappings, Stratus ingestion/checksum drift, and Creator preflight denial.
- The clean no-media Catalyst immediate-publish case passed live in Development:
  request and attempt succeeded once, immutable version and version-1 pointer
  agree, the public Stratus JSON returned HTTP 200 with matching identities/hash,
  the callback was Delivered once, and Creator moved the job/article through the
  Published audit and notification path.
- AppSail service `0.1.5` passed a fresh scheduled publication in Development:
  the 09:35 IST job completed at 09:35:02 with one attempt and HTTP 200. This
  confirms the offset-aware scheduled lease fix operationally; matching
  Catalyst row captures remain to complete the evidence packet.
- AppSail `0.2.1`, Creator functions, and the Article Workspace now pass the
  positive immediate retraction path live. Article
  `ART-767af2ab02d5961458d3dd6a7ba584d1` completed Unpublish in one attempt and
  HTTP 200 in about one second; Creator moved it to Unpublished/Retracted, while
  Catalyst retained the immutable publication and advanced its pointer to
  version 2 with `Serving_Status = Retracted`, timestamp, reason, and event ID.
  The matching Creator audit-event capture and negative role matrix remain
  pending.
- Catalyst Stratus is now the accepted object boundary: private immutable
  snapshots and public immutable article JSON/media use separate buckets.
  Media is downloaded from Creator, validated by file signature, size, checksum,
  and dimensions, written under a content-addressed key, and returned through
  the signed Creator callback.
- Exact Catalyst Data Store schema, Stratus buckets, Job Pool, secrets, Custom APIs,
  scheduling switch, and promotion tests are documented in `catalyst/README.md`
  and `creator/CATALYST_PUBLISHING_SETUP.md`.

## In Progress

- The Next.js public frontend is implemented in `frontend/` and passes strict
  typecheck and production build. It includes the public homepage, archive
  search/category/tag filters, pagination, article pages, retraction and error
  states, responsive styling, metadata, JSON-LD, robots, and sitemap. The latest
  public website revamp is deployed to Vercel project
  `genedrift-vercel-preview-0.4` at
  `https://genedrift-vercel-preview-04.vercel.app` with the Development API and
  canonical origin configured. Post-deploy live checks passed for `/`,
  `/insights`, and one article detail route with no browser console
  warnings/errors. Earlier live checks covered homepage, archive/category,
  detail, canonical/JSON-LD, robots, sitemap, 404, retraction/noindex, console,
  and 390px overflow. The retracted frontend route returns HTTP 200 rather than
  strict page-level 410. Lighthouse, final branding/content, and the remaining
  device/accessibility matrix are pending.

- Cache-hardened AppSail `0.3.1` is deployed and live verified for public
  listing, filtering/pagination, detail, taxonomy, ETag/304, HTTP 410, a
  five-second must-revalidate detail cache, and `no-store` retraction responses.
  Configure `PUBLIC_SITE_BASE_URL` before testing sitemap/RSS. Artifact SHA-256:
  `13018639a290a6366c0c348e191d97ac9907ab158cf3b339301f831c619573f6`.
- AppSail `0.4.0` is deployed in Development with compact `GD_Public_Index` rows.
  Publish/retract workers repair the index before success; list/search/feed
  routes read compact rows, and detail verifies the current pointer before
  loading one immutable object. An authenticated rebuild route migrates existing
  pointers. All 29 Catalyst tests pass. The seventh table and its documented 24
  application columns are provisioned; `/health` reports `0.4.0`, and
  `PUBLIC_SITE_BASE_URL` points at Vercel. The authenticated rebuild indexed nine
  current pointers on 2026-08-30, and public listing now returns five Published
  articles. Live list/search/filter/pagination, detail, ETag/304, sitemap, RSS,
  missing GET 404, and retracted GET 410 checks pass. Retracted HEAD still returns
  200 at the AppSail host while GET is 410 and caching is `no-store`; retain this
  as an explicit method mismatch. Prepared ZIP SHA-256:
  `fc3fec70f8aafd5e7a4a6405be8988dd5df02d2bc2897758f3393babb7821d06`.
- Deterministic scale tools now provide 1,800 visible synthetic articles plus a
  410 case, a matching local API, staged k6 read profiles, and a performance
  report template. Local homepage, deep-page correction, filters, detail,
  retraction/noindex, 390px long-title, and console checks passed. This is local
  catalog UX evidence, not Catalyst/Vercel capacity evidence.
- The dashboard package with adaptive five-second active-job refresh,
  45-second idle refresh, hidden-tab pause, in-flight request deduplication,
  and last-updated/error feedback is uploaded and live verified through the
  complete workflow. That final-polish widget artifact has been superseded by
  `genedrift-editor-widget-dashboard-ux-v0.4.8.zip`, SHA-256
  `684e9b57d32688b99b5b25ae56a8039ef899b0b5ca7cdfb145b4541996250020`.
- The 2026-09-01 retraction test using
  `RETRY-02 Scheduled Reconcile — 01 Sep 2026` passed visually: public listing
  and search removal, former-detail retraction page with reason, Creator
  Unpublished/Retracted placement, immutable-publication wording, and no normal
  repeated Retract action after retraction. Optional remaining evidence is a
  precise HTTP-status capture if strict 410/404 proof is required.
- Capture Catalyst request/version/pointer/callback rows and the Creator
  Published audit event for the fresh 09:35 IST scheduled success. Creator
  already shows Succeeded, one attempt, and HTTP 200.
- Obtain and audit a fresh post-cleanup Creator DS export.
- Run the required Author-only, Reviewer-only, Publisher-only, and
  non-super-admin Editorial Admin negative role matrix.
- Preserve the historical failed/queued Catalyst requests and complete the
  remaining live Development promotion matrix.
- Re-save image-bearing promotion-test drafts before approval so their normalized
  `Article_Revisions.Referenced_Media_UUIDs` values are current.

## Next Build

Move from review workflow into production readiness:

1. Export the cleaned Creator app and complete the negative role tests without
   inferring verification from the older export.
2. Run scheduled, duplicate/idempotency, revoked-approval, transient-failure,
   callback-outage, stale-revision, callback-replay, and media tests.
3. Deploy the Next.js frontend to a Development host, configure both site/API
   origins, and run browser, accessibility, SEO, missing/retracted, and performance
   checks.
4. Complete the sitemap/RSS base-URL configuration and remove/retract test content
   before the public launch candidate.
5. Promote only after all Development evidence passes.

## Not Yet Built

- Production media malware-scanning provider/hook (byte signature, size,
  checksum, and dimension validation are implemented)
- Production-grade notification delivery tracking and richer dashboard analytics
- Catalyst end-to-end Development verification and production promotion
- Draft preview boundary (separate from approved publication)
- Measured Catalyst/Vercel benchmark evidence for the live maintained public index
- Host-level HTTP 410 enforcement/redirect UX for retracted frontend pages
- Final public frontend branding, deployment, analytics/consent, and launch QA
- Client-account integration and migration
- Full website content management and redesign

## Current Product Map

The concise feature inventory, remaining test order, public frontend plan, and
proposed retraction lifecycle are maintained in
`docs/PRODUCT_CHECKPOINT_2026-08-29.md`.

The beginner-friendly Vercel deployment, environment wiring, secret ownership,
and client-account migration procedure is maintained in
`docs/VERCEL_HOSTING_AND_CLIENT_MIGRATION_GUIDE.md`.

The ordered client-demo checklist and staged 1,800-post/catalog, read-load, and
workflow-throughput plan is maintained in
`docs/PRE_CLIENT_DEMO_AND_SCALE_TEST_PLAN.md`.

## Important Technical Notes

- Creator's File API may return an uploaded JSON document as an already-parsed
  `{ type: "doc", content: [...] }` object instead of raw text.
- Creator record update success does not guarantee immediate read consistency.
  The widget retries and verifies both file content and all editable metadata;
  required fields must remain exposed in the widget's Creator reports.
- Browser-side conflict detection cannot make Creator file upload and metadata
  update atomic. A server-owned versioned save command is required for the final
  client production boundary.
- Fields required on reload must be exposed by the report used by the widget.
- If `Active_Draft_Revision_ID` is omitted from `Articles_Report`, the current
  widget package can recover by loading the latest Draft revision. The report
  field should still be exposed for explicit pointer verification.
- The current release edge-case article ID is `471741000000032030`.
- The current widget upload artifact is `editor-widget/zet/dist/zet.zip`.
  Its current SHA-256 is
  `1210fe55854a2aba1ebffa403c8c87e8a5097ea641e2d17ecbacb0bff0fae8ab`.
- Review workflow installation instructions are in
  `creator/REVIEW_WORKFLOW_SETUP.md`.
- Publishing installation instructions are in `creator/PUBLISHING_SETUP.md`.
- Permission/sharing instructions are in
  `creator/PERMISSION_SHARING_SETUP.md`.
- Notification and scheduling installation instructions are in
  `creator/NOTIFICATION_SCHEDULING_SETUP.md`.
- Scheduling architecture notes are in `docs/SCHEDULING_AND_NOTIFICATIONS.md`.
- Catalyst service setup is in `catalyst/README.md`; Creator integration setup is
  in `creator/CATALYST_PUBLISHING_SETUP.md`.
- The ordered operator checklist is in
  `docs/CREATOR_CATALYST_INTEGRATION_CHECKLIST.md`.
- The fresh Creator checkpoint result is recorded in
  `docs/CREATOR_CHECKPOINT_VALIDATION_2026-08-26.md` and remains Unverified.
- The installed `publish_approved_article` and `schedule_approved_article`
  Custom APIs passed the historical Creator-local smoke paths. Their functions
  must now be replaced with the Catalyst handoff versions before external
  boundary testing; the old date-field publisher must be disabled.
- The workflow test-user seed was executed successfully: one Author, two
  Reviewers, and one Publisher were added alongside the existing demo admin.
- The `submit_article_for_review` map function was compiled and saved successfully
  with `articleId` and `reviewerIdsCsv` arguments.
- Historical old-owner Custom API endpoints used `opensourceindia22`. The
  migrated app must use `piyugene02`, for example:
  `https://www.zohoapis.in/creator/custom/piyugene02/submit_article_for_review`.
- The Custom API is POST, OAuth2, application/json, Key and Value, All users, and
  Standard response.

## Resume Checklist

Read these files before continuing:

1. `docs/CURRENT_CHECKPOINT_2026-09-07.md`
2. `docs/CURRENT_CHECKPOINT_2026-09-04.md`
3. `docs/HANDOFF.md`
4. `docs/CREATOR_ACCOUNT_MIGRATION_RUNBOOK.md`
5. `docs/PHASE_1_RELEASE_CLOSURE.md`
6. `docs/MANUAL_VERIFICATION_2026-08-30.md`
7. `docs/CATALYST_LIVE_CHECKPOINT_2026-08-28.md`
8. `docs/STATUS.md`
9. `docs/EDGE_CASE_AUDIT.md`
10. `creator/REVIEW_WORKFLOW_SETUP.md`
11. `creator/PUBLISHING_SETUP.md`
12. `creator/PERMISSION_SHARING_SETUP.md`
13. `creator/CATALYST_PUBLISHING_SETUP.md`
14. `catalyst/README.md`
15. `creator/NOTIFICATION_SCHEDULING_SETUP.md`
16. `docs/SCHEDULING_AND_NOTIFICATIONS.md`
17. `docs/DECISIONS.md`
18. `docs/WORKFLOW.md`
19. `docs/DATA_MODEL.md`
20. `docs/CREATOR_SPEC.md`
21. `docs/WORKLOG.md`
