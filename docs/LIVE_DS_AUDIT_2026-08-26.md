# Live Creator DS Audit

Date: 2026-08-26

Source:

- Export: `/Users/piyushtyagi/Downloads/GeneDrift_Editorial_Platform-4.ds`
- SHA-256: `c4267f2e6bb9a5c56f550bed052477ee6b3c744c75b1c6bb09a7b191a34ee5df`
- Size: 6,669 lines, 169,198 bytes

## Decision

The Creator-local editorial prototype is functional, but this export is not yet
the least-privilege production baseline. Do not begin the Catalyst/public
publishing boundary until the critical function drift and profile isolation
items below are corrected and negatively tested.

## Verified From Live Evidence

- Admin, Author, Reviewer, shared queue, Regulated Review, and the combined
  Reviewer+Publisher workflow paths passed their recorded Creator tests.
- Creator accepted direct Built-in Email sends to Gmail and the custom-domain
  address. Gmail received the message in Spam from the Creator trial sender.
- Submission notification handoffs were recorded for one and two recipients.
- The date-field schedule automatically published `hew one with regulated` at
  18:53 Asia/Kolkata.
- `Publication_Jobs` shows both Schedule and Publish as Succeeded with one attempt.
- The article is Published and its Scheduled At and Last Published At values are
  both `25-Aug-2026 18:53:00`.

The final `Article_Revisions` row for this scheduled run has not been visually
verified. Do not mark the complete scheduling integrity matrix finished until
Revision 1 is confirmed as Published and matches the job and article pointers.

## Healthy Structure

- All expected 17 forms and 17 reports are present.
- The article, immutable-revision, review-assignment, media, publication-job,
  redirect, settings, and audit entities remain separated correctly.
- `Publication_Jobs.Idempotency_Key` is unique.
- The active scheduler is the date-field workflow on
  `Articles.Scheduled_At`, limited to Scheduled articles.
- The older daily batch workflow is inactive and is only a redundant artifact.
- Notification delivery failures are caught and can be written as
  `Notification Failed` audit events.
- The workspace remains the correct primary user interface for workflow actions.

## Critical Function Drift

The export still contains older ungrouped Deluge criteria. Re-save the current
repository versions of these functions before any role-isolation sign-off:

1. `claim_review_assignment`
2. `record_review_decision`
3. `publish_approved_article`
4. `schedule_approved_article`

The live publish and schedule role checks do not group Publisher and Editorial
Admin together with the selected employee and Active conditions. The same
precedence problem exists in open-job and claimable-assignment queries. At scale,
this can authorize the wrong user or select an unrelated open record.

The live export also lacks the current notification calls from claim, review
decision, and immediate publish. Submission, scheduling, and scheduled publish
do call the helper. Re-saving the four current functions restores the intended
handoffs.

After saving, run negative tests:

- Author-only cannot claim, decide, publish, or schedule.
- Reviewer-only cannot publish or schedule.
- Publisher-only cannot claim or decide.
- Publisher and Editorial Admin can publish/schedule only Approved work.
- A second publish/schedule request does not create a duplicate open job.

## Permission Profile Findings

- `Editorial Author` and `Editorial Reviewer` exist, but both are substantially
  broader than least privilege.
- No dedicated `Publisher` permission profile exists.
- No dedicated `Editorial Admin` permission profile exists.
- No Creator application role named `Publisher` exists.
- No Creator application role named `Editorial Admin` exists.
- Author and Reviewer profiles expose raw forms and administrative data modules.
- Author has broad create/edit/delete rights across review, publishing,
  configuration, roles, taxonomy, settings, and audit records.
- Reviewer can create or directly access content, review, role, publication-job,
  and audit modules beyond the intended Custom API boundary.
- Both profiles declare PII and ePHI access. ePHI should be disabled unless a
  separately documented requirement exists; PII should be limited to the
  employee fields actually required by the workflow.

Create and verify the four profiles and four Creator roles in
`creator/PERMISSION_SHARING_SETUP.md`. Do not assign the generic Read or Write
profiles to production editorial users.

## Data Sharing Findings

The current export corrects the older `Review_Comments_RA` problem: it now points
to `Review_Comments` with Reviewer to Editorial Author Read access. Reviewer to
Author read bridges for assignments and audit events are also present.

Remaining concerns:

- Publisher sharing is absent.
- Non-super-admin Editorial Admin sharing is absent.
- `Article_Revision_rA` grants Reviewer to Editorial Author Read/Write. It keeps
  the current reviewer-created N+1 draft visible, but is too broad as a final
  ownership model. Retain it only as a documented prototype bridge until draft
  creation is moved to an admin/server-owned command.
- Rule names are inconsistent, making audit and maintenance harder.
- Role-to-role sharing is broad; production should eventually derive record
  visibility from article ownership, assignments, and server-owned commands.

## Navigation And Report Cleanup

The live menu exposes internal forms next to their reports. This caused the
observed duplicate entries and makes lifecycle-managed fields directly editable.
Hide raw forms from all normal user menus. Keep them available only to the owner
or a controlled admin maintenance view.

The local production DS now keeps only reports and Article Workspace in the web
menu. Apply the equivalent live navigation cleanup.

Add these missing live report fields:

- `Articles_Report`: Tags, Active Draft Revision ID, Approved Revision ID,
  Published Revision ID, First Published At.
- `Article_Revisions_Report`: Editor Document, Social Media, Canonical URL
  Override, Change Summary, Created By Employee, and the new widget-managed
  Referenced Media UUIDs field required by the scalable Catalyst handoff.
- `Media_Assets_Report`: Width, Height, Checksum, Caption, Credit, Published
  Object Key, and Published URL.
- `Audit_Events_Report`: Event Metadata, visible only to authorized admins.
- `Publication_Jobs_Report`: Started At and Catalyst Publication ID.

The local production DS already carries these read-model fields and now includes
the two additional operations fields above.

## Remove Or Retain

- Remove live `test_email_delivery`; the diagnostic succeeded and should not
  remain callable.
- Remove the inactive generic daily workflow after the date-field workflow has
  completed one more regression test. Keeping it inactive temporarily is safe.
- Retain `process_scheduled_publications` as a manual/backfill safety function,
  not as the normal scheduler.
- Retain the Creator trial sender only for prototype testing. Configure an
  authenticated production sender/domain before client launch.
- Retain Custom APIs as private OAuth2 endpoints. DS export does not include their
  auth and user-scope settings, so verify those settings manually before release.

## Required Order

1. Re-save the four corrected functions and remove `test_email_delivery`.
2. Add missing report fields and hide raw forms from normal navigation.
3. Create and tighten Author, Reviewer, Publisher, and Editorial Admin profiles.
4. Add Publisher/Admin sharing and run the positive and negative role matrix.
5. Confirm the scheduled article's Revision 1 state and published pointer.
6. Export a fresh DS and compare it against this audit.
7. Only then start the Catalyst/public publishing boundary.
