# GeneDrift Current Checkpoint - 2026-09-03

Status: **Phase 1 article workflow platform is completed and shared for client
testing. Full public website frontend build is pending client design approval
and final workflow feedback.**

Use this as the first file to read when resuming in a new chat.

## Current client-facing plan

- Phase 1: Article Workflow Platform - **completed and with client for testing**.
- Phase 2: Website design confirmation - **pending client green light**.
- Phase 3: Final website frontend build - **estimated 3-5 days after design and
  workflow approval**.
- Phase 4: Client-system migration and deployment - **estimated around 2 days
  after frontend/workflow approval**.

Current staging links:

- Blog / Insights: `https://genedrift.site/insights`
- Design references: `https://genedrift.site/designs`

`genedrift.site` is being used as a realistic demonstration domain until the
official client-owned production setup is ready.

## Product summary

GeneDrift now has a controlled editorial publishing platform for Insights/blog
content. Zoho Creator owns the editorial app, roles, forms, article workspace,
review assignments, dashboards, media metadata, and workflow records. Zoho
Catalyst owns the signed publishing boundary, immutable public content/media,
public index, and callbacks. Vercel/Next.js serves the public Insights listing
and article reading pages from the public delivery API, not directly from
Creator records.

## What is completed for Phase 1 testing

- Article creation and editing.
- Rich text article workspace.
- Excerpt, category, tags, SEO title, SEO description, slug, robots directive,
  word count, reading time, cover image, and inline image handling.
- Autosave, manual save, local recovery, stale-tab protection, and save
  verification.
- Reviewer assignment through suggested reviewers or shared queue.
- Reviewer claim, discussion comments, decision notes, approve, reject, and
  request-changes flow.
- Changes Requested creates a new editable draft while preserving the reviewed
  submitted snapshot.
- Standard Review and Regulated Review behavior.
- Author, Reviewer, Publisher, Editorial Admin/CEO style workflow visibility.
- Mine, Queue, and All dashboard scopes.
- Dashboard search plus state/category/person/date/sort filters.
- Approved article visibility for authors, with publish controls reserved for
  publisher/admin users.
- Publishing, scheduling, retraction, and reconciliation controls for permitted
  users.
- Workflow email notification handoffs for relevant user updates.
- Public Insights listing and public article detail pages.
- Curated design-reference route at `/designs`.

## Latest widget/testing changes on 2026-09-03

Latest widget package:

- `genedrift-editor-widget-dashboard-ux-v0.4.8.zip`
- SHA-256:
  `684e9b57d32688b99b5b25ae56a8039ef899b0b5ca7cdfb145b4541996250020`

Recent widget improvements:

- Dashboard reduced to a cleaner command row: Mine / Queue / All, search,
  refresh, and `Filters`.
- Filters include state, category, person, date, and sort.
- Panels cap at five rows before `View all`, avoiding nested scrollbars.
- Rows use clearer attribution and avoid title/person truncation.
- Retract is moved behind overflow and still requires confirmation.
- Workspace header now shows article title, state chip, and revision chip.
- Primary action is role/state-based: Submit, Resubmit, Review, or Publish.
- Reviewer feedback separates **Decision note** from **Discussion comments**.
- Duplicate decision/comment rendering is handled on the render side only; old
  `Review_Comments` records are not rewritten or deleted.
- Selected tags now have a clear sidebar summary.
- Submit/resubmit preserves the latest in-widget category/tag state.

Known tag behavior:

- Professional blog platforms usually support quick-create tags from the editor,
  but governed taxonomy should not be uncontrolled. The current safe model is:
  add/manage tags in Taxonomy, then select them in the article sidebar.
- If selected tags still disappear after the v0.4.8 widget is uploaded and a
  fresh save/submit/review cycle is tested, inspect Creator `Articles.Tags`
  persistence/readback rather than assuming expected workflow behavior.

## Current client access state

Client testing account supplied by Ashish:

- `am5333966@gmail.com`

Access approach:

- Add the user to the Creator application with write access for testing.
- Ensure the app's internal employee/role records also map the login to the
  correct editorial testing role; the widget depends on internal employee and
  editorial role assignments, not only Creator app access.

## Website/frontend plan

The current homepage is a placeholder. The actual public website build starts
after the client confirms design direction/templates and Phase 1 workflow
testing receives a green light.

After that:

1. Prepare page-wise design/content requirements if needed.
2. Build the complete website frontend in Next.js according to the sitemap.
3. Connect public pages to Zoho Creator/Catalyst delivery boundaries where
   content-driven behavior is required.
4. Review and polish all pages.
5. Deploy the complete website to `genedrift.site` in approximately 3-5 days
   after approval.
6. Move into the final client-system migration/handover phase.

## Remaining important work

Before production/client-system handover:

1. Capture client feedback from Phase 1 testing.
2. Apply any requested workflow/role/dashboard/blog changes.
3. Complete final media publishing validation, especially cover + inline image
   through the full Creator -> Catalyst -> Creator callback path.
4. Replay/reconcile any stuck publication job still needed for evidence.
5. Make retracted public frontend pages return strict HTTP 410 where required.
6. Remove unsafe production fallback in `frontend/lib/api.ts`; production should
   not silently fall back to the Development Catalyst backend.
7. Connect Vercel to Git or establish another proper Git-backed release history.
8. Commit current work; many files and generated packages remain uncommitted.
9. Update/migrate to client-owned Creator, Catalyst, Vercel, DNS, OAuth, secrets,
   employees, roles, schedules, and permissions during final handover.

## Safe-copy state

A local safe archive was created earlier:

- `work_artifacts/safe_copies/genedrift-safe-copy-2026-09-02-current.tar.gz`
- SHA-256:
  `7c68ff026473ee1d8714af0e022f0521300f7388c395d0eaa44e3528646ab8d4`

This is useful as rollback insurance, but it is not a substitute for Git
commits and a remote repository.

## Best resume order

1. `docs/CURRENT_CHECKPOINT_2026-09-03.md`
2. `docs/HANDOFF.md`
3. `docs/STATUS.md`
4. `docs/PHASE_1_RELEASE_CLOSURE.md`
5. `docs/MANUAL_VERIFICATION_2026-08-30.md`
6. `docs/CREATOR_ACCOUNT_MIGRATION_RUNBOOK.md`
7. `docs/VERCEL_HOSTING_AND_CLIENT_MIGRATION_GUIDE.md`
8. `docs/PHASE_2_WEBSITE_REVAMP_CLIENT_BASELINE.md`
9. `docs/WEBSITE_CONTENT_ARCHITECTURE_PLAN.md`

## End goal

The end goal is a client-owned GeneDrift website and editorial publishing
system where non-technical staff can safely create, review, approve, publish,
retract, and manage public content through controlled workflows while the public
website serves premium content without exposing private Creator systems.
