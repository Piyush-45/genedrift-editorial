# Project Handoff

Last updated: 2026-09-07

## Resume Here

Read in this order:

1. `docs/CURRENT_CHECKPOINT_2026-09-07.md`
2. `docs/PHASE_2_WEBSITE_REVAMP_CLIENT_BASELINE.md`
3. `docs/PHASE_2_HERO_CONCEPT_REVIEW_2026-09-05.md`
4. `docs/PHASE_2_WEBSITE_INFORMATION_AND_EDITING_ARCHITECTURE_2026-09-05.md`
5. `docs/PHASE_2_CMS_FORM_AND_COMPONENT_BLUEPRINT_V1.md`
6. `docs/HANDOFF.md`
7. `docs/STATUS.md`
8. `docs/WORKLOG.md`
9. `docs/CREATOR_ACCOUNT_MIGRATION_RUNBOOK.md`
10. `docs/CURRENT_CHECKPOINT_2026-09-05.md`
11. `docs/CURRENT_CHECKPOINT_2026-09-04.md`
12. `docs/PHASE_1_RELEASE_CLOSURE.md`
13. `docs/MANUAL_VERIFICATION_2026-08-30.md`
14. `docs/VERCEL_HOSTING_AND_CLIENT_MIGRATION_GUIDE.md`
15. `creator/WORKFLOW_POLISH_SETUP.md`
16. `creator/PUBLISHING_SETUP.md`
17. `creator/PERMISSION_SHARING_SETUP.md`
18. `creator/CATALYST_PUBLISHING_SETUP.md`
19. `catalyst/README.md`

## Current Boundary

The newest single-page checkpoint is
`docs/CURRENT_CHECKPOINT_2026-09-07.md`.

As of 2026-09-07, client design reviews are the next active task. The three
Phase 2 hero concepts and the website information/editing architecture are
prepared. No final concept selection has been recorded, and the complete
homepage has not been started. Read the new checkpoint for the cross-account
role test, refreshed-route support package and OAuth incident/remediation state.

Phase 1 remains support-only. Treat Article Workspace work as support/testing
context unless the user explicitly asks for more Creator changes.

Creator widget v0.5.5 input preservation is live-smoke verified from the user's
screenshots in the migrated `piyugene02` app. The verified flow preserved
category/tag names, cover alt text, edited cover Caption, inline Caption,
save/reload state, and submit-for-review readback for
`SMOKE v0.5.5 Input Preserve Final Test`. v0.5.6 is packaged locally for
floating publishing notifications; upload and publish-message verification are
still pending.

The user also cleaned three orphaned public development articles from Catalyst
after Creator reset: `editable-tags-checking`, `smoke-test-1`, and
`hanumaaaan`. The public frontend no longer shows them. If public cleanup is
needed again after Creator records are gone, use `GD_Public_Index` to find the
article by title/slug, then keep `GD_Published_Pointers` in sync by the same
`Article_UUID`; do not delete immutable `GD_Published_Versions` or Stratus
objects during normal cleanup.

As of 2026-09-04, the Creator migration dry run to owner `piyugene02` has one
complete successful end-to-end article publish: Article Workspace loads, draft
save works with widget v0.4.16, submit/review/publish works, Catalyst OAuth
refresh succeeds with the new Self Client refresh token, Catalyst request status
reaches `Succeeded`, and the blog appears on the public frontend. Use
`docs/CREATOR_ACCOUNT_MIGRATION_RUNBOOK.md` for future account/client transfers.
Do not reuse exposed OAuth credentials; rotate them before any real handoff.

As of 2026-09-03, Phase 1 Article Workflow Platform is completed and with the
client for testing. The shared plan tracker frames the project as:

- Phase 1 Article Workflow Platform: completed/shared for testing.
- Phase 2 Website Design Confirmation: pending client confirmation.
- Phase 3 Final Website Frontend Build: estimated 3-5 days after design and
  article-workflow green light.
- Phase 4 Client System Migration and Deployment: estimated around 2 days after
  frontend/workflow approval.

Staging links currently shared with the client:

- `https://genedrift.site/insights`
- `https://genedrift.site/designs`

Current live-smoke verified Creator widget package for the migrated app is
`editor-widget/genedrift-editor-widget-workflow-polish-v0.5.5-input-preserve.zip`,
SHA-256
`c30186d81ff2d14558df67afb0de0864e9a5ce424aa784670305c03811ee77fe`.
Prepared local notification-polish package:
`editor-widget/genedrift-editor-widget-workflow-polish-v0.5.6-floating-publishing-notice.zip`,
SHA-256
`2ed7f79bcfd2670266501b695fef13f6d9c43de69e4d787739184c1eaafd1561`.
The older v0.5.1 taxonomy-fix ZIP remains a rollback reference, SHA-256
`1068232c6d529c4df7a0c573d9b58e699321ccc83149f0837e684362bb4634bd`.
The earlier client-shared 2026-09-03 package was
`genedrift-editor-widget-dashboard-ux-v0.4.8.zip`, SHA-256
`684e9b57d32688b99b5b25ae56a8039ef899b0b5ca7cdfb145b4541996250020`.
It includes the compact dashboard controls, state/category/person/date/sort
filters, five-row panel caps, author visibility for approved articles, safer
Retract overflow, article-title workspace header, role/state primary actions,
readiness checklist, separated decision notes/discussion comments, and clearer
selected-tag display/preservation.

The v0.5.1 taxonomy correction now passes live save/reload and publication.
v0.5.2 adds reliable Caption persistence through the new private
`update_media_metadata` Custom API, removes Credit from authoring/new public
rendering, adds direct inline-image controls and cover-removal Undo, and keeps
new drafts above older drafts. See the incremental upgrade section in
`creator/WORKFLOW_POLISH_SETUP.md`.

v0.5.3 adds the Editorial Command Center dashboard with role-aware Today,
visible workspace navigation, focused Articles/Reviews/Publishing views, and a
dedicated Archive. The dashboard change itself requires no new Custom API; an
installation upgrading from v0.5.1 still needs the v0.5.2
`update_media_metadata` prerequisite.

v0.5.4 clarifies the live-refresh status, slows active publishing refresh from
5 seconds to 30 seconds, sets idle dashboard refresh to 1 minute, and adds the
admin-only `reset_editorial_test_content` Creator Custom API. That reset deletes
Creator editorial test content only and keeps employees, roles, policies,
taxonomy, settings, and Redirects. It does not delete Catalyst immutable objects,
Stratus media, or public-site records already created by publishing.

v0.5.5 removes the invalid server-side whitespace regex that corrupted
author-entered category/tag names and image alt text, aligns mock taxonomy
creation with that preservation rule, and makes image metadata saves verify that
Creator returns and reads back the exact saved alt text and Caption.

The user's v0.5.5 screenshots confirm clean category/tag preservation, cover
alt text and edited Caption readback, inline Caption readback, draft save/reload,
and submit-for-review retention. v0.5.6 adds floating publishing notifications;
upload and publish-message verification are still pending.

The matching AppSail package is
`genedrift-catalyst-appsail-dev-v0.4.3-media-caption.zip`, SHA-256
`cdd7eb7e45e2a25ab4214bbdda71a5b94ce386171ff4d588f25e25070eec6e4b`.
Deploy it when Caption-only rendering must apply to inline images, then deploy
the current `frontend/` build so cover images also stop rendering legacy Credit.

Client testing account supplied: `am5333966@gmail.com`. Creator application
access alone is not sufficient; the user's login must also be mapped in the
app's employee and editorial role records for the widget to expose the correct
workflow actions.

As of 2026-09-01, the Phase 1 Insights/blog product is functionally strong:
core editor, review, revision, dashboard, role visibility, immediate publish,
scheduled publish, too-soon schedule rejection, public listing, public
published filter, and retraction behavior have passed live functional checks.
The then-current widget artifact was
`genedrift-editor-widget-final-polish-v0.4.5.zip`, SHA-256
`1210fe55854a2aba1ebffa403c8c87e8a5097ea641e2d17ecbacb0bff0fae8ab`.
The latest AppSail artifact present is
`genedrift-catalyst-appsail-dev-v0.4.2.zip`, SHA-256
`1834f1924a953c21919d242e79f1d0bdaf847bd3abe35415697dd829afc9c3ff`.

Phase 2 website-revamp baseline requirements have now been supplied by the
client and summarized in `docs/PHASE_2_WEBSITE_REVAMP_CLIENT_BASELINE.md`.
The client wants three initial sample templates/design concepts before full
development: two aligned closely to the LF20 design philosophy/corporate
presentation and one independent premium direction. Phase 1 still needs fresh
Creator DS export audit, duplicate/idempotency stress evidence, a fresh
regulated-review confidence run, media-format validation, accessibility/public
site QA, and measured 1,800-post scale evidence before a confident release-ready
claim.

The Creator editorial foundation, Article Workspace, durable draft persistence,
media handling, recovery, stale-tab protection, and submission to review are
working in the live demo environment. Suggested-reviewer submission has been
verified through Creator records and Audit Events.

Reviewer claim, comments, decisions, N+1 changes-requested drafts, shared queue,
regulated two-reviewer approval, role-isolated reviewer history, dashboard
navigation, and New Article flow have passed live Creator testing. The current
boundary is no longer the core review loop. The historical Creator-local
Publisher/Admin implementation passed Admin and combined Reviewer+Publisher
smoke tests, and its first timed schedule ran. The Catalyst handoff/callback
replacement for that local completion path is now installed in Creator
Development. Permission and sharing setup guidance is prepared locally.
Notification handoffs and direct Built-in Email delivery are live verified.
The reported Creator cleanup could not be freshly validated. The only local DS
export is still the previously audited `GeneDrift_Editorial_Platform-4.ds`.
The live Application IDE now exposes its Export action in the signed-in browser,
but that browser session did not yield a saved DS file for audit. A fresh export
plus separate negative role tests are still mandatory; see
`docs/CREATOR_CHECKPOINT_VALIDATION_2026-08-26.md`.

The Catalyst publishing boundary is now implemented locally. It includes signed
replay-protected handoff, immutable snapshots and published versions, a
versioned compare-and-swap pointer, leased idempotent workers, bounded retry,
execution-time Creator preflight, deterministic scheduling, and an independent
signed Creator callback outbox. Private/public Catalyst Stratus buckets now own
immutable snapshots, published JSON, and validated content-addressed media;
successful callbacks apply stable media keys/URLs in Creator. Twenty automated
boundary tests pass locally. The widget now stores normalized per-revision media UUIDs,
so handoff reads only the relevant inline/featured/social assets rather than the
growing full library. It is now provisioned in Catalyst Development and has
passed health and configuration checks. Live testing exposed and resolved the
numeric retry interval, SDK error normalization, 20-character `job_name`,
30-character `cron_name`, and missing
`GD_Published_Versions.Revision_UUID` issues. Service version `0.1.5` is
deployed, and a fresh no-media immediate publication fully passed with matching
immutable object, version, version-1 pointer, one-attempt Delivered callback,
and Creator Published evidence. This verifies only that matrix case; scheduled
publishing, duplicate/idempotency, revoked approval, stale revision, transient
worker failure, callback outage/replay, and media cases remain, along with the
fresh DS export and negative role tests.

Job Pool history later proved the stalled 22:25 IST scheduled job reached
AppSail and returned success in 28 ms. Its attempt count stayed zero because
the Catalyst store lease predicate compared the Creator `+05:30` scheduled
DateTime with a UTC ISO string inside ZCQL. Service `0.1.5` moves due-time
normalization to JavaScript while preserving the conditional lease update; all
20 tests pass. After deploying `0.1.5`, the fresh 09:35 IST scheduled case
succeeded at 09:35:02 with one attempt and HTTP 200. Capture its Catalyst
request/version/pointer/callback rows and Creator Published audit event before
closing that matrix evidence.

The Article Workspace dashboard package is now beyond initial implementation.
It provides role-aware All Work/Articles/Reviews/Publishing views, corrected
Mine/Queue/All scope, state/category/sort filters, clearable search, refresh and
reset controls, metric shortcuts, independent scroll regions without eight-item
truncation, two-line long titles, responsive horizontal metric scrolling, active
Publishing Health awareness, synchronous action locking, and adaptive refresh.
The final 2026-09-01 polish package also applies the GeneDrift purple/lavender
palette, quieter workflow ownership traces, scheduled-time visibility on
Scheduled rows, clearer author handoff text after approval, and denser
laptop-width row spacing. This 2026-09-01 package is superseded by the
2026-09-03 v0.4.8 dashboard UX package above:
`genedrift-editor-widget-final-polish-v0.4.5.zip`, SHA-256
`1210fe55854a2aba1ebffa403c8c87e8a5097ea641e2d17ecbacb0bff0fae8ab`.

The matching latest AppSail artifact present is
`genedrift-catalyst-appsail-dev-v0.4.2.zip`, SHA-256
`1834f1924a953c21919d242e79f1d0bdaf847bd3abe35415697dd829afc9c3ff`.
Earlier AppSail fixes removed false pointer-contention masking, dispatched
Publish/Retract immediately through the Job Pool, preserved exact user schedule
times, prevented future scheduled rows from becoming premature Needs retry, and
treated duplicate scheduled cron creation as idempotent for the same generated
cron name.

The positive immediate retract path is now live: article
`ART-767af2ab02d5961458d3dd6a7ba584d1` completed Unpublish once with HTTP 200,
Creator shows it under Retracted Articles as Unpublished, and Catalyst retained
the immutable publication while advancing the pointer to version 2 and
`Serving_Status = Retracted`. A later article,
`ART-022254fb3b8ade6547c08e54b3c79187`, now provides the complete Creator-side
audit packet: Catalyst Published at 23:49:05 and Catalyst Retracted at 23:49:44
on 2026-08-29, with retraction job `471741000000056044` and callback
`callback_36498adcbe77a6b2f2a48614bc45ddbc221e7f0c`. Treat this as positive audit
evidence for the later loop, not a substitute for negative role tests or the
remaining matrix.

AppSail `0.3.1` now contains the public read boundary needed before Next.js:
published-only listing/search/filter/pagination, slug resolution, taxonomy,
sitemap, RSS, ETags/CORS, and HTTP 410 retraction responses. It reads only the
current pointer and immutable public object and removes internal Creator IDs and
editor data from responses. Deploy
`genedrift-catalyst-appsail-dev-v0.3.1.zip` (SHA-256
`13018639a290a6366c0c348e191d97ac9907ab158cf3b339301f831c619573f6`),
which is deployed and live verified for list, filter/pagination, detail,
taxonomy, ETag/304, retracted-slug HTTP 410, the five-second must-revalidate
detail cache, and `no-store` 410 responses. Configure `PUBLIC_SITE_BASE_URL` to
complete sitemap/RSS verification. For larger catalogs, replace the current
pointer object scan with a maintained public index.

That replacement is deployed in Catalyst Development as AppSail `0.4.0` with
`GD_Public_Index`. Publish/retract maintains compact rows before job success;
list/search/facets/feeds read them, while slug detail verifies the authoritative
pointer and fetches one immutable object. An authenticated rebuild route migrates
existing pointers. All 29 automated tests pass. `GD_Public_Index` and all 24
documented application columns are provisioned, `/health` reports `0.4.0`, and
`PUBLIC_SITE_BASE_URL` is the Vercel URL. The authenticated one-time rebuild ran
successfully on 2026-08-30 and indexed nine current pointers. Public listing now
returns the five Published articles; live list/search/filter/pagination, detail,
ETag/304, sitemap, RSS, missing 404, and retracted GET 410 checks pass. The
retracted HEAD response is still 200 at the AppSail host even though GET is 410
and both responses carry `no-store`; retain this as a host-level method mismatch.
Prepared artifact:
`genedrift-catalyst-appsail-dev-v0.4.0.zip`, SHA-256
`fc3fec70f8aafd5e7a4a6405be8988dd5df02d2bc2897758f3393babb7821d06`.

The first Next.js public frontend now exists in `frontend/` and passes strict
typecheck plus the optimized production build. It provides a responsive homepage,
searchable/filterable/paginated archive, article detail, retraction/404/service
states, metadata, JSON-LD, robots, and sitemap. Article detail bypasses the
frontend data cache; list data revalidates every 15 seconds. Resume by deploying
this app to a Development host, setting `GENEDRIFT_PUBLIC_API_BASE_URL` and
`NEXT_PUBLIC_SITE_URL`, then run browser/device, accessibility, SEO, performance,
missing/retracted, and production-origin checks. The Catalyst API already returns
true HTTP 410; the frontend page is `noindex`, but strict page-level 410 must be
verified or enforced at the chosen host/proxy.

Deterministic pre-demo scale tools now generate 1,800 visible synthetic articles
plus one retracted case, serve the same public DTO locally, run staged k6 public
reads, and provide a result template. Local browser checks passed, including
390px long-title overflow and out-of-range deep-page correction. This is local
UI/tooling evidence, not a Catalyst or Vercel capacity result.

Use `docs/VERCEL_HOSTING_AND_CLIENT_MIGRATION_GUIDE.md` for the ordered Vercel
setup, exact cross-system variable ownership, domain wiring, safe secret rotation,
and migration from the current accounts to client-owned Creator, Catalyst, OAuth,
Git, Vercel, and DNS accounts.

The public frontend revamp is deployed in Vercel as project
`genedrift-vercel-preview-0.4` at
`https://genedrift-vercel-preview-04.vercel.app`. Both public environment values
are configured and the latest production deployment
`dpl_2XJVNVS1f34WSebPsGs6RkW9o6fc` is Ready. The latest deployed code is local
commit `cdea0c0`, following revamp commit `a55a727`. Vercel dashboard context:
account `opensourceindia22-8134` / `opensourceindia22@gmail.com`, team slug
`ztm2`, team ID `team_8OHZR3PCWIiPgfRTWDp7crr8`, project ID
`prj_Nz73OBb1V6bZBIV6W6Qdjj2S2gpG`. The project is not connected to Git; the
latest deployment used a direct CLI deploy to the existing project. A temporary
one-hour project-scoped token was created, used, revoked, and removed locally.
Post-deploy checks passed for `/`, `/insights`, and one article detail route with
no browser console warnings/errors. Earlier checks covered homepage,
archive/category, detail, canonical/JSON-LD, robots, sitemap, missing 404,
retraction/noindex, console, and 390px overflow against the live Development API.
The retracted frontend page still returns HTTP 200; retain this as an explicit
strict-410 gap.

The notification path is now live verified. Reviewer submissions recorded
handoffs for one and two resolved recipients. A direct Built-in Email test was
accepted for both the admin Gmail and `hello@piyushtyagi.work`; the Gmail copy
arrived in Spam from `notifications@trial.zohocreatormail.com`. The custom-domain
inbox result is a deliverability issue outside the editorial transition. The
temporary direct-send diagnostic was removed after testing, but it still appears
in the 2026-08-26 DS export and must be removed again from the live app.

As historical prototype evidence, the first live Creator date-field scheduling run passed its primary execution
path on `hew one with regulated`: it was scheduled at 18:52 and automatically
published at 18:53, with notification handoffs at both transitions. Schedule and
Publish jobs both Succeeded in one attempt, and the article is Published with
matching Scheduled At and Last Published At timestamps. Confirm Revision 1 is
Published, confirm the article published pointer, and run a second independently
timed article were never completed. The production Catalyst promotion matrix now
supersedes that unfinished demo sign-off.

The current live export audit is in `docs/LIVE_DS_AUDIT_2026-08-26.md`. It found
that Creator still has older ungrouped criteria in claim, decision, publish, and
schedule functions. Correct those functions before using permission tests as
security evidence.

## Live Demo Reference

- Creator owner: `opensourceindia22`
- Application link name: `genedrift-editorial-platform`
- Workspace page parameter: `articleId`
- Current release test article: `471741000000032030`
- Widget package: `editor-widget/zet/dist/zet.zip`
- Submission API link name: `submit_article_for_review`
- Reviewer API link names: `claim_review_assignment`, `add_review_comment`, and
  `record_review_decision`
- Publishing API link name: `publish_approved_article`
- Scheduling API link name: `schedule_approved_article` (first timed path live
  verified; full integrity matrix pending)

No credentials, OAuth tokens, or client secrets belong in this repository.

## Proven Live

- New revision initialization and structured document persistence
- Autosave, manual save, full reload, and local recovery
- Excerpt, SEO, robots, metrics, cover image, and inline image persistence
- Creator consistency retries and complete save verification
- Two-tab stale-write rejection
- Recovery normalization for whitespace and line-ending differences
- Suggested-reviewer submission
- Article transition from Draft to In Review
- Revision transition from Draft to Submitted and read-only enforcement
- Review Assignment creation, Review Queue visibility, and Audit Event creation
- Real Harsh reviewer visibility after Creator data-sharing rules
- Harsh claim/decision path for approval
- Harsh Changes Requested path through article state change while Revision 1
  stays Submitted
- Changes Requested N+1 path: Revision 2 created as Draft while Revision 1
  remains Submitted
- N+1 resubmission path: Revision 2 approved while Revision 1 remains Submitted
- Dashboard/reviewer inbox implementation passes local TypeScript, production
  build, ZET validation, and ZET packaging
- Dashboard, New Article, inbox navigation, claim, and review history passed
  live tests in the admin and Harsh accounts
- Separate Author-only, Reviewer-only, Publisher-only, and Editorial Admin visual
  behavior passed on 2026-09-01.
- Scheduled publishing, too-soon schedule rejection, public published filtering,
  and public retraction behavior passed on 2026-09-01.
- Dashboard ownership metadata now shows who wrote, approved, scheduled,
  published, or retracted articles without requiring approval/rejection comments.
- Superseded widget final-polish artifact `genedrift-editor-widget-final-polish-v0.4.5.zip`
  passed typecheck, production build, ZET pack, and ZIP integrity.
- Reviewer draft isolation passed: closed review history opens the reviewed
  submitted revision read-only, and reviewers cannot access the author's working
  N+1 draft by article-only URL.
- Regulated Review passed with two distinct reviewer approvals. First approval
  kept the article In Review; the second approval moved it to Approved.
- Shared queue passed for reviewer UX and admin oversight. Reviewer dashboard
  shows one claimable row per regulated revision; admin may see slot-level queue
  rows.
- Admin local publishing passed live testing. It publishes inside Creator only:
  creates `Publication_Jobs`, moves the approved revision and article to
  Published, stores published pointers, and writes an `Article Published` audit
  event.
- Publisher local publishing passed live testing with Harshu as a combined
  Reviewer+Publisher user. Harshu saw the Publish action, publishing succeeded,
  the ready queue cleared for Harshu and Admin, and Recent Activity/Audit Events
  showed the published revisions.
- Permission/sharing setup checklist is prepared in
  `creator/PERMISSION_SHARING_SETUP.md`.
- Notification handoff and scheduling Deluge functions are prepared locally in
  `creator/functions`, and dashboard scheduling is included in the rebuilt
  `editor-widget/zet/dist/zet.zip`.

## Real Reviewer Setup

- A real test identity is being configured for `hello@piyushtyagi.work`
  (`REAL-REVIEWER-EDITOR-001`, display name `Harsh`).
- Creator application role `Reviewer` and permission set `Editorial Reviewer`
  were created for least-privilege review testing.
- The first visibility issue was solved with Creator Data Sharing rules from
  `CEO` to `Reviewer` for the reports/forms required by the workspace.
- Keep permission/data-sharing setup under review; broad prototype sharing should
  later be replaced by role-aware reviewer inbox and narrower record visibility.

## Immediate Next Step

1. Export and audit a fresh post-cleanup Creator DS.
2. Run the P3 duplicate/idempotency stress retest on a controlled article/job.
3. Run the P4 fresh Regulated Review confidence test with two distinct reviewers.
4. Complete media-format validation for at least fresh JPEG and PNG before any
   production claim.
5. Run Lighthouse, accessibility, device, metadata, sitemap/RSS, console, and
   public-site smoke checks.
6. Run the staged 1,800-post catalog/read-load evidence plan on an approved
   non-production target.
7. Build the client-owned Production lane only after the Development gates pass.

The exact operator order is in
`docs/CREATOR_CATALYST_INTEGRATION_CHECKLIST.md`.

Before a client demonstration, follow
`docs/PRE_CLIENT_DEMO_AND_SCALE_TEST_PLAN.md`. A local 1,800-item frontend
fixture may demonstrate catalog UX, but a credible Catalyst catalog benchmark
requires measured load evidence for the now-live public index. Keep catalog
size, read traffic, and publication
workflow throughput as three separately reported tests.

The submitted revision must remain immutable. Changes Requested now creates
revision N+1 as a live-verified draft, and that N+1 draft can be resubmitted and
approved.

## Next Implementation Order

1. Live-check the latest dashboard and finish the scheduled evidence packet.
2. Freshly validate Creator cleanup, DS export, and least-privilege role isolation.
3. Complete the Catalyst Development promotion and media matrix.
4. Deploy/live-verify retract/unpublish, then implement the public read/index layer.
5. Build the Next.js Insights experience, then repeat promotion in Production.
6. Integrate the approved model into the client's Creator environment.

## Continuity Warning

The first baseline checkpoint is commit `da11492`. Preserve it and the current
uncommitted `0.4.0`/scale-tool work; do not reset or overwrite either while the
live Development matrix remains incomplete.
