# Publishing Setup

Status: the former Creator-local publisher has been replaced in the repository.
The Catalyst boundary is implemented and locally tested, but Creator/Catalyst
installation and live verification are pending.

## Supported boundary

`publish_approved_article` still enforces active Publisher or Editorial Admin
authorization and the exact Approved revision pointer. It now creates a unique
Queued Creator job and calls `handoff_publication_to_catalyst`.

Creator does not create a fake successful Catalyst identifier and does not move
an article or revision to Published at request time. Catalyst owns validation,
immutable storage, worker execution, retry, and pointer advancement. Only
`record_catalyst_publication_result` may apply a successful Catalyst result back
to Creator.

## User-facing API

Keep the existing private OAuth2 Custom API:

- Link name: `publish_approved_article`
- Method: POST
- Content type: `application/json`
- Arguments: `articleId` (integer)
- Authentication: OAuth2; never Public Key
- Function: Default > `publish_approved_article`
- Response: Standard

The browser never receives the HMAC secret and never calls Catalyst directly.

## Guarantees

- Only an active Publisher or Editorial Admin can request publication.
- Only the exact `Approved_Revision_ID` in Approved state is handed off.
- The idempotency key is stable for article UUID + revision UUID.
- A queued duplicate is redelivered with the same idempotency key; a Processing
  duplicate returns the existing job.
- Catalyst revalidates Creator authority immediately before the immutable write.
- Creator reaches Published only through the signed idempotent callback.

Install all integration functions, variables, Custom APIs, and tests from
`creator/CATALYST_PUBLISHING_SETUP.md`. Provision Catalyst from
`catalyst/README.md`.

Historical Creator-local Admin and Publisher smoke tests remain valid only as
prototype evidence. They are not evidence for the new external boundary.

