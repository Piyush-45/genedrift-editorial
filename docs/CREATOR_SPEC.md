# Zoho Creator Application Specification

Status: Draft

## Application Experience

The application presents purpose-built Pages and Reports to editorial users.
Underlying data forms are hidden from normal navigation except where direct form
entry is useful. The main article experience is a full-page React editor widget.

## Form Inventory

The demo application contains 17 forms. Four are demo identity forms that will
be mapped to the client's existing Employee / Team structures in production.

### 1. Demo Employees

- Employee Key: Single Line, required, unique
- Display Name: Name, required
- Work Email: Email, required, unique
- Creator User: Users, optional for prototype identities
- Job Title: Single Line
- Avatar: Image, optional
- Status: Dropdown (Active, Inactive), required

### 2. Demo Teams

- Team Key: Single Line, required, unique
- Team Name: Single Line, required, unique
- Team Lead: Lookup to Demo Employees
- Status: Dropdown (Active, Inactive), required

### 3. Demo Team Memberships

- Employee: Lookup to Demo Employees, required
- Team: Lookup to Demo Teams, required
- Membership Role: Dropdown (Member, Lead), required
- Active From: Date
- Active Until: Date
- Active: Decision Box

The Employee and Team combination must be unique while Active is true.

### 4. Editorial Role Assignments

- Employee: Lookup to Demo Employees, required
- Editorial Role: Dropdown (Author, Reviewer, Publisher, Editorial Admin), required
- Expertise Categories: Multi-select Lookup to Categories
- Effective From: Date
- Effective Until: Date
- Active: Decision Box

Production replaces the Demo Employees lookup with the approved client employee
reference. Role types remain controlled even though assignments are dynamic.

### 5. Approval Policies

- Policy Key: Single Line, required, unique
- Policy Name: Single Line, required, unique
- Description: Multi Line
- Required Approval Count: Number, required, minimum 1
- Require Distinct Reviewers: Decision Box, default true
- Required Expertise Categories: Multi-select Lookup to Categories
- Active: Decision Box
- Is Default: Decision Box

Exactly one active policy may be the default. Initial records are Standard with
one approval and Regulated with two approvals.

### 6. Articles

- Article UUID: Single Line, required, unique, system generated
- Working Title: Single Line, required
- Owner: Lookup to Demo Employees, required
- Primary Author: Lookup to Demo Employees, required
- Primary Category: Lookup to Categories, required before review
- Tags: Multi-select Lookup to Tags
- Approval Policy: Lookup to Approval Policies, required
- Approval Override Count: Number, Editorial Admin only
- Override Reason: Multi Line, required when override count is present
- Workflow State: Dropdown, system managed
- Active Draft Revision ID: Single Line, system managed
- Approved Revision ID: Single Line, system managed
- Published Revision ID: Single Line, system managed
- Scheduled At: Date-Time
- First Published At: Date-Time, system managed
- Last Published At: Date-Time, system managed
- Archived At: Date-Time, system managed

### 7. Article Contributors

- Article: Lookup to Articles, required
- Employee: Lookup to Demo Employees, required
- Contribution Type: Dropdown (Co-author, Contributor, Subject Expert)
- Display Order: Number
- Show Publicly: Decision Box

### 8. Article Revisions

- Revision UUID: Single Line, required, unique, system generated
- Article: Lookup to Articles, required
- Revision Number: Number, required, system generated per article
- Revision State: Dropdown (Draft, Submitted, Approved, Superseded, Published)
- Title: Single Line, required
- Slug: Single Line, required
- Excerpt: Multi Line, required before review
- Editor Document: File Upload, canonical compact JSON document
- Document Checksum: Single Line, system managed
- Plain Text Extract: Multi Line, system generated summary/extract
- Featured Media: Lookup to Media Assets
- Social Media: Lookup to Media Assets
- SEO Title: Single Line
- SEO Description: Multi Line
- Canonical URL Override: URL
- Robots Directive: Dropdown (Index Follow, Noindex Follow, Noindex Nofollow)
- Word Count: Number, system managed
- Reading Time Minutes: Number, system managed
- Change Summary: Multi Line
- Created By Employee: Lookup to Demo Employees
- Submitted At: Date-Time
- Approved At: Date-Time
- Referenced Media UUIDs: Multi Line, widget-managed normalized list used for a
  bounded publishing lookup

The JSON document is stored as a file because Creator multiline and rich-text
fields have a 64 KB limit. Autosave maintains local recovery and periodically
checkpoints the compact JSON file to the active draft revision.
On each save, the widget also stores the document's distinct media UUIDs in
`Referenced_Media_UUIDs`. Featured and social lookups are added separately at
handoff. This avoids scanning the complete media library as the archive grows.

### 9. Review Assignments

- Assignment UUID: Single Line, required, unique, system generated
- Article: Lookup to Articles, required
- Revision: Lookup to Article Revisions, required
- Reviewer: Lookup to Demo Employees, optional while queued
- Assignment Source: Dropdown (Author Suggested, Queue, Admin Assigned)
- Status: Dropdown (Queued, Assigned, Claimed, Approved, Changes Requested, Rejected, Cancelled)
- Decision: Dropdown (Approved, Changes Requested, Rejected)
- Decision Summary: Multi Line
- Assigned At: Date-Time
- Claimed At: Date-Time
- Decided At: Date-Time
- Cancelled At: Date-Time

Reviewer self-assignment and duplicate active assignments are rejected.

### 10. Review Comments

- Assignment: Lookup to Review Assignments, required
- Revision: Lookup to Article Revisions, required
- Author Employee: Lookup to Demo Employees, required
- Comment Type: Dropdown (General, Change Request, Reply, Resolution)
- Comment Body: Multi Line, required
- Document Anchor: Single Line, optional serialized editor position/reference
- Parent Comment: Lookup to Review Comments
- Resolved: Decision Box
- Resolved By: Lookup to Demo Employees
- Resolved At: Date-Time

### 11. Categories

- Category UUID: Single Line, required, unique, system generated
- Name: Single Line, required, unique
- Slug: Single Line, required, unique
- Description: Multi Line
- Default Approval Policy: Lookup to Approval Policies
- Display Order: Number
- Active: Decision Box

### 12. Tags

- Tag UUID: Single Line, required, unique, system generated
- Name: Single Line, required, unique
- Slug: Single Line, required, unique
- Description: Multi Line
- Active: Decision Box

### 13. Media Assets

- Media UUID: Single Line, required, unique, system generated
- Draft File: File Upload, populated immediately after record creation by the
  widget. It cannot be form-level required because Creator's add-record API
  cannot set file-upload fields; publish validation must reject missing files.
- Media Type: Dropdown (Image, Document, Video Thumbnail)
- Original Filename: Single Line, system managed
- MIME Type: Single Line, system managed
- File Size Bytes: Number, system managed
- Width and Height: Number, system managed for images
- Checksum: Single Line, system managed
- Alt Text: Single Line, required for publishable images
- Caption: Multi Line
- Credit: Single Line
- Published Object Key: Single Line, system managed
- Published URL: URL, system managed
- Status: Dropdown (Draft, Processing, Ready, Failed, Archived)
- Uploaded By: Lookup to Demo Employees

### 14. Publication Jobs

- Idempotency Key: Single Line, required, unique
- Article: Lookup to Articles, required
- Revision: Lookup to Article Revisions, required
- Action: Dropdown (Preview, Publish, Schedule, Unpublish, Republish, Rollback)
- Status: Dropdown (Queued, Processing, Succeeded, Failed, Cancelled)
- Attempt Count: Number, default 0
- Requested By: Lookup to Demo Employees
- Requested At: Date-Time
- Started At: Date-Time
- Completed At: Date-Time
- Catalyst Publication ID: Single Line
- HTTP Status: Number
- Error Code: Single Line
- Error Summary: Multi Line
- Next Retry At: Date-Time

### 15. Redirects

- Source Path: Single Line, required, unique
- Destination Path: Single Line, required
- Redirect Type: Dropdown (301 Permanent, 302 Temporary)
- Active: Decision Box
- Notes: Multi Line

Validation prevents redirect loops, self-redirects, and invalid external targets.

### 16. Audit Events

- Event UUID: Single Line, required, unique, system generated
- Entity Type: Dropdown (Article, Revision, Review, Publication, Media, Role)
- Entity UUID: Single Line, required
- Event Type: Single Line, required
- Actor Employee: Lookup to Demo Employees
- Previous State: Single Line
- New State: Single Line
- Event Summary: Multi Line
- Event Metadata: Multi Line, compact JSON
- Occurred At: Date-Time, system managed

Audit Events are append-only to normal users.

### 17. Site Settings

- Settings Key: Single Line, fixed unique value
- Site Name: Single Line
- Insights Base Path: Single Line, default /insights
- Default SEO Title Pattern: Single Line
- Default SEO Description: Multi Line
- Default Social Image: Lookup to Media Assets
- Publishing Timezone: Dropdown, fixed to Asia/Kolkata for release one
- RSS Enabled: Decision Box
- Search Enabled: Decision Box
- Related Articles Enabled: Decision Box

Only Editorial Admins can edit this singleton record.

## Pages and Reports

### My Work

Dashboard for the current user's drafts, submitted articles, review assignments,
scheduled publications, and recent activity.

### All Articles

Searchable report with state, owner, author, category, modified date, scheduled
date, and publication health filters.

### Editor

Full-page widget with the document canvas, inspector, preview, review context,
validation, autosave, and state-appropriate workflow actions.

### Review Queue

Separate Assigned to Me and Available views. Claiming is atomic so two reviewers
cannot claim the same queued assignment.

### Editorial Calendar

Calendar report for scheduled and published articles using Asia/Kolkata.

### Media Library

Grid/list views with processing state, metadata completeness, usage, and archive
controls.

### Taxonomy

Administrative Categories, Tags, and Approval Policies reports.

### Team and Roles

Editorial Role Assignments and the demo directory. Hidden from ordinary authors
and reviewers.

### Publishing Health

Failed, retrying, queued, and recently completed Publication Jobs.

### Audit

Read-only activity timeline with article, actor, event, and date filters.

## Permission Sets

### Author

Can create and edit owned drafts, submit for review, respond to comments, and
preview. Cannot approve, publish, change approval overrides, or edit taxonomy.

### Reviewer

Can access eligible queue items, claim assignments, comment, approve, request
changes, or reject. Cannot modify article content during review.

### Publisher

Can schedule, publish, unpublish, republish, and roll back approved revisions.
Publishing rights do not grant review rights automatically.

### Editorial Admin

Can manage all editorial records, roles, taxonomy, approval policies, overrides,
assignments, redirects, and settings. Production deployment permissions remain a
separate Creator environment permission.
