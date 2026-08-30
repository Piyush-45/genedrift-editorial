# Review Workflow Setup

Status: review workflow is installed and live verified. Submission, reviewer
claim, comment, approval, changes-requested decisions, N+1 draft creation, N+1
resubmission approval, Regulated Review with two distinct approvals, shared
queue claiming, and reviewer draft isolation have passed live testing.

Publishing setup has moved to `creator/PUBLISHING_SETUP.md`.

## Structured review model

`Review_Assignments` is the repeating reviewer structure for an article revision.
Each reviewer has an independent status, decision, summary, and timestamps.
`Review_Comments` stores the discussion trail and `Audit_Events` stores lifecycle
transitions. Creator can present these records as a related list or subform-like
interface without putting workflow history inside the `Articles` record.

## Step 1: Seed representative test roles

Create a Creator function with:

- Name: `seed_workflow_test_users`
- Language: Deluge
- Namespace: Default
- Return type: void
- Arguments: none

Paste `functions/seed_workflow_test_users.deluge`, save it, and execute it once.
It is idempotent and may safely be executed again.

Expected records:

- Ananya Author: Author
- Ravi Reviewer: Reviewer
- Meera Reviewer: Reviewer
- Priya Publisher: Publisher
- One active Editorial Team membership for each test employee

These are directory records, not licensed Creator users. Actual multi-login
permission testing will use real Creator users later.

## Step 2: Add the submission function

Create a Creator function with:

- Name: `submit_article_for_review`
- Language: Deluge
- Namespace: Default
- Return type: map
- Arguments:
  - `articleId`: int
  - `reviewerIdsCsv`: string

Paste `functions/submit_article_for_review.deluge` and save it. Do not execute it
from the function editor against production content.

## Step 3: Expose it as a private Custom API

In Microservices > Custom APIs, create:

- Display name: Submit Article for Review
- Link name: `submit_article_for_review`
- Method: POST
- Content type: application/json
- Argument type: Key and Value
- Authentication: OAuth2
- User scope: All application users
- Function: Default > `submit_article_for_review`
- Response: Standard

Do not use Public Key authentication for an editorial state-changing operation.

The widget request body will contain the article ID and a comma-separated list of
reviewer record IDs. An empty reviewer list creates shared queue slots equal to
the article's required approval count. If fewer reviewers are selected than
required, the remaining slots enter the shared queue.

## Submission guarantees

- Only Draft or Changes Requested articles can be submitted.
- Only the owner, primary author, or Editorial Admin can submit.
- The active revision must exist, remain Draft, and contain saved content.
- Authors cannot review their own article.
- Every selected reviewer must be active and hold an active Reviewer role.
- Duplicate reviewers and duplicate active assignments are rejected.
- The revision becomes Submitted and is no longer editable.
- The article becomes In Review.
- One assignment is created per selected reviewer, with queue slots for any
  approval shortfall.
- The transition is appended to Audit Events.

## Identity mapping

The function resolves the current employee by matching `Work_Email` to
`zoho.loginuserid` first. It falls back to matching `Creator_Username` to
`zoho.loginuser`. Zoho treats the former as the logged-in email address and the
latter as the account username, so these values must not be assumed to be equal.

## Next connection

The widget now includes reviewer selection and Submit for Review controls. It
invokes the Custom API through Creator Widget JS API V2, saves the latest draft
first, and changes the workspace to a read-only In Review state after success.

Upload `editor-widget/zet/dist/zet.zip` to the existing Creator widget and test it
with a Draft article. After submission, verify:

- `Articles.Workflow_State` is `In Review`.
- `Article_Revisions.Revision_State` is `Submitted`.
- `Review_Assignments` contains the selected reviewer assignments and/or queue
  slots required by the approval policy.
- `Audit_Events` contains `Submitted for Review`.
- The Custom API API Hits tab records the POST request.

First live result: the test article moved to In Review, Revision 1 moved to
Submitted, one suggested-reviewer assignment was reported as created, and the
workspace became read-only.

## Step 4: Add the reviewer action functions

Create these three functions under Workflow > Functions. For each function,
select Deluge, the Default namespace, and the listed return type and arguments.

### Claim review assignment

- Name: `claim_review_assignment`
- Return type: map
- Arguments: `assignmentId` (int)
- Source: `functions/claim_review_assignment.deluge`

### Add review comment

- Name: `add_review_comment`
- Return type: map
- Arguments:
  - `assignmentId` (int)
  - `commentType` (string)
  - `commentBody` (string)
  - `documentAnchor` (string)
  - `parentCommentId` (int)
- Source: `functions/add_review_comment.deluge`

### Record review decision

- Name: `record_review_decision`
- Return type: map
- Arguments:
  - `assignmentId` (int)
  - `decision` (string)
  - `decisionSummary` (string)
- Source: `functions/record_review_decision.deluge`

Save each function. Do not execute these state-changing functions from the
function editor.

## Step 5: Expose the reviewer Custom APIs

Create one private Custom API for each function. All three use POST, OAuth2,
`application/json`, Key and Value arguments, All application users, and the
Standard response. The link names must be exactly:

- `claim_review_assignment`
- `add_review_comment`
- `record_review_decision`

Map each API to the Default-namespace function with the same name. API names are
part of the widget contract, so do not add prefixes or change their spelling.

## Step 6: Expose report fields used by the widget

Ensure the report backing `Review_Assignments_Report` exposes at least:

- Assignment UUID, Article, Revision, Reviewer, Assignment Source, Status
- Decision, Decision Summary, Assigned At, Claimed At, Decided At

Ensure `Review_Comments_Report` exposes at least:

- Assignment, Revision, Author Employee, Comment Type, Comment Body
- Document Anchor, Parent Comment, Resolved

These reports are the widget's authenticated read model. A field can be saved in
the form yet still appear blank in the widget if it is omitted from the report.

## Step 7: Upload and test the reviewer widget

Upload `editor-widget/zet/dist/zet.zip` to the existing GeneDrift Editorial
Workspace widget. The package has passed TypeScript compilation, the production
build, ZET validation, and ZET packaging.

For a true permission test, use an article whose primary author is not the
logged-in reviewer. Submit it to that reviewer, then reopen Article Workspace as
the reviewer and verify:

1. Claim Review changes the assignment from Assigned or Queued to Claimed.
2. A discussion comment creates a `Review_Comments` record.
3. Approve records an independent reviewer decision.
4. Standard Review reaches Approved after one distinct approval.
5. Regulated Review remains In Review after the first approval and reaches
   Approved only after the second distinct reviewer approval.
6. Request Changes returns the article to Changes Requested and closes remaining
   open assignments.
7. Each claim and decision produces an `Audit_Events` record.
8. Request Changes creates Revision N+1 as a Draft, clones the submitted
   revision's editor document and metadata, and points
   `Articles.Active_Draft_Revision_ID` at the new Draft. The submitted revision
   must remain Submitted.

## Editorial Home dashboard

The first role-aware dashboard has passed its initial live admin and Harsh tests.
Opening Article Workspace without an `articleId` shows dashboard counts, Review
Inbox, Article Work, and Review History. Opening a row routes into the existing
article workspace; review-history rows also carry the exact reviewed revision ID.

After uploading the current role-isolation rebuild, verify:

1. Admin can open Article Workspace from the sidebar without a manual URL.
2. Harsh can see assigned review work in Review Inbox.
3. The Open button loads the article workspace with the correct article.
4. Closed assignments appear in Review History and open the exact reviewed
   revision read-only.
5. Data Sharing and permissions still prevent users from seeing records outside
   their intended role visibility.
6. After Changes Requested, the reviewer cannot open or edit the author's N+1
   Draft, while the owner, primary author, and Editorial Admin can.

The dashboard is not a replacement for the workflow records. Its counts and task
lists are driven by the same verified Creator reports:

- Authors: create article, drafts, and changes requested
- Reviewers: assigned reviews and claimable shared-queue work
- Publishers: approved and scheduled content
- Editorial Admins: workload, bottlenecks, failed operations, and recent events
