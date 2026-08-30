# Creator and Catalyst Integration Checklist

Status: ready for operator setup; live verification pending.

Use this checklist in order. Complete Development before creating or promoting
Production resources. Do not mark the Creator checkpoint or Catalyst boundary
verified from repository tests alone.

## 1. Creator checkpoint gate

- [ ] Re-save the current repository versions of `claim_review_assignment`,
  `record_review_decision`, `publish_approved_article`, and
  `schedule_approved_article`.
- [ ] Remove the temporary `test_email_delivery` function from the live app.
- [ ] Apply the report/menu/profile/sharing cleanup in
  `creator/PERMISSION_SHARING_SETUP.md`.
- [ ] Export a fresh post-cleanup `.ds` file and record its SHA-256.
- [ ] Run the separate Author-only, Reviewer-only, Publisher-only, and
  non-super-admin Editorial Admin positive/negative matrix.
- [ ] Record evidence in the audit/status/worklog. Until then, keep the Creator
  checkpoint **Unverified**.
- [ ] Add the multi-line field `Referenced_Media_UUIDs` (display name
  `Referenced Media UUIDs`) to `Article_Revisions` and expose it in
  `Article_Revisions_Report`. Keep it hidden/read-only for normal editorial
  profiles; the Article Workspace manages it.
- [ ] Upload the newly built Article Workspace widget package at
  `editor-widget/zet/dist/zet.zip` after adding that field. Re-save every
  image-bearing draft that will be used in promotion tests so the normalized
  references are populated before submission and approval.

## 2. Catalyst account and Development project

- [ ] Create or select the client-owned Catalyst organization and project.
- [ ] Select the India data center to align with the current Creator account.
- [ ] Confirm Cloud Scale > Stratus is visible. If it is not visible, ask
  Catalyst support to enable it before continuing; do not substitute File Store.
- [ ] Work in Catalyst Development.

## 3. Provision Development storage and state

- [ ] Create authenticated Stratus bucket `genedrift-publishing-private`.
- [ ] Create public Stratus bucket `genedrift-publishing-public`.
- [ ] For the public bucket, allow anonymous `GetObject` only; never public
  `PutObject` or `DeleteObject`.
- [ ] Keep bucket versioning disabled, enable encryption, and copy the exact
  public bucket URL shown in the console.
- [ ] Create all seven Data Store tables from `catalyst/README.md`, including the
  255-character object-key columns.
- [ ] Add the `0.2.0` serving-state columns to `GD_Published_Pointers` and
  backfill existing rows to `Serving_Status = Published` before deployment.
- [ ] Create `GD_Public_Index`, deploy AppSail `0.4.0`, call the authenticated
  rebuild route once, and verify its count equals the current pointer count.
- [ ] Restrict insert/update/delete permissions as described in the setup guide.

## 4. Provision AppSail and scheduling

- [ ] Create the Node.js 22 AppSail service from `catalyst/`.
- [ ] Create the Job Pool named by `GD_JOBPOOL_NAME` and allow the AppSail
  service as a target.
- [ ] Keep platform job retries at zero; the application worker owns bounded
  retry and backoff.
- [ ] Add every variable from `catalyst/.env.example` to Catalyst Development.
- [ ] Generate separate random values of at least 32 characters for
  `PUBLISHING_HMAC_SECRET` and `INTERNAL_JOB_SECRET`.
- [ ] Use the exact Development Stratus names and Development bucket URL. Never
  reuse Production bucket values in Development.

## 5. Configure least-privilege Creator OAuth

- [ ] Create the OAuth client in the India Zoho API Console.
- [ ] Grant only `ZohoCreator.customAPI.EXECUTE` and
  `ZohoCreator.report.READ`.
- [ ] Generate and securely store the client ID, client secret, and refresh
  token in Catalyst environment variables only.
- [ ] Set the Creator owner, application link name, media report link name,
  file-field link name, and environment variables exactly.
- [ ] Do not put the OAuth secret or refresh token in Creator, the widget, or
  source control.

## 6. Deploy and verify Catalyst Development health

- [ ] Deploy AppSail and copy its HTTPS base URL.
- [ ] Set `GD_APPSAIL_BASE_URL` to that URL.
- [ ] Confirm `GET /health` returns `ok: true`.
- [ ] Confirm the service can write/read a private snapshot object.
- [ ] Confirm the service can write/read public content/media and the copied
  public bucket URL retrieves it.
- [ ] Confirm the runtime cannot overwrite an existing object with different
  bytes and ordinary editorial users cannot delete objects.

## 7. Install the Creator integration

- [ ] Install or replace the eight functions in the exact order listed in
  `creator/CATALYST_PUBLISHING_SETUP.md`.
- [ ] Add `Unpublished` to the Article workflow picklist and add/expose
  `Publication_Jobs.Retraction_Reason` and `Replacement_Path`.
- [ ] Confirm `Article_Revisions_Report` returns `Referenced_Media_UUIDs` and
  `Media_Assets_Report` returns `Published_Object_Key` to the integration/widget
  identities before invoking the first handoff.
- [ ] Create the `Publishing` variable group.
- [ ] Set `Catalyst_Base_URL` to the Development AppSail URL without a trailing
  slash.
- [ ] Set `Signing_Secret` to the same value as Development
  `PUBLISHING_HMAC_SECRET`.
- [ ] Create the two private OAuth2 Catalyst-only Custom APIs with the exact
  arguments in the setup guide, including `mediaJson` on the result callback.
- [ ] Keep publish and schedule Custom APIs private OAuth2; never enable Public
  Key authentication.
- [ ] Disable the old Creator `Articles.Scheduled_At` publishing workflow.
- [ ] Optionally add the low-frequency Creator reconciliation sweep; it only
  retries unacknowledged handoffs and does not publish due content.

## 8. Development promotion tests

- [ ] Upload the current dashboard widget and verify Mine/Queue/All, filters,
  search, metric shortcuts, reset/refresh, independent panel scrolling, long
  titles, and narrow-screen behavior with each applicable role.
- [ ] Immediate publish and duplicate handoff.
- [ ] Two independent scheduled publications.
- [ ] Duplicate worker delivery and idempotent immutable version/pointer.
- [ ] Transient publication failure, bounded retry, then success.
- [ ] Revoked approval at execution-time preflight.
- [ ] Stale revision race where the newer pointer remains current.
- [ ] Creator callback outage, independent retry, and later recovery.
- [ ] Callback replay with one Creator audit/state application.
- [ ] Creator state change after preflight with one reconciliation-conflict audit.
- [ ] Publish JPEG, PNG, GIF, and WebP test assets.
- [ ] Reject a changed media checksum, file signature, size, and dimensions.
- [ ] Replay identical media and confirm one content-addressed Stratus key and
  stable public URL.
- [ ] Publish an article after the media library contains unrelated assets and
  confirm the handoff includes only inline, featured, and social media referenced
  by that revision (maximum 200 assets).
- [ ] Confirm Creator receives `Published_Object_Key`, `Published_URL`, and
  `Status = Ready` only from a signed successful callback.

Retraction is implemented locally in AppSail `0.2.0`, Creator functions, and the
dashboard, but is not deployed or live-verified. Before public launch, provision
its fields/columns and verify this matrix:

- [ ] Publisher/Admin retract with required reason and one signed callback/audit.
- [ ] Author/Reviewer/non-authorized direct API retraction is denied.
- [ ] Duplicate/replayed retract converges without duplicate state or audit.
- [ ] Retracted content disappears from listings and returns HTTP 410 or its
  configured redirect; cached Next.js pages are invalidated.
- [ ] Republish creates a new immutable version and preserves retraction history.

## 9. Production promotion

- [ ] Select and connect a production malware-scanning service for uploaded
  media, or obtain explicit documented risk acceptance before public launch.
- [ ] Create separate Production tables, two Production Stratus buckets,
  AppSail configuration, Job Pool, OAuth grant, and rotated secrets.
- [ ] Use the Production public bucket URL, which differs from Development.
- [ ] Repeat the full promotion matrix in Production with disposable test
  articles.
- [ ] Record evidence before marking production verified.
- [ ] Leave the public Next.js frontend for its later separate phase.

## Required evidence at handoff

- Fresh Creator `.ds` export and checksum.
- Completed role-isolation matrix.
- Catalyst Development and Production project/data-center identifiers.
- Stratus bucket names and public base URLs (not secrets).
- AppSail health result and deployment version.
- Promotion-test results, including media and retry/callback evidence.
- Dashboard role/filter/scroll evidence and, before public launch, the public
  read-layer and retraction evidence.
