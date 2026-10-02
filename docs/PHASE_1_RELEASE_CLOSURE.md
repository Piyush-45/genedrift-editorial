# GeneDrift Phase 1 — Release Closure Checklist

Last updated: **2026-09-01**

Status: **Core workflow verified; release closure in progress.**

Phase 2, including the wider website revamp, stays out of scope until this
checklist is closed or each remaining item has an explicitly accepted risk.

Latest resume checkpoint: `docs/CURRENT_CHECKPOINT_2026-09-01.md`.

Latest Creator widget artifact:
`genedrift-editor-widget-final-polish-v0.4.5.zip`
(`1210fe55854a2aba1ebffa403c8c87e8a5097ea641e2d17ecbacb0bff0fae8ab`).

## 1. What is already proven

- [x] Author creates, edits, autosaves, reloads, adds media and taxonomy, and
  submits an article.
- [x] Submitted content becomes read-only for the author and reviewer.
- [x] Reviewer claims, comments, approves, or requests changes.
- [x] Changes Requested creates an editable N+1 revision with prior content and
  media retained; repeated revision cycles work.
- [x] Approved content reaches the publisher queue and can be published.
- [x] Immediate publication reaches Catalyst, the public API, and the public
  website.
- [x] A valid scheduled publication stays Scheduled before its due time and
  becomes Published at the intended minute.
- [x] A schedule less than two minutes in the future is rejected safely.
- [x] The scheduled recovery fixes no longer expose a premature Needs retry
  state; the fresh `RETRY-02` article published successfully after deployment.
- [x] Author-only, Reviewer-only, Publisher-only, and Editorial Admin access and
  denial behavior have been checked with separate role configurations.
- [x] Standard Review and the two-distinct-reviewer Regulated Review transition
  have been observed live.
- [x] Public listing visibility and Published filtering have been observed.

## 2. Remaining functional release tests

Run these first, in order. Keep screenshots of the before state, action result,
Creator final state, and public-site result.

### P1 — Retraction / unpublish lifecycle (required)

- [x] Use a disposable published test article.
- [x] Record its title/slug and confirm it opens on the public website.
- [x] Retract it from a Publisher or Editorial Admin account with a reason.
- [x] Confirm Creator moves it to Retracted/Unpublished and removes it from the
  Published panel.
- [x] Confirm it disappears from the public listing/search/filter results.
- [x] Confirm the former public detail route returns the intended gone/not-found
  experience, while Creator history/snapshot evidence remains available.
- [x] Confirm a second Retract attempt cannot create a duplicate action.

Live evidence used `RETRY-02 Scheduled Reconcile — 01 Sep 2026`. Retraction
reason: `testing retraction`. The former public detail page now shows `This
article has been retracted`, the reason, and a link back to current insights.
The article disappeared from the public listing and public search after refresh.
Creator then showed the retracted work in the Retracted articles area with
`Unpublished` status and immutable-publication wording. Opening the unpublished
record showed the retained article and review feedback, without a second
published-state retract action.

P1 is functionally closed. Optional technical evidence left: capture the HTTP
status returned by the former public detail route if the release needs a precise
410/404 assertion rather than visual confirmation.

### P2 — Approval and stale-revision safety (required)

- [x] Create and approve a fresh disposable article.
- [x] Preserve/open an older author tab or older revision context before the
  final approval/publish action.
- [x] Attempt to save or publish from the stale context and confirm it is
  rejected without overwriting the approved revision.
- [x] If the product supports approval revocation or superseding revisions,
  revoke/supersede the approved pointer and confirm the old revision cannot be
  published.
- [x] Confirm no public version is created from a stale or no-longer-approved
  revision.

Suggested article name: `SAFETY-01 Stale Approval Guard — 01 Sep 2026`.

Live evidence used `SAFETY-01 Stale Approval Guard — 01 Sep 2026`. After the
author submitted the article, the existing author editor became read-only: Save
Draft and right-side editing controls were not usable. The article later appeared
as Approved and then Published in the author's dashboard. Approval
revocation/superseding was not available in this observed flow, so the practical
stale-context guard passed at the UI layer. The public article route loaded the
approved/submitted article content, so no stale author edit was served.

### P3 — Duplicate/idempotency recovery (recommended release test)

- [ ] On one controlled approved or scheduled article, repeat the same handoff
  or Reconcile action using the same job.
- [ ] Confirm there is no duplicate cron error, duplicate public version,
  duplicate callback, or second pointer advance.
- [ ] Confirm the UI settles to one truthful final state.

Suggested article name: `IDEMP-01 Duplicate Handoff Guard — 01 Sep 2026`.

### P4 — Fresh Regulated Review confidence run (recommended)

- [ ] Submit one fresh Regulated Review article to the shared queue.
- [ ] Reviewer A approves; article remains In Review.
- [ ] Reviewer A cannot claim/approve the second slot.
- [ ] Reviewer B approves; article becomes Approved exactly once.
- [ ] Confirm the publisher sees one approved article, not duplicate queue rows.

Suggested article name: `REG-01 Two-Reviewer Approval — 01 Sep 2026`.

### P5 — Media-format and validation matrix (required before production claim)

- [ ] Publish fresh JPEG and PNG examples.
- [ ] Verify GIF and WebP behavior if those formats are promised to the client.
- [ ] Check cover and inline placement after reload and after publication.
- [ ] Confirm invalid/oversized media fails with a durable, understandable
  message and does not leave the article stuck in Processing.

## 3. Release evidence and quality gates

- [ ] Fresh Creator DS export audit: export the current live Creator structure,
  record its SHA-256, and compare forms, fields, reports, functions, Custom APIs,
  schedules, roles, sharing, menu visibility, and widget package with the final
  expected setup.
- [ ] Desktop and mobile public-site smoke check.
- [ ] Search, category, tag, pagination, long title, empty result, 404, retracted
  article, slow API, and API failure states.
- [ ] Keyboard navigation, visible focus, contrast, labels, and a Lighthouse run.
- [ ] Verify canonical metadata, robots behavior, structured data, sitemap, and
  RSS.
- [ ] Confirm there are no visible browser-console errors during the demo flow.
- [ ] Rotate any Development secret exposed during testing and verify secrets are
  not present in browser code.
- [ ] Remove or hide embarrassing test content before the client demo.

## 4. 1,800-post scale evidence

- [ ] Catalog-size check with the deterministic 1,800-article fixture: counts,
  page 2/deep pages, search, filters, long titles, sitemap, RSS, detail routes,
  404, and retracted content.
- [ ] Read-only traffic test on an approved non-production target: smoke 1–2
  users, normal 10, busy 25, and optional 50 only after earlier stages pass.
- [ ] Record p50, p95, throughput, error rate, and the slowest route. Initial
  target: under 1% failures and p95 under one second for list/detail reads.
- [ ] Separate workflow-throughput check with 10, then 25, then at most 100
  synthetic jobs; do not send 1,800 publication jobs.
- [ ] Produce a one-page evidence summary stating the tested environment, date,
  catalog size, traffic profile, results, and known limits.

## 5. UX and polish backlog from live testing

These do not invalidate the proven permission or publication behavior unless a
client requirement says otherwise.

### High priority before client demo

- [x] Show the scheduled date and time on every Scheduled article row, for
  example `Scheduled for 01 Sep, 06:04`, instead of only a generic badge.
- [ ] Make review feedback easier to read: clearly distinguish reviewer comment,
  discussion comment, decision summary, decision, reviewer, revision, and time.
  Remove the current impression that the same comment is repeated.
- [x] Make newest relevant updates reliably appear first within each role's
  practical view: author work, reviewer inbox/history, publisher queue, and admin
  oversight.
- [x] Clarify the author handoff after approval. An author should be able to see
  that their article is Approved and waiting for publishing even though it has
  left active author work.
- [x] Clarify `Mine`, `Queue`, and `All`, plus `All work`, `Articles`, `Reviews`,
  and `Publishing`, so users understand why an item appears only after changing
  scope or type filters.
- [ ] Keep important failure/recovery messages visible until dismissed or make
  them available in a durable status/history area; some messages disappear too
  quickly.

### Medium priority polish

- [x] Hide role-inapplicable primary actions such as disabled `New article` for
  Reviewer-only users, rather than showing a disabled control.
- [ ] Remove autosave/media-loading flicker and show a stable progress state while
  an uploaded image is being resolved.
- [x] Make Processing, Scheduled, Needs retry, Reconcile, Published, and
  Retracted states include a short explanation and relevant timestamp.
- [x] Make filtered empty panels explain that data may exist outside the current
  scope/filter instead of looking like the account has no work.
- [x] Show workflow ownership on article rows so users can see who wrote,
  approved, published, scheduled, or retracted an article even when no comments
  were added.
- [ ] Keep category and tag editing/displays consistent across Draft, In Review,
  snapshot, and published views.
- [x] Check long titles and dense dashboard panels at common laptop widths so
  buttons, timestamps, and status labels do not feel crowded.

## 6. Exit rule for Phase 1

Phase 1 can be called release-ready when P1 and P2 pass, no open P0/P1 defect
remains, the fresh DS audit matches the deployed app, accessibility/public-site
smoke checks are acceptable, and measured scale evidence is recorded. P3 and P4
should also be completed for high confidence; any consciously deferred media or
polish item must be written as an accepted limitation before Phase 2 begins.
