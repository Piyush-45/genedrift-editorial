# GeneDrift Pre-Client Demo and Scale Test Plan

Status: Phase 1 is functionally strong after 2026-09-01 live testing, but do
**not** call the integration fully release-ready until the fresh Creator DS
export audit, duplicate/idempotency stress evidence, media-format validation,
accessibility/public-site checks, and measured scale evidence pass.

Latest resume checkpoint: `docs/CURRENT_CHECKPOINT_2026-09-01.md`.

## 1. Must-pass product checks

Run these in order and keep one screenshot or row export for each group.

- [x] **Editorial flow:** create, edit, autosave, reload, submit, claim, comment,
  request changes, create revision N+1, resubmit, and approve.
- [x] **Review rules:** Standard and Regulated Review pass; self-review and a
  second decision by the same reviewer are blocked.
- [x] **Immediate publish:** one click becomes Processing, duplicate clicks are
  blocked, the job succeeds, and the public article appears.
- [x] **Scheduled publish:** run fresh future schedules; publication occurs at
  the intended time and creates one visible final published state. Duplicate
  schedule/reconcile stress remains separate below.
- [x] **Retraction:** a published article disappears from listings/search,
  Creator moves it to Retracted/Unpublished, immutable history remains, and the
  former public detail route shows the retraction page. Capture HTTP status if
  strict 410 evidence is required.
- [ ] **Failure recovery:** duplicate handoff, transient retry, callback outage
  and replay, revoked approval, stale revision, and pointer contention do not
  create duplicate public versions.
- [ ] **Media:** JPEG, PNG, GIF, and WebP publish correctly; invalid size,
  checksum, signature, and dimensions are rejected.
- [x] **Role isolation:** separate Author-only, Reviewer-only, Publisher-only,
  and Editorial Admin visual UI behavior passed. Direct API attempts are still a
  fresh DS/security-audit follow-up.
- [ ] **Fresh Creator audit:** export the current DS, record its SHA-256, and
  verify fields, reports, functions, roles, sharing, and menu visibility.
- [ ] **Security:** rotate the Development internal secret exposed during live
  testing, confirm no secret is in browser code, and use separate Preview and
  Production environment values.

## 2. Frontend and demo checks

- [ ] Vercel Preview opens the homepage, archive, article, category/tag filters,
  search, pagination, sitemap, and RSS with the real Development API.
- [ ] Test desktop and mobile, long titles, slow network, empty results, 404,
  API failure, and retracted-article states.
- [ ] Check canonical metadata, robots/noindex behavior, structured data,
  keyboard navigation, contrast, and basic Lighthouse results.
- [ ] Confirm refresh/live updates settle Processing states without duplicate
  actions and without visible console errors.
- [ ] Remove embarrassing test content and rehearse a 10–15 minute client demo
  with two polished articles plus one backup article.

## 3. How to prove 1,800-post scale honestly

Use three separate tests. Do not describe 1,800 stored posts as 1,800 concurrent
users; they prove different things.

### A. Catalog-size test

Generate 1,800 synthetic published articles with varied titles, dates,
categories, tags, lengths, and media presence. Verify total counts, pagination,
search, filters, sitemap generation, long titles, and deep pages. This proves the
product can browse a catalog of that size.

The frontend can first use a local 1,800-item fixture. That demonstrates UI
behavior, not backend capacity. Before seeding 1,800 records into Catalyst, add a
maintained public index so list/search requests query compact rows and article
detail fetches only one immutable JSON object. The current read path scans all
pointers and loads all article objects, so it is not yet a fair large-catalog
architecture.

### B. Read-only traffic test

Use **k6** against a dedicated Development or Vercel Preview environment:

1. Smoke: 1–2 virtual users for 1 minute.
2. Normal: 10 virtual users for 5 minutes.
3. Busy: 25 virtual users for 5 minutes.
4. Optional stress: briefly ramp to 50 only after normal tests pass and usage
   limits are monitored.

Exercise article list, page 2+, search, category filter, article detail, 404, and
retracted API routes. Suggested first thresholds: less than 1% request failures,
p95 under 1 second for list/detail, correct 404/410 responses, and no incorrect or
duplicate content. Record p50, p95, throughput, error rate, and the slowest route.

### C. Workflow-throughput test

Publishing is a write-heavy orchestration path, not a website page-load test.
Start with 10, then 25, then at most 100 controlled synthetic publication jobs.
Measure acceptance time, completion time, retries, duplicates, callback delivery,
and final pointer correctness. Do not send 1,800 Creator/Catalyst publish jobs
merely for a demo; it adds cost, cleanup work, and rate-limit risk without proving
normal client usage.

## 4. Client-ready evidence

Present a one-page result instead of a wall of logs:

- catalog tested: 1,800 synthetic posts;
- traffic profile and duration;
- p50 and p95 response time, throughput, and error rate;
- publish/schedule/retract success counts;
- screenshots of pagination, search/filter, and retraction;
- known limits and the tested environment/date.

Run load tests only against an approved non-production target using synthetic
data, a cleanup plan, request limits, and cost monitoring. Never stress Creator,
Catalyst Production, Vercel Production, or a client account without explicit
authorization.

## 5. Current engineering checkpoint

The maintained public index, deterministic 1,800-article generator, matching
fixture API, read-only k6 suite, and performance-report template are implemented
locally. `GD_Public_Index` and AppSail public-read work reached the v0.4 line,
and the latest AppSail ZIP present is
`genedrift-catalyst-appsail-dev-v0.4.2.zip`
(`1834f1924a953c21919d242e79f1d0bdaf847bd3abe35415697dd829afc9c3ff`).

The 1,800-post proof still needs measured runs on an approved non-production
target. Do not convert local fixture success into a Catalyst or Vercel scale
claim, and do not send 1,800 publish jobs. Catalog browsing scale, read traffic,
and workflow throughput must remain separate tests.
