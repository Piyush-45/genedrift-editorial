# Scheduling and Notifications

Last updated: 2026-08-26

## Current position

Catalyst owns production publication timing. Creator records the publisher's
choice and immediately sends a signed, idempotent approved snapshot to Catalyst.
The old Creator date-field workflow is historical demo evidence and must be
disabled when the Catalyst functions are installed.

## Production schedule flow

1. A Publisher or Editorial Admin schedules the exact Approved revision in
   Creator using an Asia/Kolkata local time.
2. Creator records `Workflow_State = Scheduled`, `Scheduled_At`, a unique open
   `Publication_Jobs` row, and an audit event.
3. Creator sends the exact editor-document bytes, checksum, portable identities,
   metadata, and approved Creator media-source mappings to Catalyst over the
   signed handoff boundary.
4. Catalyst stores the approved snapshot and creates one deterministic one-time
   job for the due time.
5. The due worker acquires a lease and calls Creator preflight. Approval
   revocation, pointer changes, state changes, identity changes, and checksum
   changes block publication.
6. Catalyst validates and writes referenced media to content-addressed Stratus
   objects, inserts an immutable published version, and conditionally advances
   the current pointer. Duplicate workers converge; a stale revision cannot
   replace a newer pointer.
7. Catalyst queues and attempts a signed Creator callback. Creator applies the
   deterministic event once and updates its publication job, article, revision,
   timestamps, and audit stream.

## Retry ownership

The domain worker, not the Job Scheduling platform, owns retries. Transient
failures use bounded exponential backoff and a new one-time job. Permanent
validation, approval, content, or stale-revision failures stop immediately.

Callback delivery has a separate outbox, backoff, and dead-letter lifecycle. A
Creator outage may delay its read model but cannot roll back the Catalyst
published version or pointer.

Creator's `process_scheduled_publications` is now only a handoff reconciliation
sweep for jobs that Catalyst never acknowledged. It does not inspect due
articles and cannot mark content Published.

## Notification boundary

Editorial emails remain best-effort handoffs through
`send_editorial_notification`. Notification failure never rolls back submission,
review, schedule, publication, or callback state.

The current Creator trial sender proved acceptance and Gmail delivery to Spam,
but not production deliverability. Production delivery, bounce, complaint,
template, and domain-authentication evidence requires a transactional mail
provider and its webhook/log boundary.

## Verification

Production scheduling remains unverified until Catalyst Development and
Production pass:

1. two articles scheduled at different due times;
2. duplicate handoff and duplicate worker delivery;
3. transient worker failure and bounded retry;
4. revoked approval before the due time;
5. a newer revision winning a stale-worker race;
6. Creator callback outage and later recovery; and
7. replay of the same callback event without duplicate audit/state changes.

Use `catalyst/README.md` and `creator/CATALYST_PUBLISHING_SETUP.md` for the exact
installation and promotion gates.
