# Permission and Sharing Setup

Status: prepared locally and checked against the 2026-08-26 live DS export. Do
not mark complete until each role has been tested with a separate real Creator
user.

## Live Export Warning

The current export has broad `Editorial Author` and `Editorial Reviewer`
profiles, but no dedicated Publisher or Editorial Admin profiles or Creator
roles. Apply this document as a replacement matrix, not as confirmation that the
current profile checkboxes are correct.

Before testing the matrix, re-save the current corrected versions of
`claim_review_assignment`, `record_review_decision`,
`publish_approved_article`, `schedule_approved_article`, and
`retract_published_article`. The export contains
older ungrouped authorization and open-record criteria.

## Goal

Use Creator permission profiles for the broad application surface, then use
Data Sharing rules to expose only the records a role needs for the editorial
workflow. The widget and Custom APIs still enforce workflow authority, but
Creator visibility must not depend on super-admin access.

## Verified Boundary

- Admin local review and historical Creator-local publishing smoke tests passed.
- Harsh/Harshu as a combined Reviewer+Publisher user passed reviewer queue,
  regulated review, shared queue, draft isolation, and historical Creator-local publish
  smoke tests.

These checks prove the earlier workflow boundary, not the final least-privilege
matrix or the new Catalyst publishing boundary.
Author-only, Reviewer-only, Publisher-only, and non-super-admin Editorial Admin
profiles still require role-isolated verification.

## Creator Roles

Create or confirm these application roles:

- `Editorial Author`
- `Reviewer`
- `Publisher`
- `Editorial Admin`

Keep `CEO` for the owner/super-admin account only. Do not use `CEO` as the
normal client admin profile.

## Permission Profiles

### Editorial Author

Allow:

- Open the Article Workspace page/widget.
- Add/read/update `Articles` records owned by or authored by the user.
- Add/read/update owned Draft `Article_Revisions`.
- Add/read/update owned Draft `Media_Assets`.
- Read `Categories`, `Tags`, `Approval_Policies`, `Demo_Employees`, and
  `Editorial_Role_Assignments`.
- Read `Review_Assignments`, `Review_Comments`, and `Audit_Events` related to
  the user's articles.
- Invoke `submit_article_for_review`.

Deny:

- Delete on all editorial records.
- Write on `Approval_Policies`, taxonomy, site settings, redirects, audit,
  role assignments, review assignments, review comments, and publication jobs.
- Invoke claim, decision, publish, schedule, or retract APIs unless the same user also
  holds the relevant editorial role.

### Editorial Reviewer

Allow:

- Open the Article Workspace page/widget.
- Read submitted `Articles`, `Article_Revisions`, and `Media_Assets` exposed by
  assignments or shared queue.
- Read `Review_Assignments`, `Review_Comments`, `Categories`,
  `Approval_Policies`, `Demo_Employees`, and `Editorial_Role_Assignments`.
- Add review comments only through `add_review_comment`.
- Invoke `claim_review_assignment` and `record_review_decision`.

Deny:

- Add/update/delete on `Articles`, `Article_Revisions`, and `Media_Assets`.
- Write on taxonomy, settings, roles, audit, redirects, and publication jobs.
- Invoke publish, schedule, or retract APIs unless the same user also holds Publisher.

### Publisher

Allow:

- Open the Article Workspace dashboard.
- Read Approved, Scheduled, and Published `Articles`, their approved revisions,
  referenced media, review assignments/comments, audit events, and publishing
  jobs.
- Invoke `publish_approved_article`, `schedule_approved_article`, and
  `retract_published_article`.
- Read/create/update `Publication_Jobs` only for publish/schedule/retract operations.

Deny:

- Edit Draft or Submitted article content.
- Claim reviews or record decisions unless the same user also holds Reviewer.
- Modify approval policies, taxonomy, settings, roles, redirects, or audit.

### Editorial Admin

Allow:

- Manage editorial content, review assignments, role assignments, taxonomy,
  approval policies, publication jobs, redirects, site settings, and audit views.
- Invoke all private editorial Custom APIs.

Deny:

- Direct modification of immutable submitted/approved/published revision content
  outside the approved server-side transitions.
- Production deployment credentials or Catalyst/Vercel secrets in Creator.

## Data Sharing Rules

Start with no broad peer sharing. Add only these role-to-role bridges.

### Author to Reviewer

- `Articles`: Editorial Author -> Reviewer, Read
- `Article_Revisions`: Editorial Author -> Reviewer, Read
- `Media_Assets`: Editorial Author -> Reviewer, Read
- `Review_Assignments`: Editorial Author -> Reviewer, Read

### Reviewer to Author

- `Review_Assignments`: Reviewer -> Editorial Author, Read
- `Review_Comments`: Reviewer -> Editorial Author, Read
- `Audit_Events`: Reviewer -> Editorial Author, Read
- `Article_Revisions`: Reviewer -> Editorial Author, Read/Write only if this is
  still required for the verified N+1 draft visibility path. Prefer replacing it
  with a narrower owner/admin-created draft rule after the author-only test.

### Author and Reviewer to Publisher

- `Articles`: Editorial Author -> Publisher, Read
- `Article_Revisions`: Editorial Author -> Publisher, Read
- `Media_Assets`: Editorial Author -> Publisher, Read
- `Review_Assignments`: Editorial Author -> Publisher, Read
- `Review_Comments`: Reviewer -> Publisher, Read
- `Audit_Events`: Editorial Author -> Publisher, Read
- `Audit_Events`: Reviewer -> Publisher, Read

### Publisher to Admin

- `Publication_Jobs`: Publisher -> Editorial Admin, Read/Write
- `Audit_Events`: Publisher -> Editorial Admin, Read

### Owner/CEO Seed Data to Roles

Keep read-only access from `CEO` or `Editorial Admin` to Author, Reviewer, and
Publisher for the lookup/config forms required by the widget:

- `Demo_Employees`
- `Editorial_Role_Assignments`
- `Categories`
- `Tags`
- `Approval_Policies`

## Corrected Rule And Temporary Rule

The current export's `Review_Comments_RA` rule correctly targets
`Review_Comments` with Reviewer -> Editorial Author Read access. No correction is
needed for that rule.

`Article_Revision_rA` still grants Reviewer -> Editorial Author Read/Write. Keep
it only for the current reviewer-created N+1 draft prototype. Replace it with a
server/admin-owned draft creation and narrower ownership model before production.

## Verification Matrix

Use different real Creator users. Seed employees alone do not prove isolation.

1. Author-only user can create, save, submit, and respond to Changes Requested.
2. Author-only user cannot claim review, approve, publish, schedule, retract, or edit
   approval policies/taxonomy/role assignments.
3. Reviewer-only user can see assigned and eligible queue work, claim, comment,
   decide, and open closed history snapshots read-only.
4. Reviewer-only user cannot open the author's N+1 Draft through article-only or
   explicit revision URLs.
5. Publisher-only user can see Approved/Scheduled/Published publishing work and
   can publish, schedule, or retract through the dashboard.
6. Publisher-only user cannot edit Draft content or record review decisions.
7. Editorial Admin user can supervise queues, publish/schedule/retract, and manage
   configuration without using the `CEO` role.
8. Combined Reviewer+Publisher user keeps both capabilities, with review and
   publish rights still gated separately by editorial role assignments.

Record each pass in `docs/DATA_SHARING_AUDIT.md`, `docs/STATUS.md`, and
`docs/WORKLOG.md`.
