# Work Log

## 2026-08-30 - Continuity checkpoint synchronized

- Reconciled the handoff, status, and product checkpoint with the live adaptive
  dashboard, AppSail `0.3.1` public API, positive retraction result, and built
  Next.js frontend.
- Added the Vercel/client migration guide and pre-client demo/scale test plan to
  the mandatory new-task reading order. Development remains unverified until the
  complete matrix, fresh Creator DS audit, and negative role tests pass.

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
  Upload `editor-widget/zet/dist/zet.zip`; SHA-256
  `ca2dad31734250c40a2b540d3f78b72b4b8a19f86175e7f61833516fff4dbf1b`.
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
  matrix, fresh Creator DS export, and negative role tests remain outstanding.
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
