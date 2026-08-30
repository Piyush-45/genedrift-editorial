# Project Handoff

Last updated: 2026-08-30

## Resume Here

Read in this order:

1. `docs/HANDOFF.md`
2. `docs/PRODUCT_CHECKPOINT_2026-08-29.md`
3. `docs/CATALYST_LIVE_CHECKPOINT_2026-08-28.md`
4. `docs/STATUS.md`
5. `docs/EDGE_CASE_AUDIT.md`
6. `creator/REVIEW_WORKFLOW_SETUP.md`
7. `creator/PUBLISHING_SETUP.md`
8. `creator/PERMISSION_SHARING_SETUP.md`
9. `creator/NOTIFICATION_SCHEDULING_SETUP.md`
10. `docs/CREATOR_CHECKPOINT_VALIDATION_2026-08-26.md`
11. `creator/CATALYST_PUBLISHING_SETUP.md`
12. `catalyst/README.md`
13. `docs/SCHEDULING_AND_NOTIFICATIONS.md`
14. `docs/WORKFLOW.md`
15. `docs/DATA_MODEL.md`
16. `docs/ARCHITECTURE.md`
17. `docs/DECISIONS.md`
18. `docs/WORKLOG.md`
19. `docs/VERCEL_HOSTING_AND_CLIENT_MIGRATION_GUIDE.md`
20. `docs/PRE_CLIENT_DEMO_AND_SCALE_TEST_PLAN.md`

## Current Boundary

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

The next Article Workspace dashboard package is also prepared. It provides
role-aware All Work/Articles/Reviews/Publishing views, corrected Mine/Queue/All
scope, state/category/sort filters, clearable search, refresh and reset controls,
metric shortcuts, independent scroll regions without eight-item truncation,
two-line long titles, and responsive horizontal metric scrolling. Upload
`editor-widget/zet/dist/zet.zip` (SHA-256
`ca2dad31734250c40a2b540d3f78b72b4b8a19f86175e7f61833516fff4dbf1b`)
and live-check it across the negative role matrix.
This package also reads active Publishing Health jobs, removes publish/schedule/
retract actions while an article is queued or processing, synchronously blocks
rapid double clicks, and uses redesigned dashboard selects. It refreshes the
complete dashboard batch every five seconds while a publication job is active,
every 45 seconds while idle, pauses in hidden tabs, deduplicates concurrent
reloads, and displays its last successful update/error state. The uploaded
package passed a complete live Creator workflow without manual Refresh, so this
dashboard behavior is live verified. The matching
AppSail `0.2.1` bundle has SHA-256
`e30dfe4581c1506ed132961fd47aa385f5455f6d4f19bd11adc5185778282efb`;
it no longer masks pointer insert schema/permission failures as contention.
Version `0.2.1` also sends Publish/Retract directly to the Job Pool, while user
schedules retain their exact time and automatic retries retain delayed crons.
Resume from
`docs/PRODUCT_CHECKPOINT_2026-08-29.md`, then use
`docs/CATALYST_LIVE_CHECKPOINT_2026-08-28.md` for row-level live evidence.

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

A clean 24-file frontend upload is deployed in Vercel as project
`genedrift-vercel-preview-0.4` at
`https://genedrift-vercel-preview-04.vercel.app`. Both public environment values
are configured and the configured redeployment is Ready. Homepage,
archive/category, detail, canonical/JSON-LD, robots, sitemap, missing 404,
retraction/noindex, console, and 390px overflow checks passed against the live
Development API. The retracted frontend page still returns HTTP 200; retain this
as an explicit strict-410 gap.

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

1. Capture the remaining scheduled/retraction audit evidence and finish the
   duplicate, second-schedule, revoked-approval, retry, stale-pointer,
   callback-outage/replay, state-conflict, and media promotion matrix.
2. Export and audit a fresh post-cleanup DS and complete the negative role matrix.
3. Run Lighthouse and the remaining device/accessibility checks against the live
   Vercel Preview.
4. Run the staged catalog/read-load evidence on an approved Preview target.
5. Build the client-owned Production lane only after the Development gates pass.

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
