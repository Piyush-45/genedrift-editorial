# Catalyst Development Live Checkpoint — 2026-08-28

Status: **partially live; end-to-end publication is not yet verified**.

This checkpoint contains no credential values. OAuth credentials, refresh
tokens, HMAC secrets, and internal job secrets exposed during interactive setup
must be rotated before production promotion.

## Provisioned Development Resources

- Catalyst project: `gd-genedrift-publishing-dev`
- AppSail service: `gd-genedrift-publishing`
- Runtime: Node 24, port 9000
- AppSail URL:
  `https://gd-genedrift-publishing-50045349268.development.catalystappsail.in`
- Job Pool: `gdgenedriftpublishing` (AppSail type; special characters are not
  accepted by the Catalyst Job Pool name field)
- Private Stratus bucket: `gd-genedrift-publishing-private`
- Public Stratus bucket: `gd-genedrift-publishing-public`
- Public Stratus base URL:
  `https://gd-genedrift-publishing-public-development.zohostratus.in`
- Required Catalyst Data Store tables were manually provisioned.
- AppSail `/health` returned `{"ok":true,"service":"genedrift-publishing"}`.
- AppSail configuration check returned `ok: true`, Creator environment
  `development`, the correct bucket/AppSail/Job Pool names, and presence flags
  for all required secrets and refreshable Creator OAuth credentials.

## Creator Integration Installed

- Creator variables for the Catalyst base URL and shared signing secret exist.
- Catalyst handoff, validation, callback, and reconciliation Deluge functions
  were installed from the repository setup guide.
- The private OAuth2 Custom APIs
  `validate_catalyst_publication_request` and
  `record_catalyst_publication_result` were created and enabled.
- Legacy Creator-local publishing schedules were disabled while the Catalyst
  path is tested.
- Installation does not count as verification. The fresh Creator DS export and
  required negative role tests remain outstanding.

## First Immediate-Publish Test

- Creator job ID: `471741000000050093`
- Article UUID: `ART-a7d37000bfab44024fb56f029dd0e124`
- Revision UUID: `REV-ART-a7d37000bfab44024fb56f029dd0e124-0001`
- Event UUID: `EVT-HANDOFF-REJECT-471741000000050093-1787924032742`
- No media assets

Creator reported `Catalyst Handoff Rejected` with summary
`Unexpected publication error`; the article correctly remained `Approved`.

Evidence confirmed in Catalyst:

1. A replay-protection row was created in `GD_Request_Nonces` at the attempt
   time.
2. The complete schema-v2 handoff payload was written as an immutable JSON
   snapshot under the private Stratus `snapshots/` prefix.
3. The stored payload contains the expected approved article and revision,
   checksum, idempotency key, and empty media list.

This proves the request passed signature/replay handling, payload validation,
request creation, and private snapshot storage. The failure is later in
`acceptHandoff`.

## Publication Request Row Captured

The operator captured the Development `GD_Publication_Requests` row for Creator
job ID `471741000000050093`:

- `Request_ID`: `req_3e8e63a3b7ce3bf38abdb760f36ecf39d1313510`
- `Status`: `Queued`
- `Snapshot_Object_ID`:
  `snapshots/req_3e8e63a3b7ce3bf38abdb760f36ecf39d1313510/8c1db23f7049b361ce5f79c91a2647a87b590860fa893d7d9adb6794fc69d791.json`
- `Last_Error_Code`: empty
- `Last_Error_Message`: empty
- `Attempt_Count`: `0`

This proves `attachSnapshot` succeeded. No worker attempt was submitted or run;
the failure is specifically the Catalyst Job Scheduling submission performed by
`CatalystScheduler.schedulePublication`.

## Scheduler Fix Prepared Locally

- Corrected `job_meta.job_config.retry_interval` from the string `"60"` to the
  numeric value `60`, matching the Catalyst Job Scheduling SDK contract.
- Switched to the current `jobScheduling().cron()` accessor while retaining the
  installed SDK's deprecated `CRON` accessor as a compatibility fallback.
- Added an exact one-time AppSail cron payload regression test.
- TypeScript and all 18 automated boundary tests pass.
- Added a safe `/health` deployment marker: service version `0.1.1` and
  `schedulerPayloadVersion: 2`.
- Rebuilt and integrity-checked `genedrift-catalyst-appsail-dev.zip`.
- Bundle SHA-256:
  `492c7e6d102e288a352bd91a96fcf55739208cfd2fb3b79124540a803f009c5b`

Deployment and reconciliation of the existing queued request remain pending.

## Second Immediate-Publish Attempt

- Confirmed the deployed `/health` marker returned service version `0.1.1` and
  `schedulerPayloadVersion: 2` before interpreting the result.
- Creator job ID: `471741000000050109`
- Article UUID: `ART-7ddf051b85dc92d69699ba38d61a2a12`
- Creator audit event:
  `EVT-HANDOFF-REJECT-471741000000050109-1787926113393`
- The article correctly remained `Approved`.
- Creator and AppSail again reported `Unexpected publication error` /
  `UNEXPECTED_ERROR` at 2026-08-28 19:38:33–19:38:34 IST.

Inspection of the installed Catalyst Node SDK showed that unsuccessful API
responses are rejected as plain `{ statusCode, code, message }` objects rather
than `Error` instances. The service's error normalizer therefore discarded the
real Job Scheduling rejection.

## Diagnostic Build Prepared

- Added safe normalization of the SDK's scalar `statusCode`, `code`, and
  `message` fields without serializing request configuration, headers, secrets,
  or arbitrary response values.
- Bumped the service marker to version `0.1.2`; scheduler payload version remains
  `2`.
- TypeScript and all 19 automated boundary tests pass.
- Rebuilt and integrity-checked `genedrift-catalyst-appsail-dev.zip`.
- Bundle SHA-256:
  `1551f6784b47f64cfa254ff07d6077a0857181b06000e2c5706fbe6ac5b23537`

Deploy this diagnostic build before another handoff. The next failure, if any,
must contain the actual Catalyst API error code and message.

## Actual Scheduling Rejection Captured

After deploying version `0.1.2` and retrying the same queued Creator job,
Catalyst returned the actionable validation message:

`job_name should be within 1-20 char length`

The service had reused its longer deterministic cron name as `job_name`.

## Job-Name Fix Prepared

- Kept the longer deterministic cron identity unchanged.
- Added a separate deterministic 20-character job name in the form
  `gd-{kind}-{13 hex characters}`.
- Extended the exact scheduling payload regression test to enforce both length
  and format.
- Service version `0.1.3`, TypeScript, and all 19 automated tests pass.
- Rebuilt and integrity-checked `genedrift-catalyst-appsail-dev.zip`.
- Bundle SHA-256:
  `8e9c36a2adf007b7cc4c6a75d144c6f6f875f6eb22c98d2bce3e89653992656c`

Deploy version `0.1.3`, confirm the `/health` marker, then retry the same queued
Creator job once. The integration remains unverified.

## Second Scheduling Constraint Captured and Full Payload Audit

After deploying version `0.1.3`, Catalyst accepted the corrected `job_name` and
then exposed the next validation constraint:

`cron_name should be within 1-30 char length`

The earlier implementation used a longer hash-based cron name. Because Catalyst
validates fields sequentially, this constraint was hidden until `job_name`
passed.

The scheduler payload was then audited as a whole against the installed SDK,
Zoho's current one-time-cron and AppSail job examples, and the two observed live
constraints:

- `cron_name`: deterministic, lowercase alphanumeric only, and capped at 30
  characters.
- `job_name`: separately deterministic, lowercase alphanumeric only, and capped
  at 20 characters.
- `description`: omitted because it is optional and unnecessary.
- `job_config`: omitted because platform retries are intentionally disabled and
  the application worker owns bounded retry/backoff.
- `time_of_execution`: retained as a Unix-seconds string, matching Zoho's Node
  example.
- Immediate publication/callback jobs: minimum two-minute lead to prevent clock
  skew and whole-second rounding from making the requested time too close.
- AppSail target type, target name, Job Pool name, POST path, JSON body, and
  internal authentication header remain required.

Service version `0.1.4`, scheduler payload version `3`, TypeScript, and all 19 automated tests pass. The exact
payload regression test now enforces both name limits, omission of optional
retry/description fields, AppSail routing metadata, and the minimum lead time.

- Rebuilt bundle: `genedrift-catalyst-appsail-dev.zip`
- Bundle SHA-256:
  `c7146b38e373948873f707676eb3ec15a1a8c1e354df68981f1972ad588085d2`

Deploy version `0.1.4`, confirm the `/health` marker, then retry the same queued
Creator job once. The integration remains unverified.

## Handoff Accepted on Version 0.1.4

After deploying the audited scheduler payload and retrying the same approved
article, Creator returned:

`Catalyst accepted the publication job.`

This live-verifies handoff acceptance and Catalyst Job Scheduling submission for
the immediate-publish request. It does not yet prove worker execution,
execution-time Creator preflight, immutable published version creation, pointer
advancement, callback delivery, or Creator's final Published transition.

Next capture the matching `GD_Publication_Requests`,
`GD_Publication_Attempts`, `GD_Published_Versions`,
`GD_Published_Pointers`, and `GD_Callback_Outbox` rows after the two-minute job
lead, plus the Creator article/revision/job state and success audit event.

## Clean Immediate-Publish Worker Result

A clean article named `testing cat creat1` completed draft, review, approval,
and accepted Catalyst handoff:

- Creator job ID: `471741000000055060`
- Article UUID: `ART-20e69bb454a2316020e5de731c56f162`
- Revision UUID: `REV-ART-20e69bb454a2316020e5de731c56f162-0001`
- Handoff audit event:
  `EVT-HANDOFF-471741000000055060-1787928450374`
- Handoff accepted at 20:17:32 IST; worker completed at 20:19:33 IST.

The signed failure callback then updated Creator as follows:

- Status: `Failed`
- Attempts: `1`
- HTTP status: `409`
- Error code: `CATALYST_INVALID_INPUT`
- Error message: `Invalid input value for column name`

This proves the scheduled worker ran and the independent signed callback reached
Creator. The remaining failure is inside the worker's Catalyst persistence path.
The next diagnostic is to compare the request, attempt, version, pointer, and
callback rows and the live Data Store column definitions. Do not retry or create
another article until the exact mismatched column is identified.

The supplied Catalyst rows confirm:

- Request `req_7ba8792f0633c4608076d5f975e747f5b37ec077` is `Failed` after attempt 1.
- Attempt `req_7ba8792f0633c4608076d5f975e747f5b37ec077:1` is `Failed` with the same error.
- Callback `callback_b42d00c7bd1b2a418b67037c27abc4098d1a04b9` is `Delivered` in one attempt.
- `GD_Published_Versions` contains no matching row.

The expected public Stratus object was then fetched directly and returned HTTP
200 with the correct publication ID, article/revision identities, content hash,
and published timestamp:

- Publication ID: `pub_7a776c6ad0cc01cd33b062ef8c47a2bbd2520e05`
- Object key:
  `content/044f836632dce340ec9536ec2a1031d6/50fe1b449dd3eafb30d070ea4286ee53/af9e3f0a042132307a21ad25114b9a7e0fbf1358005004d40c88130a1682f997.json`

This proves Creator preflight, rendering, and immutable public Stratus writing
succeeded. The failure is exactly the subsequent `GD_Published_Versions` row
insert. Capture that table's Schema View before modifying it.

The live `GD_Published_Versions` Add Row view then exposed the exact schema
mismatch. It contains:

- `Publication_ID`
- `Request_ID`
- `Article_UUID`
- `Revision_Number`
- `Content_Hash`
- `Object_ID`
- `Published_At`

It is missing the required `Revision_UUID` column. The worker inserts
`Revision_UUID`, which explains Catalyst's `Invalid input value for column name`
response and the absence of a version row. Audit `GD_Published_Pointers` for the
same omission before adding the missing column(s) and retrying.

The `GD_Published_Pointers` Add Row view contains all eight required application
columns: `Article_UUID`, `Publication_ID`, `Revision_UUID`, `Revision_Number`,
`Content_Hash`, `Object_ID`, `Published_At`, and `Pointer_Version`. No pointer
schema change is required. The only confirmed live schema correction is adding
`GD_Published_Versions.Revision_UUID` as required `VARCHAR(128)`.

The failed request/job is terminal and must remain preserved as evidence. After
the schema correction, use a fresh no-media article/revision for the successful
immediate-publish test rather than mutating or retrying the failed request.

## Clean Immediate Publish Succeeded in Creator

After adding `GD_Published_Versions.Revision_UUID`, a fresh full workflow test on
`otesting whole flow 1` succeeded:

- Creator job ID: `471741000000055086`
- Article UUID: `ART-2e90aadc7edfc88bee50e80a631a3f18`
- Revision UUID: `REV-ART-2e90aadc7edfc88bee50e80a631a3f18-0001`
- Status: `Succeeded`
- Attempts: `1`
- Requested: 20:33:29 IST
- Completed: 20:35:32 IST
- HTTP status: `200`
- Error code/message: empty

Creator Recent Activity shows `Catalyst Article Published` with Published state,
followed by the Published notification handoff. This live-verifies the clean
immediate path through worker success and Creator callback transition.

The matching `GD_Publication_Requests`, `GD_Published_Versions`,
`GD_Published_Pointers`, and `GD_Callback_Outbox` rows and public object were
then captured, as recorded below. The overall integration and remaining
Development matrix remain unverified.

## Clean Immediate-Publish Case Passed

The matching Catalyst evidence was captured and is internally consistent:

- Request ID: `req_cb0891a08c1614df232c5686e7a4c181721a0355`
- Request status: `Succeeded`, attempt count `1`, no error
- Publication ID: `pub_708ce0b5bd54f77330811e55fca5eca11b415389`
- Content hash:
  `af00df66a6aa667b494075b45cbfa9619b732273f27a0d4f139d1695ab5dac25`
- Published pointer: revision 1, pointer version `1`
- Success callback:
  `callback_6d2db831d66483a91ca455b82567e6a40fa7d6e8`, Delivered in one attempt
- Immutable public object:
  `content/239a7b769b0ac8532aaa4a0f9192310f/3d8077f0321c3a8a71fbae3f61196697/af00df66a6aa667b494075b45cbfa9619b732273f27a0d4f139d1695ab5dac25.json`

The public object returned HTTP 200 and contains matching schema version 2,
publication ID, article UUID, revision UUID/number, title, content hash, and
published timestamp. It contains no media, as expected for this test.

The clean no-media immediate-publish case is therefore **Passed**. This does not
verify the remaining scheduled, duplicate/idempotency, revoked-approval,
stale-revision, transient worker failure, callback outage, callback replay, or
media cases. The overall integration remains unverified pending the full matrix,
fresh Creator DS export, and negative role tests.

## Published-Article UI Guard Observed

After the successful publication, Creator no longer showed a Publish action for
`otesting whole flow 1`, and the article did not appear when the publication
queue was filtered to Approved work. This passes the visible Creator UI guard
against republishing an already-Published article. It does not replace the
separate signed duplicate-handoff/idempotency test, which remains pending.

## Scheduled Publication Test 1 Accepted — Outcome Pending

Creator accepted the first fresh scheduled handoff:

- Creator job ID: `471741000000055104`
- Article UUID: `ART-a2252680524acd3536e3f5d19fbe74dd`
- Handoff event:
  `EVT-HANDOFF-471741000000055104-1787935431348`
- Event time: 22:13:53 IST
- Previous/new state: `Scheduled` -> `Scheduled`

At 22:19 IST, Creator had not yet recorded the Published callback. This was only
about six minutes after acceptance and is not enough to call the schedule
failed without the exact `Scheduled_At` value and Catalyst request state. Keep
the case pending until its due time and inspect the Creator Publishing Health
record plus the matching `GD_Publication_Requests` row.

## 2026-08-29 — Scheduled Evidence Interrupted and Widget Fixes

A second fresh scheduled handoff was accepted before its 22:25 IST due time:

- Creator job ID: `471741000000055122`
- Article UUID: `ART-00aeea9600aabbdfa9c8ad3b8d5d8622`

The terminal Catalyst request/attempt state was not captured before all Creator
articles were deleted for cleanup. The missing Published UI state alone does not
prove the cron failed. Inspect `GD_Publication_Requests` for Creator jobs
`471741000000055104` and `471741000000055122`, plus their attempt rows and
AppSail logs around the due times. Deleting the Creator records also prevents a
fresh preflight or callback verification, so neither scheduled case may be
counted as Passed.

The deletion exposed a separate widget defect: Creator returns an empty report
as code `9220` (and in some contexts `9280`), but the widget only treated `9280`
as an empty collection. The repository now recognizes both codes and the stable
"No records exist in this report" response, allowing the empty dashboard and
New Article flow to render. The editor's article-title textarea now grows from
its measured scroll height on title, layout, and viewport changes, and both the
article title and body headings wrap long content instead of clipping it.

The widget passed TypeScript, production build, ZET validation, and ZET
packaging. Uploadable package:
`editor-widget/zet/dist/zet.zip`; SHA-256:
`b84f5f0661a095b4498bcb00352648e67bb8184d28afabd2a4692aba5fb0d229`.

The next Creator inspection confirmed that All Articles contained only the one
new long-title article, while the widget still showed many `Untitled article`
review rows. Those rows are orphaned `Review_Assignments` left after their
Article/Revision lookup targets were deleted; they are not restored Catalyst
content. The widget now excludes assignments missing an Article or Revision ID
from operational inbox/history counts, labels any remaining unresolved lookup
as `Unavailable article`, and disables snapshot navigation without both IDs.
It also adds `Published` to the status selector and a dedicated Published
Articles panel. The updated view was locally verified and repackaged; the
current uploadable package SHA-256 is
`642a94b96bf60368d8b5a61b67a574bd70134357cbf211024d4fe1c29ddd448d`.

The package was then uploaded to Creator and the dashboard fix passed live:
only the current Article remained, orphaned assignments disappeared from the
operational dashboard, and the counts converged to one In Review article with
one queued reviewer slot and zero closed history. Current test article:
`ART-82592a969d343c8107c7723190490df8`, Standard Review, In Review. Preserve
this article while the two earlier Catalyst scheduled-request rows are
diagnosed; do not schedule a third case yet.

## Scheduled Cron Execution Failure Confirmed

The two preserved Catalyst request rows were inspected:

- Job `471741000000055104`, request
  `req_9817f2f0f2c5b4025f3c4eeccaad51e70e6f03fb`, scheduled
  `2026-08-28T22:15:00+05:30`
- Job `471741000000055122`, request
  `req_85fbd415a07c04bc843245658f2389313309f9df`, scheduled
  `2026-08-28T22:25:00+05:30`

Both immutable snapshots exist, both request rows remained at attempt count
zero overnight, and neither contains a worker result/error. This initially
narrowed the failure to dynamic cron execution or the publication lease gate;
it is not a Creator callback failure.

The matching dynamic cron was found and its non-secret configuration is
correct: One Time at 2026-08-28 22:25:00 Asia/Kolkata, AppSail target
`gd-genedrift-publishing`, Job Pool `gdgenedriftpublishing`, POST, and request
body containing request ID
`req_85fbd415a07c04bc843245658f2389313309f9df`. This rules out the Creator time,
timezone serialization, target selection, and request-body construction as the
cause. The stored internal-job header value was exposed while copying the
details and must be rotated before any new test; it is intentionally not
recorded here.

Job Pool history then proved job `gdpub1a187e28e88e302` ran at 22:25 IST and
completed successfully in 28 ms. This establishes that the cron and AppSail
delivery worked. The endpoint returned HTTP success with the request still
Scheduled because `claimRequest` compared its offset-preserving
`2026-08-28T22:25:00+05:30` value against a UTC ISO value inside ZCQL. The
equivalent UTC instant starts with `16:55`, so the database-side DateTime
comparison could reject a due lease and the endpoint would idempotently return
the unchanged request with attempt count zero.

Service `0.1.5` fixes the lease gate by parsing Scheduled and RetryScheduled
due times into epoch milliseconds in JavaScript, then conditionally claiming
the exact state in ZCQL. The exact live timestamp pair is covered by a new
regression test; all 20 tests pass. Uploadable bundle:
`genedrift-catalyst-appsail-dev.zip`, SHA-256
`c5e470ba02eaab97ebcf2f95e29e2eb54399aa992adea13d73c4a37db42e0746`.
Deploy it, verify `/health` reports `0.1.5`, and run one fresh scheduled case.

The fresh scheduled case then succeeded for article
`ART-82592a969d343c8107c7723190490df8`, revision 1. Creator requested the
09:35 IST schedule at 09:32:41 and recorded Succeeded at 09:35:02 with exactly
one attempt and HTTP 200. The idempotency key contains due epoch
`1787976300000`. This confirms the `0.1.5` timezone lease fix operationally.
Before closing scheduled-case evidence, capture the corresponding Catalyst
request, immutable version, pointer, callback row, and Creator Published audit
event.

## Dashboard Redesign Package Prepared

The dashboard now separates All Work, Articles, Reviews, and role-gated
Publishing views; fixes Mine/Queue/All scope semantics; adds state/category/sort
filters, clearable search, refresh, filter reset, result counts, and metric
shortcuts; removes eight-item truncation; and gives each panel an independent
scroll region. Long titles wrap to two lines, actions stay grouped, and the
narrow layout uses a single-column board with horizontally scrollable metrics.
Build, typecheck, browser interaction/responsive checks, ZET validation, pack,
and archive integrity all pass. Upload `editor-widget/zet/dist/zet.zip`;
SHA-256 `b5822dcdc99a83f3d8aad27f94cb03b7c6b2235a864983b428c80121565b552f`.
Live Creator upload and role checks are pending.

## Completed Diagnostic

Open Catalyst Development -> Cloud Scale -> Data Store ->
`GD_Publication_Requests` -> Data View. Locate Creator job ID
`471741000000050093` (or its idempotency key) and inspect:

- `Status`
- `Snapshot_Object_ID`
- `Request_ID`
- `Last_Error_Code`
- `Last_Error_Message`

Interpretation:

- `Status = Received` or an empty `Snapshot_Object_ID`: the request-row update
  (`attachSnapshot`) failed.
- `Status = Queued` with `Snapshot_Object_ID` populated: the Data Store update
  succeeded and Catalyst Job Pool submission is the failing operation.

The row was captured and preserved as historical failure evidence. The Job
Scheduling payload fix was subsequently deployed and verified by the clean
immediate-publish case above; do not mutate this old request.

## Resume Attempt — 2026-08-28

- Re-read the checkpoint, handoff, status, and worklog before resuming.
- Attempted the exact `GD_Publication_Requests` Data View inspection for Creator
  job ID `471741000000050093` in the India Catalyst console.
- The in-app browser could not open the console because its administrator policy
  verification was unavailable. No Catalyst or Creator state was changed, and
  Publish was not retried.
- The five row values were subsequently supplied by the operator and are
  recorded above. The integration remains unverified.

## Still Required Before Verification

- Complete scheduled publish, duplicate/idempotency, revoked-approval,
  stale-revision, transient worker failure, callback outage, callback replay,
  and media tests in Development.
- For every remaining successful case, verify immutable objects, pointer
  advancement, Creator callback state, and audit events.
- Export the freshly cleaned Creator DS and run separate negative role tests.
- Rotate exposed credentials/secrets before production.
- Promote and configure production only after Development evidence passes.
- Deploy and live-test the locally implemented retract/unpublish boundary, then
  build the public read/index layer before the Next.js frontend. See
  `docs/PRODUCT_CHECKPOINT_2026-08-29.md` for the current product map and order.

## 2026-08-29 Retraction Build Addendum

Retraction is now implemented locally in AppSail `0.2.0`, Creator functions,
and the Article Workspace. It preserves immutable history and advances only the
CAS pointer to `Serving_Status = Retracted`. Before deployment, add the five
serving-state columns from `catalyst/README.md`, backfill existing pointer rows
to Published, add Creator's Unpublished/job fields, and install the private
`retract_published_article` API. Deployment ZIP SHA-256:
`031d4358b495e5e2e0c2f6ecfc073d382074bf52aded0555159a3303fe22dd7a`.
Widget ZIP SHA-256:
`853969cdf4e605339946b2c51ba96b55d7991cceccb6ca2878931a159edd598d`.
All 23 Catalyst tests and widget build/ZET checks pass. This is not live evidence.

## 2026-08-29 Publication Lock and Contention Addendum

The live article `ART-7c4ee0c14565162e57d56ceef5d7c347` exposed that an
accepted Publish control remained actionable. A second click reached the
existing Creator guard, and Publishing Health then showed attempt 1 Processing
with transient `POINTER_CONTENTION` and retry time 16:20:54 IST. Do not infer
final success from that intermediate row; capture its post-retry state.

The prepared widget now locks the article synchronously, reads queued/processing
`Publication_Jobs`, displays Processing, and removes all competing publication
actions. The Catalyst adapter now reports contention only if another pointer
actually exists after a failed insert; otherwise the original Catalyst error is
preserved. This distinguishes a real race from missing columns, invalid values,
or permissions on `GD_Published_Pointers`.

Widget ZIP SHA-256:
`7145f54e3084238fc271ecc853b022d5e759e9e85321f1c2b94efd1d6a191c83`.
The diagnostic is superseded by AppSail `0.2.1`, SHA-256:
`e30dfe4581c1506ed132961fd47aa385f5455f6d4f19bd11adc5185778282efb`.
Version `0.2.1` dispatches Publish/Retract immediately, preserves exact future
Schedule times, and retains delayed cron execution only for retries. All 25
Catalyst tests pass. Deployment and live verification remain pending.

The fresh `ART-b800764c248d8837e812a5c8e568b8e0` immediate-publish case then
succeeded from 16:54:05 to 16:54:08 IST in one attempt with HTTP 200. Retraction
did not reach Catalyst because the live Creator app returned `9350` for the
missing `retract_published_article` Custom API. Create that private OAuth2 API
and verify the live Unpublished/job fields before retrying the same article.

## 2026-08-29 Live Retraction Evidence Addendum

After installing the Creator retraction API and updated handoff/callback
functions, article `ART-767af2ab02d5961458d3dd6a7ba584d1`, revision
`REV-ART-767af2ab02d5961458d3dd6a7ba584d1-0001`, passed immediate Unpublish.
Creator Publishing Health recorded Succeeded, one attempt, HTTP 200, requested
18:10:08 and completed 18:10:09 IST. The dashboard moved the article to
Retracted Articles with state Unpublished.

Catalyst retained publication `pub_7596ccdb472fbe5f3330aae22f70ab6541eb7339`,
the immutable revision, content hash, and object path. Its pointer advanced to
version 2 with `Serving_Status = Retracted`, `Retracted_At =
2026-08-29T12:40:08.460Z`, `Retraction_Reason = sdsdsds`, and
`Retraction_Event_ID = retract_35b5c56abc79199413aac01211dc4be54d52ce65`.
This verifies the positive Catalyst retraction mutation and Creator terminal
state. Still capture the matching Creator `Catalyst Article Retracted` audit
event. Do not mark the integration verified until the full Development matrix,
fresh Creator DS export, and negative role tests pass.

## 2026-08-29 Adaptive Dashboard Refresh Addendum

The next Creator widget package adds adaptive live dashboard updates without
per-row polling. It reloads the existing dashboard batch every five seconds
while any publication job is Queued/Processing and every 45 seconds while idle,
pauses while the tab is hidden, refreshes immediately on return, and deduplicates
manual/action/automatic reloads. The command bar reports Updating, last
successful update time, or a non-destructive retrying error state.

Typecheck, production build, ZET validation/pack, and ZIP integrity pass. Upload
`editor-widget/zet/dist/zet.zip`; SHA-256
`ca2dad31734250c40a2b540d3f78b72b4b8a19f86175e7f61833516fff4dbf1b`.
The package was uploaded and a complete live Creator workflow was tested. Job
and article state changes appeared automatically without pressing Refresh, so
the adaptive dashboard behavior is live verified. This does not change the
overall integration verification gate.

## 2026-08-29 Public Read API Build Addendum

AppSail `0.3.0` adds public published-only list/search/filter/pagination, slug,
taxonomy, sitemap, and RSS routes. The serving authority is the current
`GD_Published_Pointers` row plus its immutable public Stratus document; no
Creator draft/review/private snapshot source is queried. Retracted pointers are
excluded from lists and return HTTP 410 by slug with retraction metadata.

Public DTOs remove Creator record IDs, internal approved pointers, and the
TipTap editor document while retaining sanitized HTML, SEO fields, public media,
and immutable publication identities. Tests also cover pointer/object identity
drift, filtering, pagination, missing articles, and retraction. All 28 tests and
artifact integrity pass. Deploy `genedrift-catalyst-appsail-dev-v0.3.0.zip`;
SHA-256
`97caf31612d0b6742c853bfe965ecfc8015cb22fadd765a52c9f2818015f51e7`.
Configure `PUBLIC_SITE_BASE_URL`, then capture Development responses for list,
slug, ETag/304, taxonomy, sitemap/RSS, and a post-retraction HTTP 410 case. This
build is not live verified and does not close the overall verification gate.

Development `0.3.0` subsequently passed the core read checks. The list returned
five Published articles and excluded retracted
`ART-767af2ab02d5961458d3dd6a7ba584d1`; detail, taxonomy, and filtered
pagination returned HTTP 200; ETag replay returned 304; and slug `hehehheehe`
returned HTTP 410 with matching retraction metadata. Live response headers also
revealed a five-minute stale-while-revalidate window. AppSail `0.3.1` removes
that window, limits detail caching to five seconds, and sets 410 responses to
`no-store`. Deploy `genedrift-catalyst-appsail-dev-v0.3.1.zip`; SHA-256
`13018639a290a6366c0c348e191d97ac9907ab158cf3b339301f831c619573f6`,
then recheck its detail and 410 cache headers. Sitemap/RSS still await
`PUBLIC_SITE_BASE_URL`.

Development `/health` subsequently reported `0.3.1`. A published detail HEAD
response returned `Cache-Control: public, max-age=5, s-maxage=5,
must-revalidate`, and retracted slug `hehehheehe` returned HTTP 410 with
`Cache-Control: no-store` and the matching retraction metadata. The public read
API core and cache-safety correction are live verified. Sitemap/RSS remain
pending until the frontend base URL is selected.
