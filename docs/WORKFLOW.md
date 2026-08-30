# Editorial Workflow

Status: Draft

## States

- Draft
- Submitted
- Assigned
- In Review
- Changes Requested
- Rejected
- Approved
- Scheduled
- Publishing
- Published
- Publish Failed
- Unpublished
- Archived

## Primary Path

Draft -> Submitted -> Assigned -> In Review -> Approved -> Scheduled or
Publishing -> Published

## Rules

- An author cannot approve their own article.
- Submission creates or identifies the immutable revision under review.
- Review comments are required when changes are requested or content is rejected.
- Editing reviewed content creates a new draft revision.
- Approval does not itself make content public.
- Publishing requires Publisher permission.
- A reviewer may publish an article they approved only when they independently
  hold Publisher permission.
- Each article can require one or more reviewer approvals.
- An article becomes Approved only after its configured approval requirement is met.
- Every transition records actor, timestamp, previous state, next state, and note.
- A failed publication can be retried safely without creating duplicate versions.
- Retraction is different from deletion or archival: it stops public serving but
  preserves immutable publication history.

## Retraction Path (implemented locally; live verification pending)

Published -> Unpublished/Retracted -> Republished or Archived

- Only Publisher or Editorial Admin may retract, with a required reason.
- The public reader must exclude retracted entries and return HTTP 410 or an
  approved redirect for the old slug.
- Republish creates an audited new publication; immutable versions are not
  deleted or rewritten.
- Creator, Catalyst, and dashboard code provide the control-plane path locally.
  Public HTTP 410/redirect enforcement waits for the public read layer.

## Assignment Strategy

The author may suggest one or more reviewers. The system validates that each
suggested reviewer is active, eligible, and not the author. If no reviewer is
selected, the article enters a shared eligible-reviewer queue. Final eligibility
rules will be mapped to the client's Employee / Team structure after inspection.

## Approval Policies

Reusable approval policies define the number and type of approvals required.
The initial policies are Standard (one approval) and Regulated (two approvals).
An Editorial Administrator may override the selected policy for an article, and
the override is recorded in the audit history.

There is no automatic review deadline in the first release.

## Rejection Semantics

Changes Requested is the normal feedback loop and returns the article to Draft.
Rejected is reserved for content that should not proceed and requires a reason.

## Open Workflow Decisions

- Whether Regulated approval requires specific specialist roles
- Whether rejected content can be reopened by an Editorial Administrator
