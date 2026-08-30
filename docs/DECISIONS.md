# Decision Log

## Workflow mutations use private Creator Custom APIs

- Status: Accepted
- Decision: Widget workflow commands invoke OAuth2-authenticated Creator Custom
  APIs backed by Deluge functions. Direct widget CRUD remains limited to draft
  editing and media operations.
- Reason: Submission, assignment creation, revision freezing, and audit logging
  must be validated together on the server and run under the signed-in Creator
  user's permissions.
- Consequence: Each lifecycle command has one explicit server-side boundary and
  can later map to the client's Employee/Team structures without trusting browser
  state.

## Notifications are best-effort handoffs

- Status: Accepted
- Decision: Editorial workflow functions may call a shared notification helper
  after the authoritative state mutation and audit event.
- Reason: Email delivery should help users move work forward, but notification
  failure must not roll back a valid editorial transition.
- Consequence: Live verification must check both state/audit records and email
  delivery, while treating the state transition as the source of truth.

## Scheduling execution is owned by Catalyst

- Status: Accepted
- Decision: Approved articles move to Scheduled through a private Publisher/Admin
  Custom API and are immediately handed to Catalyst. Catalyst Job Scheduling/Cron
  owns due-time execution, retry, and immutable publication. The old Creator
  date-field publisher is disabled; Creator retains only low-frequency handoff
  reconciliation.
- Reason: Creator custom schedules repeat Daily/Weekly/Monthly/Yearly/Once and
  are not precise enough for multiple publish times per day. Creator date-field
  schedules are suitable for the demo, while Catalyst gives the production job
  execution, retry, and one-minute scheduling boundary.
- Consequence: Creator remains the editorial control plane. Catalyst becomes the
  publication execution plane without changing Publisher/Admin authorization or
  allowing a Creator timer to write Published state directly.

## Published content uses immutable versions and a mutable CAS pointer

- Status: Accepted
- Decision: Every approved snapshot and published document is content-addressed
  and append-only. One current-pointer row per article is the only mutable
  publication record, and it advances with a versioned conditional update.
- Reason: Retries, duplicate deliveries, and concurrent workers must converge
  without overwriting a newer publication or mutating historical content.
- Consequence: The public reader later resolves the pointer, while historical
  versions remain auditable. Stratus and Data Store operator permissions must
  prohibit ordinary update/delete access to immutable data.

## Published content and media use Catalyst Stratus

- Status: Accepted
- Decision: Use an authenticated Stratus bucket for immutable approved snapshots
  and a separate public-read Stratus bucket for immutable published article JSON
  and media. Object keys are content-addressed; public users receive `GetObject`
  only. File Store is not the production published-content boundary.
- Reason: Stratus is Catalyst's scalable object store, supplies stable object
  URLs, supports path permissions and streamed SDK access, and matches the
  previously selected S3-compatible storage direction without adding another
  production provider.
- Consequence: Each Catalyst environment needs two buckets and its own public
  bucket URL. The worker must validate Creator media bytes before the immutable
  write and return the mapping through the signed callback. Public Next.js work
  remains a later phase.

## Creator is revalidated at worker execution time

- Status: Accepted
- Decision: A signed handoff captures the approved snapshot, but the Catalyst
  worker must also call a private Creator preflight immediately before writing.
  It verifies the exact open job, approved pointer, state, UUIDs, and checksum.
- Reason: Approval can be revoked or superseded between scheduling and execution.
- Consequence: Scheduled snapshots remain immutable, but revoked authority blocks
  pointer advancement and produces an audited permanent failure.

## Creator callbacks use an independent transactional outbox

- Status: Accepted
- Decision: Publication completion enqueues a deterministic callback event in
  Catalyst. Delivery has its own retry/dead-letter lifecycle and Creator applies
  each event once through the unique audit event UUID.
- Reason: A Creator outage must not roll back an already-committed publication,
  and callback replay must not duplicate workflow transitions.
- Consequence: Temporary control-plane lag is visible and recoverable without
  compromising the published store.

## Retraction changes serving state and preserves immutable history

- Status: Accepted and implemented locally; deployment/live validation pending
- Decision: A retract/unpublish command will mark the current public serving
  record Retracted and produce a signed Creator callback. It will not delete or
  mutate approved snapshots, published versions, article JSON, or shared media.
- Reason: Public withdrawal must be immediate and auditable without destroying
  evidence or breaking idempotency and rollback analysis.
- Consequence: The public read layer must exclude retracted entries and return
  HTTP 410 or an approved redirect. Republish creates a new audited publication.

## Confirmed

- Blog/Insights is delivered before the full website revamp.
- Next.js is the public frontend framework.
- Vercel Pro is the intended frontend host.
- Zoho Creator is the editorial system.
- Zoho Catalyst is the backend and published-content store.
- Public traffic will not read Creator directly.
- A demonstration is built before client integration.
- Production accounts and credentials remain client-owned.
- The full website sitemap and images are pending from the client.
- The first release is English-only.
- Articles have one primary category and multiple tags.
- Articles can require more than one reviewer approval.
- Reviewers may publish only when separately assigned Publisher permission.
- Scheduled publication uses Asia/Kolkata.
- Search, author pages, related articles, RSS, and social sharing are included.
- Public comments and code blocks are excluded from the first release.
- Approval counts are controlled through reusable policies with an audited
  per-article administrator override.
- Authors may suggest eligible reviewers; otherwise articles enter a shared queue.
- Review assignments have no automatic deadline.
- Changes Requested is the normal revision loop; Rejected is terminal by default.
- The demo Zoho Creator account uses the India data center (`zoho.in`).
- The demo Creator application will be created with Creator Environments enabled.
- The existing `genedrift-editorial-platform-practical-v3` application is treated
  as reference only and will not be modified.
- Creator structure will be delivered as a version-controlled DS file and imported
  as a new application; DS import will not target the existing blank application.
- The Creator widget, seed records, credentials, and environment configuration are
  separate deployment artifacts because they are not contained in the DS file.
- The editor widget uses Creator Widget SDK V2 and a bundled React/TipTap build;
  no application secrets are present in the browser bundle.
- Creator record IDs are used for internal article-to-revision pointers, while
  stable UUID fields remain the portable identifiers across system boundaries.
- Draft editor JSON is stored in the revision's Creator file field. Catalyst only
  receives immutable preview or publishing snapshots in later milestones.
- Creator media uploads use a two-step operation: create the `Media_Assets`
  metadata record, then upload `Draft_File`. File presence is enforced before
  review/publishing rather than as a form-level required field.
- Canonical editor image blocks store stable Media Asset IDs. Temporary Creator
  file URLs remain preview-only and are never treated as publishable URLs.
- The widget verifies uploaded editor JSON through Creator's File API. Creator may
  return JSON files as already-parsed document objects rather than raw text.
- Widget-managed fields must be exposed through the associated Creator report so
  they can be reloaded through the report API. The production client setup should
  use restricted API-oriented reports rather than exposing technical fields in
  general editorial views.
- Successful Creator update responses are authoritative for metadata fields that
  Creator omits from immediate readback. Returned fields are still compared, and
  editor-document content is independently read and checksum-verified.

## Proposed, Pending Validation

- A dedicated Website & Publishing Creator application in the client account
- Creator Blueprint as the authoritative workflow state machine
- Shared review queue with optional preferred reviewer

## Open Decisions

- Client Creator plan, version, data center, and environment availability
- Catalyst data center and project ownership
- Approval count and specialist review requirements
- Whether Regulated approval requires a specific specialist role
- Search implementation
- Production malware-scanning provider or documented risk acceptance
- Analytics, consent, newsletter, and lead integrations
- Migration volume and URL strategy
