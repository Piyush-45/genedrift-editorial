# GeneDrift Current Checkpoint - 2026-09-02

Superseded by: `docs/CURRENT_CHECKPOINT_2026-09-03.md`.

Status: **Client testing package is live and shareable. Phase 1 Insights/blog is
functionally strong, but final production release evidence and client-system
migration are still open.**

Use this file as the first read for a new developer, future chat, or client
handoff. It summarizes what has been built, how the architecture works, what is
complete, and what remains.

## Product in one paragraph

GeneDrift now has an editorial publishing platform for regulated Insights/blog
content. Authorized users work in Zoho Creator to draft, review, approve,
schedule, publish, and retract articles. Zoho Catalyst validates approved
content, stores immutable public versions and media, and returns signed results
to Creator. The public website is a Next.js frontend on Vercel that reads
published content from the delivery layer, not directly from Creator.

## Live client testing links

- Public Insights/blog testing: `https://genedrift.site/insights`
- Design-reference redirect: `https://genedrift.site/designs`
- Current homepage: temporary placeholder; do not treat it as the final website
  design reference.
- Current Vercel project: `genedrift-vercel-preview-0.4`
- Latest Vercel production deployment: `dpl_E3k6DnsSo48ZWLAWMF2m4VEMgvzD`
- Vercel project is still not connected to Git; deployments are currently direct
  CLI deployments to the existing project.

## What has been built

### Creator editorial workspace

- Article dashboard with role-aware views.
- Mine, Queue, and All scopes for personal work, shared actionable work, and
  admin/team supervision.
- Article Workspace for writing, metadata, media, SEO, preview, save, submit,
  review, publish, schedule, reconcile, and retract actions.
- Structured Creator data model for articles, revisions, media, categories, tags,
  employees, role assignments, approval policies, review assignments/comments,
  publication jobs, published versions, audit events, redirects, and settings.
- Role model for Author, Reviewer, Publisher, and Editorial Admin. Users may hold
  multiple roles, but permissions remain separately checked.
- Email notifications for relevant workflow events: reviewer assignment/submission,
  review claim/decision, publisher-ready work, scheduling, publication, retraction,
  failure, and reconciliation outcomes.

### Review and workflow system

- Draft autosave and reload.
- Submitted revisions become read-only.
- Standard Review: one independent approval.
- Regulated Review: two distinct reviewer approvals.
- Self-review prevention.
- Claimable shared review queue.
- Request Changes creates a new editable draft revision while preserving the
  reviewed submitted snapshot.
- Reject, approve, requested changes, scheduled, processing, published, and
  retracted states are represented in the dashboard and audit trail.

### Catalyst publishing backend

- Signed Creator-to-Catalyst publishing handoff.
- Idempotent publication jobs.
- Immediate and scheduled publication path.
- Execution-time Creator preflight before publishing.
- Immutable published versions and media handling.
- Callback/outbox path back to Creator.
- Retraction path that removes content from public listings while preserving
  history.
- Retry/reconcile mechanisms for publication jobs.

### Public website

- Next.js frontend hosted on Vercel.
- Public Insights listing page.
- Public article detail reading page.
- Richer modern layout for archive and detail pages.
- Search/filter/category-style public discovery.
- Public retraction experience.
- `genedrift.site/designs` redirect to curated design references for client
  review.

### Client-facing documentation

- Client walkthrough PDF/DOCX created under `deliverables/`.
- Walkthrough explains Creator structure, forms, workflows, review types,
  Standard/Regulated article journeys, Mine/Queue/All filtering, publishing
  controls, dashboard areas, and email notification behavior.

## Architecture map

1. Authors, reviewers, publishers, and admins work in Zoho Creator.
2. Creator stores editorial data, draft revisions, workflow state, assignments,
   comments, role assignments, and audit history.
3. A Publisher/Admin publish or schedule action sends a signed request to Catalyst.
4. Catalyst validates authority, approved revision, checksum, media, and job state.
5. Catalyst stores immutable public content/media and advances the current public
   pointer only when safe.
6. Catalyst sends a signed callback to Creator so Creator reflects the final
   publication result.
7. Next.js on Vercel renders public pages from the published delivery boundary,
   not from private Creator records.

Main architecture references:

- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/WORKFLOW.md`
- `docs/DECISIONS.md`
- `docs/CREATOR_CATALYST_INTEGRATION_CHECKLIST.md`
- `docs/VERCEL_HOSTING_AND_CLIENT_MIGRATION_GUIDE.md`
- `docs/WEBSITE_CONTENT_ARCHITECTURE_PLAN.md`

## How to build or change features

- Frontend/public website work lives in `frontend/`.
  - Use Next.js, TypeScript, and Tailwind CSS.
  - Keep public traffic away from private Creator APIs.
  - For final website work, read
    `docs/PHASE_2_WEBSITE_REVAMP_CLIENT_BASELINE.md` first.
- Creator app/workflow work lives in `creator/`.
  - Keep workflow decisions auditable.
  - Preserve submitted, approved, and published revision immutability.
  - Align employee/login/role mapping with the client's real Creator setup during
    migration.
- Catalyst backend work lives in `catalyst/`.
  - Preserve signed requests, idempotency, execution-time preflight, immutable
    versioning, and callback/outbox behavior.
  - Do not put secrets into the Creator widget or public frontend.
- Editor widget work lives in `editor-widget/`.
  - Preserve autosave, media hydration, role-based actions, and state-aware
    read-only behavior.

## Completed enough for client testing

- Client can test the public blog/archive/detail experience at
  `https://genedrift.site/insights`.
- Client can review curated design direction at `https://genedrift.site/designs`.
- The current walkthrough explains the platform flow and role model.
- The core editorial workflow has been implemented and exercised across author,
  reviewer, publisher, and admin-style paths.

## Remaining before production/client transfer

1. Client feedback pass.
   - Confirm workflow, role labels, review rules, publishing permissions, email
     notification expectations, and public content/design preferences.
2. Real client-system mapping.
   - Map their employee/team master, email/login fields, departments, job codes,
     and active/inactive status into Employees and Role Assignments.
3. Fresh Creator DS export audit.
   - Export current Creator app and compare forms, fields, reports, functions,
     roles, permissions, schedules, sharing, and widget package.
4. Release evidence closure.
   - Repeat duplicate/idempotency stress check, fresh regulated-review run,
     media-format matrix, accessibility/public-site smoke, and 1,800-post
     read-performance evidence.
5. Production migration.
   - Move infrastructure, credentials, OAuth, Catalyst buckets, Vercel ownership,
     domain settings, and secrets into the client's final accounts.
6. Full website build.
   - Current homepage is not final. After design approval, extend the same
     Creator/Catalyst/Next.js architecture from Insights to the complete
     GeneDrift website.
7. Trial-account migration if the current Creator trial expires before client
   transfer.
   - Use `docs/CREATOR_ACCOUNT_MIGRATION_RUNBOOK.md`.
   - Treat the move as a clean new installation with fresh OAuth, variables,
     role mapping, widget upload, Custom APIs, schedules, and smoke tests.
   - Do not assume DS import carries secrets, OAuth grants, record IDs, file
     URLs, sharing, or all operational settings.

## End goal

The final product should be a client-owned GeneDrift website and editorial
publishing system where non-technical staff can manage approved content safely,
review-sensitive content through controlled workflows, publish only immutable
approved versions, and serve a premium public website without exposing Creator
directly to public traffic.
