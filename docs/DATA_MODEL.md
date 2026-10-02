# Data Model

Status: Draft

## Demo Editorial Directory

### Employees

- Employee ID
- Display name
- Work email
- Creator user reference
- Active status

### Teams

- Team ID
- Name
- Active status
- Team lead employee

### Team Memberships

- Employee
- Team
- Membership role
- Active from
- Active until

### Editorial Role Assignments

- Employee
- Editorial role
- Subject/category expertise
- Active status
- Effective from
- Effective until

This is a demonstration directory only. Production identities will map to the
client's existing Employee / Team records.

## Editorial Content

### Articles

- Stable article ID
- Working title
- Owner/author
- Current draft revision
- Current published revision
- Workflow state
- Category and tags
- Required approval count or approval policy
- Created and modified timestamps

### Article Revisions

- Stable revision ID and revision number
- Article
- Structured editor JSON
- Generated sanitized HTML
- Title, excerpt, slug, and SEO fields
- Featured media
- Normalized referenced media UUID list for bounded publication handoff
- Author snapshot
- Created by and created at
- Content checksum

### Review Assignments

- Article revision
- Reviewer
- Assignment status
- Decision and comments
- Assigned, claimed, due, and decided timestamps

### Categories and Tags

- Stable ID
- Name and slug
- Description
- Active status

### Media Assets

- Stable media ID
- Draft Creator file reference
- Published object key and URL
- MIME type, dimensions, size, checksum
- Alt text, caption, and attribution

### Publication Jobs

- Idempotency key
- Article and revision
- Requested action
- Status and attempt count
- Request, response, and error metadata
- Requested, started, and completed timestamps

### Redirects

- Source path
- Destination path
- Redirect status
- Active status

## Catalyst Published Model

- `GD_Publication_Requests`: one idempotent accepted handoff, approved-snapshot
  object reference, schedule/retry state, lease, and terminal result.
- `GD_Publication_Attempts`: append-oriented worker attempt history.
- `GD_Published_Versions`: insert-only publication identity, content hash,
  immutable object reference, revision identity, and publication time.
- `GD_Published_Pointers`: one mutable row per article, advanced with a
  publication ID + pointer-version compare-and-swap predicate.
- `GD_Callback_Outbox`: deterministic Creator result event and independent
  delivery lifecycle.
- `GD_Request_Nonces`: unique, expiring replay claims for signed handoffs.
- Approved snapshots live in private Catalyst Stratus; published documents and
  media live in a separate public-read Stratus bucket under content-addressed
  immutable keys.

The public frontend now reads through the Catalyst public content API and
maintained `GD_Public_Index` projection. The projection provides stable slug,
status, category/tag, published time, summary/search, and current-pointer fields
without exposing private Data Store credentials to the browser.

AppSail `0.2.0` implements retraction using `Serving_Status`, `Retracted_At`,
`Retraction_Reason`, `Retraction_Event_ID`, and `Replacement_Path` on the mutable
pointer. These columns must be provisioned and existing pointers backfilled to
Published before deployment. Immutable `GD_Published_Versions` rows and Stratus
objects remain unchanged.

Preview snapshots with expiry remain a later separate boundary and are not mixed
with approved publication records.
