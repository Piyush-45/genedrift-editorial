# Architecture

Status: Catalyst publishing boundary deployed in Development; full verification pending

## System Boundaries

### Zoho Creator

Owns drafts, article revisions, editorial identities, assignments, comments,
workflow state, and editorial audit information.

### Zoho Catalyst

Receives signed publishing requests, validates content, creates immutable
published versions, records synchronization attempts, owns production scheduled
publication execution, and exposes publish-ready content to the frontend.

### Vercel and Next.js

Render the public blog, provide preview deployments, cache published pages, and
perform granular on-demand revalidation after content changes.

### Catalyst Stratus

An authenticated bucket stores immutable approved snapshots. A separate
public-read bucket stores immutable article JSON and validated media independently
from the frontend runtime. Public access is `GetObject` only.

## Publishing Sequence

1. An authorized Creator user publishes an approved revision.
2. Creator sends a signed, idempotent request to Catalyst.
3. Catalyst validates the signature, nonce, content schema, exact approved
   snapshot, and Creator media source mappings, then stores that accepted
   snapshot immutably in private Stratus.
4. An immediate or one-time scheduled worker obtains a lease and revalidates the
   exact open job, approved revision pointer, state, identities, and checksum
   through a private Creator preflight API.
5. Catalyst downloads each approved Creator media file, verifies its signature,
   size, checksum, and dimensions, stores it under an immutable Stratus key, and
   creates the immutable content-addressed published version.
6. Catalyst conditionally advances the versioned current published-content
   pointer; stale revisions cannot replace newer ones.
7. A separate callback outbox delivers the result and media mappings to Creator.
   Creator applies the deterministic event once, updates its media/job/article/
   revision read model, and writes the audit event.

If Creator changes after preflight but before callback, Catalyst's committed
publication remains authoritative. Creator acknowledges the result without
overwriting its newer state and raises a publication-state-conflict audit event
for explicit operator reconciliation.

Frontend cache revalidation is intentionally deferred to the later Next.js phase.

If any step before the atomic update fails, the previous published revision
remains active.

## Public Read Sequence

The public browser never reads Creator or Catalyst Data Store directly. A
read-only Catalyst API (or generated immutable public index) resolves the current
published pointer by slug, lists published entries with pagination and taxonomy
filters, and loads the immutable Stratus document. Retracted entries are excluded
from listings and return HTTP 410 or a configured redirect. Next.js calls this
boundary server-side and uses tagged cache revalidation after publish, retract,
or republish events.

The current Development service implements this public read layer through the
Catalyst public content API and maintained `GD_Public_Index`. It supports public
listing, search/filter/pagination, slug detail, taxonomy/facet data, sitemap/RSS
inputs, missing 404 responses, and retracted GET 410 responses. The remaining
known gap is strict frontend page-level 410 handling for retracted Next.js
routes on Vercel.

## Retraction Sequence

1. A Publisher or Editorial Admin submits a signed, idempotent retract request
   with a required reason and optional replacement route.
2. Catalyst revalidates authority and the current pointer, then marks the mutable
   serving record Retracted. Immutable snapshots, versions, JSON, and media stay
   append-only for audit and recovery.
3. The public read layer removes the article from listings and serves HTTP 410 or
   the configured redirect for its old route.
4. A signed idempotent callback moves Creator to an explicit
   Unpublished/Retracted state and records the audit event.
5. Republish creates a new immutable publication and audited pointer transition.

Current AppSail packages, the Creator callback path, and the dashboard implement
the retraction path. Catalyst public article GET returns 410 for retracted
slugs, while the public frontend still needs strict page-level 410 enforcement
instead of rendering the retraction notice with HTTP 200.

## Scheduling Sequence

1. A Publisher or Editorial Admin schedules an approved revision in Creator.
2. Creator records `Workflow_State = Scheduled`, `Scheduled_At`, and a queued
   publication job.
3. Creator immediately hands the immutable approved snapshot and due time to
   Catalyst using the same signed idempotent boundary as immediate publication.
4. Catalyst creates a deterministic one-time job. At the due time, the leased
   worker rechecks Creator authority, writes immutable content, conditionally
   advances the pointer, and writes status back through the callback outbox.
5. A low-frequency Creator reconciliation function may redeliver handoffs that
   were never acknowledged. It is not the due-time executor and cannot publish.

## Preview Sequence

Creator sends a time-limited draft snapshot to Catalyst. Catalyst returns a
signed preview identifier. Vercel renders the snapshot through a protected
preview route. Draft content is never exposed by a public Creator API.

## Security Baseline

- No secrets in the Creator widget or browser bundle
- Signed server-to-server publishing requests with replay protection
- Least-privilege OAuth scopes and environment-specific secrets
- Server-side content sanitization before publication
- File type, size, and image validation
- Rate limiting on publishing and preview endpoints
- Audit records for decisions and publication attempts
