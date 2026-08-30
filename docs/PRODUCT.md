# Product Definition

Status: Draft

## Objective

Deliver a production-grade editorial platform for GeneDrift that lets authorized
team members create, review, approve, schedule, publish, update, and archive blog
content from Zoho Creator. Published content is rendered under
`genedrift.com/insights` by a Next.js application.

The same platform will later manage the complete GeneDrift website after the
client supplies and approves the website sitemap.

## Product Principles

- Zoho Creator is the editorial source of truth.
- Zoho Catalyst is the published-content source of truth.
- Public traffic never reads Zoho Creator directly.
- Approval applies to an exact, immutable content revision.
- The current published revision remains live while an update is reviewed.
- Production infrastructure and credentials belong to the client.
- The demo implementation contains no real employee or confidential HR data.

## First Release Users

- Editorial administrator
- Author
- Reviewer
- Publisher

Users may hold multiple roles, but permissions remain separately controlled.

## First Release Capabilities

- Editorial dashboard and queues
- Structured rich-text article editor
- Draft autosave and revision history
- Reviewer assignment and change requests
- Approval, scheduling, publishing, unpublishing, and archiving
- Article preview
- Categories, tags, authors, media, SEO, and redirects
- Public Insights listing and article pages
- Search, sitemap, RSS, metadata, and structured data
- Publishing retries, audit logs, monitoring, and rollback

## Confirmed Release Decisions

- English-only publishing for the first release
- Configurable one-or-more reviewer approvals
- Reusable Standard and Regulated approval policies with administrator override
- A reviewer may publish an article only when separately assigned Publisher permission
- One primary category and multiple tags per article
- Search, author pages, related articles, RSS, and social sharing
- No public comments in the first release
- Scheduled publication uses the Asia/Kolkata timezone
- Review assignments have no automatic deadline in the first release
- Authors may suggest eligible reviewers; unassigned articles enter a shared queue
- The editor excludes code blocks but supports the complete approved editorial block set

## Out of Scope for the Blog Prototype

- Payroll, leave, attendance, recruitment, or general HR management
- Real-time collaborative editing
- Public user accounts or comments
- Full website page management before sitemap approval
- Multilingual publishing unless explicitly approved
- Public article comments

## Success Criteria

Success criteria will be finalized before implementation. At minimum, the
approved workflow must operate end to end, published pages must be accessible,
indexable, responsive, and accessible, and a failed publication must never
replace the previously published revision.
