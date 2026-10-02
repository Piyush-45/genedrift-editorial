# GeneDrift Current Checkpoint - 2026-09-05

Superseded by `docs/CURRENT_CHECKPOINT_2026-09-07.md`. Retain this file as the
2026-09-05 evidence snapshot.

Status: **Creator widget v0.5.5 input preservation is live-smoke verified from
the user's 2026-09-05 screenshots. v0.5.6 is packaged locally with floating
publishing notifications, but is not yet uploaded.**

Use this as the first file to read when resuming. The default forward focus is
now Phase 2 website/design work, with Phase 1 Article Workspace items retained
only as support/testing context.

## Forward focus: Phase 2

The project is moving into Phase 2: Website Design Confirmation. This is the
client-facing public website revamp, not more Article Workspace work unless the
user explicitly asks for it.

Phase 2 means:

- prepare the three requested website template/design concepts;
- keep two concepts close to the LF20 presentation/design philosophy;
- prepare one more independent premium advisory concept;
- compare directions with the client before full build;
- then move into the final Next.js frontend build after design and article
  workflow approval.

Primary Phase 2 reference:

- `docs/PHASE_2_WEBSITE_REVAMP_CLIENT_BASELINE.md`

Current shared staging links:

- Blog / Insights: `https://genedrift.site/insights`
- Design references: `https://genedrift.site/designs`

## What changed

- The user uploaded
  `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.4-refresh-reset.zip`
  to the live migrated Creator app.
- The user added the matching `reset_editorial_test_content` Deluge function and
  private Custom API.
- The live dashboard reset now works: the dashboard returned to a clean
  zero-count state after reset.
- The Editorial Command Center dashboard is now the current live experience.
- The dashboard live status now reads cleanly as
  `Live · checks every 1m · last checked just now` while idle.
- During manual post-reset testing, category/tag names and image alt text were
  found to be corrupted by a server-side whitespace regex. v0.5.5 removes that
  rewriting and adds image metadata save verification for alt text and caption.
- The user confirmed the v0.5.5 retest: category/tag names preserved,
  cover-image alt text and edited Caption read back, inline image Caption read
  back, Save showed cleanly, and Submit for review retained all tested content.
- v0.5.6 changes publishing success/error messages to floating notifications
  with a Publishing dashboard action, while leaving ordinary editor notices in
  their existing inline positions.

## Creator app / widget state

- Creator app owner: `piyugene02`
- App link: `genedrift-editorial-platform`
- App URL:
  `https://creatorapp.zoho.in/piyugene02/genedrift-editorial-platform#Article_Workspace`
- v0.5.5 input preservation is live-smoke verified from the user's screenshots.
- v0.5.6 floating publishing notification package is prepared locally but still
  needs upload/manual verification before it can be called live verified.

## Current verified widget

- Widget ZIP:
  `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.5-input-preserve.zip`
- SHA-256:
  `c30186d81ff2d14558df67afb0de0864e9a5ce424aa784670305c03811ee77fe`
- Creator function sources used by this fix:
  - `creator/functions/create_editorial_taxonomy_term.deluge`
  - `creator/functions/update_media_metadata.deluge`
- Behavior change: preserve author-entered category/tag names and image alt
  text exactly except for leading/trailing spaces; verify saved image alt text
  and caption after metadata updates.

## Prepared notification-polish widget

- Widget ZIP:
  `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.6-floating-publishing-notice.zip`
- SHA-256:
  `2ed7f79bcfd2670266501b695fef13f6d9c43de69e4d787739184c1eaafd1561`
- Behavior change: publishing, schedule, retry, retraction, and in-workspace
  publish outcomes now appear as floating notices instead of inline header
  banners/panels.

Keep v0.5.1 only as an older rollback reference. It is no longer the current
live widget for the migrated demo app.

## Live verified from user screenshot

- Article Workspace opens under the migrated app.
- Dashboard shows the new Editorial Command Center layout.
- Reset test content is available to the admin user.
- After reset, the dashboard shows zero articles and zero review items.
- The live refresh copy is no longer contradictory; it shows the idle one-minute
  check interval and a fresh last-check time.
- v0.5.5 input preservation retest passed visually for:
  - clean category selection
  - clean tags `creator qa final`, `caption verified`, and `input preserve`
  - cover alt text and edited Caption
  - inline image Caption
  - draft save/reload and submit-for-review readback
- The successful v0.5.5 smoke article was
  `SMOKE v0.5.5 Input Preserve Final Test`; the user submitted it for review and
  confirmed retained readback.

Reviewer approval, Publisher publish, public-site visibility, and the new
v0.5.6 floating publishing notification still need manual verification.

## Public cleanup after Creator reset

After the Creator reset, the public site still showed previously published test
articles because Catalyst public serving data is intentionally separate from
Creator test content. The user cleaned the public Catalyst side and confirmed
the frontend no longer shows these development posts:

| Title | Slug | Article UUID |
| --- | --- | --- |
| editable tags checking | `editable-tags-checking` | `ART-2051376f206b51ce0bb2139d0e028490` |
| smoke test 1 | `smoke-test-1` | `ART-fe442584a3a7625107d4777fb7d84ca3` |
| hanumaaaan | `hanumaaaan` | `ART-45e1388a25e736ba41d73617928c04e3` |

Cleanup note: deleting or retracting rows in `GD_Public_Index` removes articles
from the public listing. For durable cleanup that will not reappear after a
public-index rebuild, keep the matching `GD_Published_Pointers` row in sync by
the same `Article_UUID`, preferably with `Serving_Status = Retracted`. Do not
delete immutable `GD_Published_Versions` rows or Stratus objects during normal
dev cleanup.

## Installed Custom API delta

v0.5.4 requires this additional private OAuth2 Creator Custom API:

- `reset_editorial_test_content`

The function source is:

- `creator/functions/reset_editorial_test_content.deluge`

Configuration:

- Method: `POST`
- Authentication: `OAuth2`
- Argument type: `Key and Value`
- Request body content type: `application/json`
- User scope: all application users
- Function link name: `reset_editorial_test_content`

The function itself enforces CEO/Editorial Admin authorization and requires the
exact confirmation phrase:

```text
RESET TEST CONTENT
```

## Reset boundary

The reset deletes Creator editorial test content only:

- `Articles`
- `Article_Revisions`
- `Article_Contributors`
- `Review_Assignments`
- `Review_Comments`
- `Publication_Jobs`
- `Media_Assets`
- `Audit_Events`

It intentionally keeps:

- demo employees
- role assignments
- approval policies
- categories
- tags
- site settings
- redirects

It does not delete Catalyst immutable objects, Stratus media, published JSON,
public-site records, or already-published frontend content. Use Catalyst/public
maintenance separately before claiming a true public clean slate.

## Remaining Phase 1 support work

- Upload v0.5.6 if the user wants the floating publishing notification polished
  live before Phase 2 client presentation work.
- Complete the remaining review/publish/public-site check for
  `SMOKE v0.5.5 Input Preserve Final Test` if the user wants a final Phase 1
  evidence packet.
- Rotate any OAuth credentials/secrets that were exposed during debugging before
  a real client handoff.
- Otherwise, treat Article Workspace work as support only and proceed with Phase
  2 website/design confirmation.

## Best resume order

1. `docs/CURRENT_CHECKPOINT_2026-09-05.md`
2. `docs/CURRENT_CHECKPOINT_2026-09-04.md`
3. `docs/CREATOR_ACCOUNT_MIGRATION_RUNBOOK.md`
4. `docs/HANDOFF.md`
5. `docs/STATUS.md`
6. `creator/WORKFLOW_POLISH_SETUP.md`
7. `docs/WORKLOG.md`
