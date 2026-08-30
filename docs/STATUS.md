# Current Status

Last updated: 2026-08-30

## Active Milestone

Milestone 4: Development verification and client-demo readiness

The editorial data foundation and live Article Workspace editor are complete.
The editor, recovery, conflict detection, submission boundary, reviewer claim,
review decisions, N+1 changes-requested loop, role-aware dashboard, shared queue,
and regulated two-reviewer approval path have passed live Creator testing. The
clean no-media Catalyst immediate-publish case has also passed in Development;
the current focus is completing the remaining Catalyst promotion matrix.
The reported Creator cleanup remains explicitly unverified because no fresh DS
export or negative role-test evidence is available.

The live dashboard now locks publication actions synchronously and derives
queued/processing state from Creator Publishing Health, so accepted work cannot
be submitted again after refresh or from another tab. Catalyst pointer insert
errors also preserve their real platform cause instead of always appearing as
`POINTER_CONTENTION`. The package was uploaded and its adaptive refresh passed a
complete live Creator workflow without manual Refresh.
AppSail `0.2.1` additionally removes the artificial two-minute delay from
Publish/Retract by using immediate Job Pool dispatch. Scheduled publication keeps
the chosen time; schedules less than two minutes away are rejected, not shifted.

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
- Draft editing is now limited in the widget and save repository to the owner,
  primary author, CEO, or Editorial Admin. Review history carries the exact
  reviewed `revisionId` and unauthorized reviewers cannot open a working Draft.
- Regulated Review has passed live testing with two distinct reviewer approvals:
  the first approval keeps the article In Review, and the second approval moves
  the article to Approved.
- Shared queue behavior has passed live testing: reviewer dashboards show one
  claimable row per regulated revision, while admin can still see queue-slot
  detail.
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

- The first Next.js public Insights frontend is implemented in `frontend/` and
  passes strict typecheck and production build. It includes the public homepage,
  archive search/category/tag filters, pagination, article pages, retraction and
  error states, responsive styling, metadata, JSON-LD, robots, and sitemap.
  Deployment, browser/device and Lighthouse QA, final branding/content, production
  origin configuration, and strict page-level 410 verification remain pending.

- Cache-hardened AppSail `0.3.1` is deployed and live verified for public
  listing, filtering/pagination, detail, taxonomy, ETag/304, HTTP 410, a
  five-second must-revalidate detail cache, and `no-store` retraction responses.
  Configure `PUBLIC_SITE_BASE_URL` before testing sitemap/RSS. Artifact SHA-256:
  `13018639a290a6366c0c348e191d97ac9907ab158cf3b339301f831c619573f6`.
- The dashboard package with adaptive five-second active-job refresh,
  45-second idle refresh, hidden-tab pause, in-flight request deduplication,
  and last-updated/error feedback is uploaded and live verified through the
  complete workflow. Its SHA-256 is
  `ca2dad31734250c40a2b540d3f78b72b4b8a19f86175e7f61833516fff4dbf1b`.
- Capture the successful retraction's Creator `Catalyst Article Retracted` audit
  event, then run the Author/Reviewer denial and Publisher/Admin positive-role
  retraction matrix.
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
- Maintained public index for larger catalogs (the current read API scans pointers)
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
  `ca2dad31734250c40a2b540d3f78b72b4b8a19f86175e7f61833516fff4dbf1b`.
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
- The enabled Custom API endpoint is
  `https://www.zohoapis.in/creator/custom/opensourceindia22/submit_article_for_review`.
- The Custom API is POST, OAuth2, application/json, Key and Value, All users, and
  Standard response.

## Resume Checklist

Read these files before continuing:

1. `docs/HANDOFF.md`
2. `docs/CATALYST_LIVE_CHECKPOINT_2026-08-28.md`
3. `docs/STATUS.md`
3. `docs/EDGE_CASE_AUDIT.md`
4. `creator/REVIEW_WORKFLOW_SETUP.md`
5. `creator/PUBLISHING_SETUP.md`
6. `creator/PERMISSION_SHARING_SETUP.md`
7. `creator/CATALYST_PUBLISHING_SETUP.md`
8. `catalyst/README.md`
9. `creator/NOTIFICATION_SCHEDULING_SETUP.md`
10. `docs/SCHEDULING_AND_NOTIFICATIONS.md`
11. `docs/DECISIONS.md`
12. `docs/WORKFLOW.md`
13. `docs/DATA_MODEL.md`
14. `docs/CREATOR_SPEC.md`
15. `docs/WORKLOG.md`
