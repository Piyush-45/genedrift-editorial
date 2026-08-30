# Notification and Scheduling Setup

Status: Creator notification handoff was live verified in the prototype. The
new Catalyst-owned production scheduling path is implemented locally and awaits
installation and live verification.

## Notifications

Keep `send_editorial_notification` installed in the Default namespace.
Submission, claim, review decision, schedule acceptance, and final Catalyst
callback may call it only after authoritative state/audit work. All callers catch
notification errors.

`Notification Handoff` proves Creator accepted a send request, not inbox
delivery. The 2026-08-26 trial test delivered the Gmail copy to Spam; an
authenticated production sender and delivery-log provider remain deployment
work.

## Schedule command

Keep the private OAuth2 `schedule_approved_article` Custom API:

- POST, `application/json`, Key and Value arguments
- `articleId` (integer)
- `scheduledAtText` (string in `yyyy-MM-ddTHH:mm`)
- OAuth2, Standard response, never Public Key

The Creator application timezone is Asia/Kolkata. The function requires a time
at least one minute in the future, records the Scheduled state/job/audit event,
and immediately hands the immutable snapshot and UTC-offset due time to Catalyst.

## Disable the prototype executor

Disable the `Articles.Scheduled_At` date-field workflow that previously called:

```deluge
thisapp.process_scheduled_publication(input.ID);
```

That workflow was useful for Creator-local demonstration but must not coexist
with the production boundary as a publisher. The repository's replacement
`process_scheduled_publication` is a safe redelivery/status helper and cannot
publish.

Optionally schedule `process_scheduled_publications` daily as a reconciliation
sweep. Daily is the shortest interval offered by the current Creator 6 custom
schedule UI. It retries only Queued Creator-to-Catalyst handoffs whose retry time
is due. Immediate handoff remains the normal path; Catalyst, not this sweep, owns
the article due time.

## Installation and verification

Follow `creator/CATALYST_PUBLISHING_SETUP.md` for the new handoff, preflight, and
callback functions and `catalyst/README.md` for one-time job setup. Do not call
production scheduling verified until the full promotion matrix in those files
passes.
