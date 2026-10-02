# Editorial Edge-Case Audit

Last updated: 2026-09-01

2026-09-01 amendment: for the current resume state, read
`docs/CURRENT_CHECKPOINT_2026-09-01.md` first. Since this audit began, live
testing has passed the core editor/review/revision flow, separate-role visual UI
matrix, scheduled publication, too-soon schedule rejection, public retraction
behavior, and final dashboard polish. Direct API role-denial evidence, fresh DS
audit, media-format validation, duplicate/idempotency stress, accessibility, and
measured scale checks remain open.

## Release Scope

This audit covers the Creator Article Workspace widget and the Creator functions
used for submission, assignment claiming, comments, and review decisions.

## Guarded in the Widget

- A revision with no editor document opens as a valid empty draft, including
  Creator's resolved `{code: 3730}` missing-file response.
- Creator file responses are accepted as JSON objects, wrapped responses, blobs,
  or text when they contain a valid TipTap document.
- First save and subsequent saves verify both the uploaded document and stored
  metadata before reporting `Saved`.
- Verification retries tolerate short Creator read-after-write delays.
- Autosaves are serialized so a slower save cannot replace a newer local edit.
- Edits made during an active save are rebased onto the verified checksum and
  version token before the next queued save.
- The complete editable revision has a version token, so two tabs changing only
  excerpt, SEO, robots, title, slug, metrics, media, or body are detected as a
  conflict.
- Saving is rejected when the article or revision moved out of an editable state.
- Submission waits for pending saves and removes obsolete local recovery data.
- Recovery is offered only for editable drafts, synchronizes the editor canvas,
  and reports damaged recovery data without replacing the current draft.
- Title, slug, excerpt, SEO fields, and robots values use the same canonical
  boundary normalization before saving and verification, preventing Creator's
  whitespace normalization from producing false save failures after recovery.
- Failed review comments remain in the dialog instead of being silently cleared.
- Image creation and metadata updates are read back with consistency retries.
- Draft edit, recovery, save, and submit controls require the current employee
  to be the owner, primary author, CEO, or Editorial Admin.
- Review History routes with both article and revision IDs so a closed review
  opens its immutable reviewed snapshot rather than a later working draft.
- Unauthorized users cannot open a working Draft through an article-only or
  explicit Draft-revision workspace URL.
- Closed assignments do not expose a stale Review action while a different
  reviewer remains pending.

## Guarded in Creator Functions

- Current Creator identity must map to an active editorial employee.
- Submit is restricted to the owner, primary author, or Editorial Admin.
- Only Draft or Changes Requested articles with a Draft active revision submit.
- Reviewer IDs must be active, eligible, distinct, and different from the primary
  author.
- A revision cannot be submitted twice with active assignments.
- Only active reviewers may claim an open assignment.
- Assigned work cannot be claimed by another reviewer.
- A reviewer cannot participate through two assignments for the same revision.
- Comments require access to the assignment and an open review state.
- Parent comments must belong to the same assignment and revision.
- Decision reasons are mandatory for Changes Requested and Rejected outcomes.
- Comment and decision text have server-side length limits.
- Distinct reviewer approvals are counted against the selected approval policy.
- Terminal outcomes cancel remaining open assignments and create audit events.

## Production Boundaries

The following cannot be guaranteed by browser checks alone:

1. Atomic revision save

   Creator file upload and revision metadata update are separate operations. The
   widget detects stale state and refuses false success, but two simultaneous tabs
   can still overlap between those operations. Production should expose one
   server-owned save command with a version or lock token.

2. Atomic shared-queue claim

   The Deluge function re-reads immediately before mutation, which reduces the
   race window. Final production should use a Blueprint transition or another
   server-side compare-and-set boundary if Creator cannot guarantee atomic claim.

3. Changes Requested revision cycle

   A submitted revision must remain immutable. Changes Requested must create
   revision N+1 by cloning the reviewed revision, then point
   `Active_Draft_Revision_ID` at the new Draft. The live Creator test confirmed
   Revision 1 stayed Submitted while Revision 2 was created as Draft. It must
   not turn revision N back into a draft.

4. File security

   Browser MIME and size checks improve usability but are not security controls.
   The Catalyst worker now enforces supported raster magic bytes, exact size,
   SHA-256 checksum, dimensions, and content-addressed Stratus keys before
   publication. Production launch still requires a selected malware-scanning
   service or a documented risk acceptance; no malware engine is bundled in the
   current AppSail implementation.

5. Authorization and visibility

   Creator report permissions and Custom API scope must be tested with separate
   real Author, Reviewer, Publisher, and Admin logins. Seed records alone do not
   prove role isolation.

## Structured Live Test

Use a new article for this release. Do not reuse a submitted revision.

Status: steps 1 through 15 have passed across release articles and the latest
verified Creator-local publishing boundary. The next live verification items are
role-isolated permission/profile cleanup, notification handoffs, and scheduling.

1. [Passed] Open the empty revision and save body, excerpt, SEO, cover, and inline image.
2. [Passed] Reload and confirm every field and image is retained.
3. [Passed] Open the same draft in two tabs. Save a metadata change in tab A, then try to
   save a different change in tab B. Tab B must show a conflict and not `Saved`.
4. [Passed] Begin typing, reload before autosave completes, and verify the recovery prompt.
5. [Passed] Restore recovery and confirm the editor canvas and inspector both update.
6. [Passed] Submit to one suggested reviewer and confirm Article `In Review`, Revision
   `Submitted`, one assignment, one audit event, and read-only editor controls.
7. [Passed] Confirm Creator data-sharing and permissions allow the real Harsh
   reviewer to see assigned review records.
8. [Passed] Claim with the assigned reviewer, add a comment, and record a live
   decision.
9. [Passed] Record Changes Requested with a reason and confirm assignment,
   decision, article state, and immutable submitted Revision 1.
10. [Passed] Install and verify the N+1 revision operation: Revision 2 is
    created as Draft, clones reviewed content, and becomes the active draft for
    resubmission.
11. [Passed] Edit, save, resubmit, and approve Revision 2.
12. [Passed] Upload the dashboard package and verify Article Workspace opens to
    reviewer inbox/history when no `articleId` is provided; row navigation and
    compact New Article also passed.
13. [Passed] Test Regulated Review with two distinct reviewers.
14. [Passed] Test shared queue claim with an unassigned queue assignment.
15. [Passed] Verify reviewer draft isolation after Changes Requested: closed
    review history opens the submitted snapshot read-only, and the reviewer
    cannot open the author's N+1 Draft through article-only or explicit
    Draft-revision workspace URLs.
16. [Passed visually / API evidence pending] Verify least-privilege Creator
    profiles and Data Sharing with separate Author-only, Reviewer-only,
    Publisher-only, and non-super-admin Editorial Admin users.
17. [Passed for Creator handoff] Notification sends were accepted for live
    submissions and direct Gmail delivery reached Spam. Production delivery logs
    and domain authentication remain outside this Creator transition test.
18. [Superseded prototype test] The first Creator-local timed schedule ran, but
    its final revision/pointer and second-article checks were not completed. The
    production Catalyst path replaces the local executor.
19. [Pending] Freshly verify Creator cleanup from a new DS export. The
    separate-role visual UI matrix has passed, but direct API/security evidence
    remains part of the fresh audit.
20. [Partially passed] Deploy and verify the Catalyst immediate/scheduled/
    duplicate/revoked-approval/retry/stale-pointer/callback-outage/
    callback-replay matrix. Immediate, normal scheduled, too-soon rejection, and
    public retraction behavior have passed live functional checks; forced
    duplicate/idempotency, stale-pointer/revoked approval, callback outage/replay,
    and media-format checks remain open.
