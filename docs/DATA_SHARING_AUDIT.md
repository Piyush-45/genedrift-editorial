# Data Sharing Audit

Last checked: 2026-08-26 export; amended 2026-09-01 from live visual testing.

Source reviewed:

- Live export: `/Users/piyushtyagi/Downloads/GeneDrift_Editorial_Platform-4.ds`
- User screenshots of role workflows, reports, jobs, and audit events
- Current widget and Custom API read/write surfaces
- Detailed export audit: `docs/LIVE_DS_AUDIT_2026-08-26.md`

## Current Finding

The Author to Reviewer review loop and combined Reviewer+Publisher path are
functionally working. The live export is not yet least privilege: Author and
Reviewer profiles are broad, Publisher and Editorial Admin profiles/Creator
roles are absent, and Publisher/Admin sharing is incomplete.

2026-09-01 amendment: separate-role visual UI checks later passed for
Author-only, Reviewer-only, Publisher-only, and Editorial Admin configurations.
That does not replace this audit because no fresh post-cleanup DS export has
been captured. Treat the fresh DS export and direct API/security denial checks as
still required before a production-ready claim.

The older suspected `Review_Comments_RA` targeting error is not present in this
export. It now correctly targets `Review_Comments` with Reviewer to Editorial
Author Read access.

## Present And Working

These bridges support the tested Author/Reviewer flow:

- `Articles`: Editorial Author -> Reviewer, Read
- `Article_Revisions`: Editorial Author -> Reviewer, Read
- `Media_Assets`: Editorial Author -> Reviewer, Read
- `Review_Assignments`: Editorial Author -> Reviewer, Read
- `Review_Assignments`: Reviewer -> Editorial Author, Read
- `Review_Comments`: Reviewer -> Editorial Author, Read
- `Audit_Events`: Reviewer -> Editorial Author, Read

Owner/CEO read bridges for employee, role, taxonomy, policy, content, media,
review, and audit data are also present for the prototype Author/Reviewer users.

## Temporary Broad Bridge

`Article_Revision_rA` grants Reviewer -> Editorial Author Read/Write. This keeps
the current reviewer-created Changes Requested N+1 draft visible to its author,
but it is broader than the intended ownership boundary.

Keep it only as a documented prototype rule. The scalable replacement is a
server/admin-owned N+1 draft operation followed by explicit author ownership or
record-specific visibility.

## Missing Before Client Testing

1. Create dedicated Creator roles and permission profiles for Editorial Author,
   Reviewer, Publisher, and Editorial Admin.
2. Add Publisher read sharing for approved content, revisions, media, review
   context, audit events, and publication jobs.
3. Add non-super-admin Editorial Admin supervision sharing from Author,
   Reviewer, and Publisher records.
4. Reduce Author and Reviewer profiles to the matrix in
   `creator/PERMISSION_SHARING_SETUP.md`.
5. Disable ePHI access unless a documented field-level requirement exists and
   minimize PII access to the employee data required by the workflow.
6. Hide raw forms from normal navigation and route lifecycle changes through the
   Article Workspace and private Custom APIs.

## Verification Matrix

Use separate real Creator users; employee seed rows do not prove isolation.

1. Author-only can create, save, submit, and respond to Changes Requested.
2. Author-only cannot claim, decide, publish, schedule, or administer records.
3. Reviewer-only can claim/comment/decide and see only eligible review content.
4. Reviewer-only cannot edit draft content or publish/schedule.
5. Publisher-only can publish/schedule Approved content but cannot edit or review.
6. Editorial Admin can supervise without using the owner `CEO` role.
7. Combined Reviewer+Publisher retains each capability behind its separate guard.

Record each pass in this audit, `docs/STATUS.md`, and `docs/WORKLOG.md`.
