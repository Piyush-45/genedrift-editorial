# GeneDrift Catalyst Publishing Service

Status: deployed in Catalyst Development. Immediate no-media publication and one
fresh scheduled path have passed; full Development verification is still pending.

This AppSail service is the production publication execution boundary. Creator
remains the editorial authority. The public Next.js reader is intentionally not
part of this phase.

## Guarantees

- Creator handoffs are HMAC-authenticated, time-bounded, and replay-protected.
- A Creator `Publication_Jobs.Idempotency_Key` deterministically identifies one
  Catalyst request; reuse with different content is rejected.
- The accepted Approved snapshot, each published document, and every published
  media file are content-addressed Stratus objects. Published-version rows are
  insert-only.
- Workers use a lease, have bounded exponential retry, and safely converge when
  Catalyst delivers the same job more than once.
- Immediately before writing, the worker asks a private Creator Custom API to
  confirm the exact job, article, approved revision pointer, state, UUIDs, and
  document checksum are still valid.
- A stale revision cannot replace a newer pointer. Pointer changes use a
  versioned conditional update.
- Creator callbacks use an independent outbox and retry policy. Callback failure
  never rolls back a successful publication.
- Creator callback events are deterministic and Creator applies each event once.

The service supports publish, schedule, and retract handoffs. Retraction changes
only the versioned serving pointer and preserves immutable snapshots, versions,
article JSON, and media. The positive immediate retraction path is live verified
in Development. Version `0.4.0` adds the maintained public index described below.
The deployed Development service remains `0.3.1` until the new table is
provisioned, rebuilt, and live verified.

Version `0.4.3` simplifies image attribution: Caption remains part of the
immutable published document, while legacy Credit data is retained in the
handoff for compatibility but is no longer rendered into article HTML.

These are application-level immutability guarantees. Restrict Catalyst console,
Data Store, and Stratus delete/update privileges to the deployment operators;
do not grant the runtime or editorial users general mutation access.

## Runtime

- AppSail managed Node.js 22
- Catalyst Node SDK 3.4.0 (the previous 2.5.0 package did not expose Stratus)
- Express service entry: `dist/src/server.js`
- Health route: `GET /health`
- Creator handoff: `POST /v1/publications`
- Public reads:
  - `GET /v1/public/articles`
  - `GET /v1/public/articles/:slug`
  - `GET /v1/public/taxonomy`
  - `GET /v1/public/sitemap.xml`
  - `GET /v1/public/rss.xml`
- Private worker targets:
  - `POST /internal/jobs/publish`
  - `POST /internal/jobs/callback`
  - `POST /internal/maintenance/rebuild-public-index`

Reference: [Catalyst AppSail managed Node runtimes](https://docs.catalyst.zoho.com/en/serverless/help/appsail/catalyst-managed-runtimes/key-concepts/)
and [Express/npm AppSail setup](https://docs.catalyst.zoho.com/en/serverless/help/appsail/help-guides/nodejs.md/express-npm/).

Install and verify locally:

```bash
npm ci
npm run typecheck
npm test
```

## Public read API (`0.4.0`)

The read API derives lists, search, facets, feeds, and slug discovery from the
compact `GD_Public_Index`. Publish and retract workers update that row
idempotently after the authoritative pointer compare-and-swap and before the job
can succeed. Article detail verifies the index against the current pointer and
loads exactly one immutable public Stratus document. It never reads Creator
drafts, review records, private snapshots, or historical versions.

`GET /v1/public/articles` supports `page` (default 1), `limit` (default 20,
maximum 50), `q`, `category`, and `tag`. It returns summaries, pagination, and
available category/tag facets. `GET /v1/public/articles/:slug` returns sanitized
HTML and public metadata but removes Creator record IDs, approved pointers, and
the internal editor document. Responses are public GET-only CORS resources with
ETags and short, must-revalidate cache lifetimes so publication and retraction
changes converge. Article details have a five-second cache bound, retracted
responses are `no-store`, and list/taxonomy feeds never permit stale-while-
revalidate serving.

The sitemap and RSS routes include only `Index Follow` articles and require
`PUBLIC_SITE_BASE_URL`. The authenticated rebuild route migrates existing rows
from authoritative current pointers and their immutable objects. Normal
publish/retract traffic maintains the index automatically. The adapter pages
through compact rows, so a 1,800-item list/search test no longer loads 1,800
article objects.

## Data Store schema

Create these tables in the same Catalyst environment. Use case-sensitive names.
Use `VARCHAR` for ISO-8601 timestamps because all values are normalized to UTC
and lexical comparison preserves chronological order. Use the largest supported
text type for error-message fields. Catalyst `VARCHAR` columns have a maximum
length of 255; the runtime's deterministic Stratus keys stay below that limit.

Reference: [Catalyst Data Store columns and data types](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-store/columns/).

### `GD_Publication_Requests`

| Column | Type | Constraint |
|---|---|---|
| `Request_ID` | VARCHAR(64) | unique, required |
| `Idempotency_Key` | VARCHAR(150) | unique, required |
| `Action` | VARCHAR(20) | required |
| `Status` | VARCHAR(30) | required |
| `Article_UUID` | VARCHAR(128) | required, indexed |
| `Revision_UUID` | VARCHAR(128) | required |
| `Revision_Number` | BIGINT | required |
| `Creator_Job_ID` | VARCHAR(64) | required, indexed |
| `Scheduled_At` | VARCHAR(40) | nullable, indexed |
| `Attempt_Count` | BIGINT | required |
| `Next_Attempt_At` | VARCHAR(40) | nullable, indexed |
| `Snapshot_Object_ID` | VARCHAR(255) | nullable |
| `Content_Hash` | VARCHAR(64) | required |
| `Lease_Token` | VARCHAR(64) | nullable |
| `Lease_Until_Epoch_MS` | BIGINT | nullable |
| `Publication_ID` | VARCHAR(64) | nullable |
| `Last_Error_Code` | VARCHAR(100) | nullable |
| `Last_Error_Message` | TEXT | nullable |
| `Created_At` | VARCHAR(40) | required |
| `Updated_At` | VARCHAR(40) | required |

### `GD_Published_Versions`

| Column | Type | Constraint |
|---|---|---|
| `Publication_ID` | VARCHAR(64) | unique, required |
| `Request_ID` | VARCHAR(64) | unique, required |
| `Article_UUID` | VARCHAR(128) | required, indexed |
| `Revision_UUID` | VARCHAR(128) | required |
| `Revision_Number` | BIGINT | required |
| `Content_Hash` | VARCHAR(64) | required |
| `Object_ID` | VARCHAR(255) | required |
| `Published_At` | VARCHAR(40) | required |

Never expose update/delete operations for this table through application code.

### `GD_Published_Pointers`

| Column | Type | Constraint |
|---|---|---|
| `Article_UUID` | VARCHAR(128) | unique, required |
| `Publication_ID` | VARCHAR(64) | required |
| `Revision_UUID` | VARCHAR(128) | required |
| `Revision_Number` | BIGINT | required |
| `Content_Hash` | VARCHAR(64) | required |
| `Object_ID` | VARCHAR(255) | required |
| `Published_At` | VARCHAR(40) | required |
| `Pointer_Version` | BIGINT | required |
| `Serving_Status` | VARCHAR(20) | required; `Published` or `Retracted` |
| `Retracted_At` | VARCHAR(40) | nullable |
| `Retraction_Reason` | TEXT | nullable |
| `Retraction_Event_ID` | VARCHAR(64) | nullable |
| `Replacement_Path` | VARCHAR(255) | nullable |

The adapter advances this row with `Article_UUID`, the previous
`Publication_ID`, and `Pointer_Version` in the update predicate. That is the
compare-and-swap boundary.

Add these serving-state columns before deploying AppSail `0.2.0`. Existing
pointer rows must be backfilled to `Serving_Status = Published`. Retraction uses
the same CAS predicate, increments `Pointer_Version`, and never updates the
immutable version or Stratus object.

### `GD_Public_Index`

| Column | Type | Constraint |
|---|---|---|
| `Article_UUID` | VARCHAR(128) | unique, required |
| `Publication_ID` | VARCHAR(64) | required |
| `Revision_UUID` | VARCHAR(128) | required |
| `Revision_Number` | BIGINT | required |
| `Content_Hash` | VARCHAR(64) | required |
| `Object_ID` | VARCHAR(255) | required |
| `Published_At` | VARCHAR(40) | required, indexed |
| `Pointer_Version` | BIGINT | required |
| `Serving_Status` | VARCHAR(20) | required, indexed |
| `Slug` | VARCHAR(180) | unique, required, indexed |
| `Title` | VARCHAR(250) | required |
| `Excerpt` | TEXT | nullable |
| `SEO_Title` | VARCHAR(250) | nullable |
| `SEO_Description` | TEXT | nullable |
| `Primary_Category` | VARCHAR(250) | nullable, indexed |
| `Tags_JSON` | TEXT | required |
| `Search_Text` | TEXT | required |
| `Reading_Time_Minutes` | BIGINT | required |
| `Featured_Media_JSON` | TEXT | nullable |
| `Robots_Directive` | VARCHAR(30) | required |
| `Retracted_At` | VARCHAR(40) | nullable |
| `Retraction_Reason` | TEXT | nullable |
| `Replacement_Path` | VARCHAR(255) | nullable |
| `Updated_At` | VARCHAR(40) | required |

Create this table before deploying `0.4.0`. After deployment, invoke the
authenticated rebuild route once, confirm its count matches current pointers,
and repeat list/detail/410 verification. Do not expose its write permissions or
the maintenance route to browser clients.

### `GD_Publication_Attempts`

| Column | Type | Constraint |
|---|---|---|
| `Attempt_ID` | VARCHAR(96) | unique, required |
| `Request_ID` | VARCHAR(64) | required, indexed |
| `Attempt_Number` | BIGINT | required |
| `Status` | VARCHAR(30) | required |
| `Started_At` | VARCHAR(40) | required |
| `Completed_At` | VARCHAR(40) | nullable |
| `Error_Code` | VARCHAR(100) | nullable |
| `Error_Message` | TEXT | nullable |

### `GD_Callback_Outbox`

| Column | Type | Constraint |
|---|---|---|
| `Event_ID` | VARCHAR(64) | unique, required |
| `Request_ID` | VARCHAR(64) | required, indexed |
| `Creator_Job_ID` | VARCHAR(64) | required |
| `Idempotency_Key` | VARCHAR(150) | required |
| `Callback_Status` | VARCHAR(20) | required |
| `Publication_Attempt_Count` | BIGINT | required |
| `Publication_ID` | VARCHAR(64) | nullable |
| `Object_ID` | VARCHAR(255) | nullable |
| `Published_At` | VARCHAR(40) | nullable |
| `Publication_Next_Retry_At` | VARCHAR(40) | nullable |
| `Error_Code` | VARCHAR(100) | nullable |
| `Error_Message` | TEXT | nullable |
| `Delivery_Status` | VARCHAR(30) | required, indexed |
| `Delivery_Attempt_Count` | BIGINT | required |
| `Next_Delivery_At` | VARCHAR(40) | nullable, indexed |
| `Last_Delivery_Error` | TEXT | nullable |

### `GD_Request_Nonces`

| Column | Type | Constraint |
|---|---|---|
| `Nonce` | VARCHAR(200) | unique, required |
| `Expires_At` | VARCHAR(40) | required, indexed |

Create a daily maintenance task to delete expired nonce rows after a safe
retention window. This maintenance task must never touch published versions or
published objects.

## Stratus

Confirm Cloud Scale > Stratus is available in the Catalyst project before
continuing. If it is absent, ask Catalyst support to enable it for the selected
data center; do not silently fall back to File Store.

Create two buckets in each Catalyst environment:

1. `genedrift-publishing-private`, using the Authenticated permission template.
   It contains only immutable approved handoff snapshots under `snapshots/`.
2. `genedrift-publishing-public`, using the Public permission template. Public
   users receive `GetObject` only. It contains published article JSON under
   `content/` and media under `media/`.

Copy the exact bucket names to `GD_STRATUS_PRIVATE_BUCKET` and
`GD_STRATUS_PUBLIC_BUCKET`. Copy the environment-specific public bucket URL
shown by Catalyst to `GD_STRATUS_PUBLIC_BASE_URL`; Development commonly
contains `-development` and the data-center domain can differ.

Keep versioning disabled for these content-addressed buckets. Runtime writes use
`overwrite: false`, and identical retry writes converge on the same key. Enable
Stratus encryption. Do not grant public `PutObject` or `DeleteObject`, and do not
grant editorial users or the ordinary runtime a general delete path.

Object layout:

- `snapshots/{requestId}/{handoffHash}.json` — private approved snapshot;
- `content/{articleIdentityHash}/{revisionIdentityHash}/{handoffHash}.json` —
  public immutable article document; and
- `media/{checksumPrefix}/{sha256}.{verifiedExtension}` — public immutable media.

The worker downloads referenced `Media_Assets.Draft_File` bytes through Creator
API v2.1, enforces the configured size limit, verifies supported image magic
bytes (`jpeg`, `png`, `gif`, or `webp`), SHA-256 checksum and dimensions, then
writes the object once. The success callback updates Creator's
`Published_Object_Key`, `Published_URL`, and `Status = Ready`.
The callback outbox does not duplicate the potentially large media array in a
Data Store text column. On every delivery attempt it reloads the mappings from
the immutable published Stratus document referenced by `Object_ID`.

Reference: [Stratus overview](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/stratus/overview/),
[upload object](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/stratus/upload-object/),
and [bucket permissions](https://docs.catalyst.zoho.com/en/cloud-scale/help/stratus/stratus-permissions/).

## Production scheduling

Create a Job Pool named by `GD_JOBPOOL_NAME` with AppSail as an allowed
target. The service dispatches deterministic work as follows:

- immediate Publish and Retract use direct Job Pool submission with no cron;
- a user-selected future Schedule uses a one-time cron at that exact time;
- each bounded publication retry; and
- each independent Creator-callback retry.

The optional Job Scheduling retry configuration is omitted because the domain
worker owns retry count, error classification, and backoff. This prevents
platform retries and domain retries from multiplying each other. Dynamic cron
names are deterministic and capped at Catalyst's 30-character limit; submitted
job names are separately capped at 20 characters. User schedules must be at
least two minutes ahead and are never silently shifted. Only automatic retries
receive the two-minute cron safety lead. A new retry time creates a new cron
identity; duplicate requests for the same execution time converge.

The adapter uses the current Job Scheduling API when the runtime exposes it and
the Catalyst Cron API as a compatible one-time-webhook fallback. Verify the
selected path once in Development before promoting to Production.

Reference: [Catalyst Job Scheduling](https://docs.catalyst.zoho.com/en/job-scheduling/),
[Job Pools](https://docs.catalyst.zoho.com/en/job-scheduling/help/jobpool/introduction/),
and [one-time cron creation](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/job-scheduling/cron/create-one-time-cron/).

## Secrets and connections

Copy `.env.example` into Catalyst environment variables; never commit values.

- `PUBLISHING_HMAC_SECRET`: same 32+ character secret used by Creator handoff and
  callback functions.
- `INTERNAL_JOB_SECRET`: separate 32+ character secret used only for private job
  targets.
- `CREATOR_CALLBACK_URL`: OAuth2 Custom API for callback/audit updates.
- `CREATOR_VALIDATE_URL`: OAuth2 Custom API for the execution-time preflight.
- `CREATOR_API_BASE_URL`, `CREATOR_ACCOUNT_OWNER`, `CREATOR_APP_LINK_NAME`,
  `CREATOR_MEDIA_REPORT_LINK_NAME`, and
  `CREATOR_MEDIA_FILE_FIELD_LINK_NAME`: identify the Creator v2.1 file-download
  boundary. Set `CREATOR_ENVIRONMENT` separately in each Catalyst environment.
- `GD_STRATUS_PRIVATE_BUCKET`, `GD_STRATUS_PUBLIC_BUCKET`, and
  `GD_STRATUS_PUBLIC_BASE_URL`: exact Stratus console values.
- `MAX_MEDIA_BYTES`: server-enforced per-image limit; the supplied default is
  10 MiB and must match the editor policy.
- `CREATOR_CONNECTION_NAME`: local name for the SDK connector, for example
  `genedrift_creator_callback`.
- `CREATOR_OAUTH_CLIENT_ID`, `CREATOR_OAUTH_CLIENT_SECRET`, and
  `CREATOR_OAUTH_REFRESH_TOKEN`: Zoho API Console credentials used by the SDK
  connector to refresh access automatically.
- `CREATOR_OAUTH_TOKEN_URL`: use the Accounts endpoint for the Creator data
  center (`https://accounts.zoho.in/oauth/v2/token` for this India project).
- `CREATOR_OAUTH_TOKEN`: short-lived development fallback only; leave unset in
  production when the refreshable connector values are configured.

Create the OAuth client in the India Zoho API Console and request only
`ZohoCreator.customAPI.EXECUTE` and `ZohoCreator.report.READ`. The latter permits
download of approved media files through `Media_Assets_Report`; it does not grant
record update/delete. Confirm the scope names in the current Creator OAuth
console before issuing the grant. Keep
the client secret and refresh token only in Catalyst environment variables.
Rotate the HMAC and internal-job secrets per Catalyst environment.

## Promotion gate

Do not call this production-verified until all of the following pass in Catalyst
Development and then Production:

1. Signed immediate handoff and duplicate replay/idempotency tests.
2. Scheduled execution at two different times.
3. Transient publish failure followed by bounded retry and success.
4. Permanent Creator preflight denial after approval is revoked.
5. Stale revision race: the newer pointer remains current.
6. Callback outage: publication stays live, outbox retries, Creator later catches up.
7. Replayed callback: Creator creates one audit event and one final transition.
8. Post-preflight Creator state race: callback is acknowledged without
   overwriting newer Creator state and raises one reconciliation-conflict audit.
9. Operator confirmation that published-version rows and objects are not mutable
   through normal runtime or editorial permissions.
10. JPEG/PNG/GIF/WebP publication, checksum/type/size/dimension rejection,
    duplicate-media convergence, stable public URL, and Creator media-field
    callback tests.
