# GeneDrift Product Checkpoint — 2026-08-29

Status: Development is functional but **not fully verified or production-ready**.
Do not mark the integration verified until the complete Development matrix, a
fresh Creator DS export, and the negative role tests pass.

## 1. Built and working

### Editorial workspace

- Structured TipTap article editor with autosave, manual save, recovery, stale
  tab/conflict protection, and verified reload persistence.
- Article metadata and SEO fields, word/reading-time metrics, cover and inline
  images, media metadata, and normalized per-revision media references.
- Draft initialization, immutable review revisions, and the N+1 revision loop
  after Changes Requested.

### Review and permissions

- Suggested-reviewer and shared-queue submission, reviewer claim, comments,
  approval, rejection, and Changes Requested paths.
- Standard one-reviewer and Regulated two-reviewer approval policies.
- Self-review prevention, separate Publisher authority, and guarded Creator
  Custom APIs for lifecycle mutations.
- Role-aware dashboard with Mine, Queue, and permission-gated All views.
- Editorial audit events and best-effort notification handoffs for submission,
  claim, decisions, changes requested, ready-to-publish, scheduled, and published
  transitions.

### Dashboard experience

- State, category, sort, scope, and text filters with clear/reset and refresh.
- Clickable summary metrics, accurate result counts, independent scrolling in
  busy panels, two-line long titles, responsive layout, and grouped actions.
- Publishing controls are hidden from users without Publisher or Editorial
  Admin authority.
- The redesigned package is built and locally checked; it still needs upload to
  Creator and live role-by-role confirmation.

### Catalyst publication boundary

- Signed, replay-protected and idempotent Creator handoffs.
- Immutable approved snapshots, public content-addressed article JSON/media,
  immutable publication versions, and a versioned current pointer.
- Leased workers, bounded retries, execution-time Creator preflight, deterministic
  one-time schedules, and an independent signed callback outbox.
- Immediate no-media publication passed end to end in Development.
- AppSail `0.1.5` fixed offset-aware scheduled leasing. A fresh 09:35 IST
  scheduled job succeeded once with HTTP 200; the remaining Catalyst and Creator
  rows must still be captured for the evidence packet.

## 2. Tests to run next

Run these in order and keep screenshots/row exports with article, revision,
request, publication, pointer, callback, and Creator job IDs.

1. **Upload the current dashboard ZIP** and test Mine/Queue/All, search, every
   filter, metric shortcuts, Clear filters, Refresh, panel scrolling, long titles,
   and narrow-screen layout.
2. **Finish scheduled-publication evidence** for the 09:35 IST success: capture
   `GD_Publication_Requests`, `GD_Publication_Attempts`,
   `GD_Published_Versions`, `GD_Published_Pointers`, `GD_Callback_Outbox`, the
   public JSON response, and Creator's Published audit event.
3. **Complete the Catalyst Development matrix:** a second independent schedule,
   duplicate handoff and worker delivery, transient retry, revoked approval,
   stale-revision race, callback outage/recovery, callback replay, and Creator
   state change after preflight.
4. **Complete media tests:** JPEG, PNG, GIF and WebP; checksum/signature/size/
   dimension rejection; duplicate-media reuse; and proof that only media
   referenced by the approved revision is handed off.
5. **Run negative role tests using separate accounts:** Author-only,
   Reviewer-only, Publisher-only, and non-super-admin Editorial Admin. Include
   self-review, opening another author's draft, review without assignment,
   publishing without permission, and direct API attempts.
6. **Export a fresh cleaned Creator DS**, record its SHA-256, and audit functions,
   reports, fields, profiles, sharing, and menu exposure against the repository.

Only after all six groups pass should Development be marked verified or promoted.

## 3. Public blog/frontend checkpoint

The browser does not query Creator or Catalyst Data Store directly. AppSail
`0.3.1` is deployed in Development and live verified for listing, search,
filtering, pagination, taxonomy, slug resolution, ETag/304, and HTTP 410 for a
retracted slug. The read-only endpoints include:

- `GET /v1/public/articles` with cursor, category, tag, search, and sort inputs;
- `GET /v1/public/articles/:slug` for the current published version; and
- optional `GET /v1/public/taxonomy` for navigation/filter counts.

The server resolves `GD_Published_Pointers`, loads immutable Stratus documents,
and returns only records whose serving state is Published. This first version
scans current pointers and objects; build a maintained compact public index before
claiming or benchmarking a large Catalyst catalog such as 1,800 posts.

Follow-up on 2026-08-30: that compact index is implemented locally in AppSail
`0.4.0`, with automatic publish/retract maintenance, authoritative pointer checks
for detail, and an authenticated rebuild route. The deployed Development service
is still `0.3.1`; provision/rebuild/deploy and live evidence remain required.

Before author and taxonomy pages, extend the published snapshot/index with an
author display snapshot and stable category/tag slugs. Do not expose OAuth,
Creator, Data Store, HMAC, or administrative credentials to the browser.

### Next.js frontend

The first public frontend is implemented in `frontend/` and passes strict
typecheck and the optimized production build. It includes:

- `/insights` — paginated article listing with search and filters;
- `/insights/[slug]` — article body, metadata, media, related content and sharing;
- `/category/[slug]`, `/tag/[slug]`, and `/author/[slug]`;
- `/search`, `/rss.xml`, and sitemap routes.

It fetches through the read API, renders server-generated article HTML, and
provides canonical metadata, robots, Open Graph, structured data, 404/retraction,
empty, loading, and service-error states. Article detail bypasses the frontend
data cache; list data revalidates every 15 seconds. Remaining work is Vercel
Preview deployment, site/API origin configuration, browser/accessibility/SEO/
performance checks, final branding, analytics/consent, and strict host-level 410
verification if required.

## 4. Retraction positive path is live; full matrix remains

AppSail `0.2.1`, the Creator functions/callback, and the dashboard implement the
retraction control plane. A live positive case completed in one attempt with HTTP
200: the dashboard moved the article to Retracted Articles, Creator recorded the
Unpublished state, and Catalyst advanced its pointer to version 2 with
`Serving_Status = Retracted` while retaining immutable history.

Lifecycle contract:

1. A Publisher or Editorial Admin supplies a required reason and optional
   replacement URL, then Creator sends a signed, idempotent `retract` job.
2. Catalyst revalidates authority and the current publication pointer. It never
   deletes the immutable snapshot, version, article JSON, or media.
3. The mutable serving record becomes `Retracted` with actor, time, reason, event
   ID, and previous publication ID. The public read API removes it from listings
   and returns HTTP 410, or a configured redirect, for the old slug.
4. The signed callback moves Creator from Published to an explicit
   Unpublished/Retracted state and records one audit event. Archive remains a
   separate editorial organization action.
5. Republish creates a new audited immutable publication and advances the pointer;
   it does not silently erase the retraction history.

The public API now removes retracted content from listings and returns uncached
HTTP 410 for its old slug. Remaining work is the matching Creator audit capture,
negative role/idempotency/replay evidence, republish testing, optional redirects,
and host-level frontend 410 verification. Direct immutable Stratus objects are
retained by design and are not the public route contract.

## 5. Definition of the next checkpoint

The next checkpoint is reached when all Development promotion and role tests
pass, the fresh DS is audited, and the scheduled/retraction evidence packets are
complete. Then deploy and verify the existing public frontend before Production
promotion.
