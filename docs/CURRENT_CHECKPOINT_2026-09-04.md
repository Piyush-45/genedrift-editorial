# GeneDrift Current Checkpoint - 2026-09-04

Status: **Superseded by `docs/CURRENT_CHECKPOINT_2026-09-05.md`. This file is
kept as the 2026-09-04 migration/workflow-polish packaging record.**

Use `docs/CURRENT_CHECKPOINT_2026-09-05.md` first, then this file for the
2026-09-04 migration debugging details.

## What changed today

### Media polish follow-up

- Live testing confirmed the v0.5.1 taxonomy correction: created tags can now
  be applied, saved, reloaded, and published.
- A new v0.5.2 candidate fixes Caption persistence through the guarded
  `update_media_metadata` Custom API for both upload and later editing.
- Credit was removed from authoring and new published rendering while the
  existing Creator field remains intact for backward compatibility.
- Inline images now have direct size, alignment, edit, and remove controls;
  cover removal has an Undo path; the metadata dialog has live Caption preview
  and a stable footer.
- Dashboard Most recent order now falls back to descending Creator record ID,
  so drafts without an audit timestamp no longer sort alphabetically.

### Editorial Command Center follow-up

- Packaged v0.5.3 with a redesigned dashboard that avoids a second sidebar and
  instead exposes Today, Articles, Reviews, Publishing, and Archive as a sticky
  horizontal workspace navigation.
- Today is role-aware and summarizes work needing attention; the other
  workspaces use focused full-width operational lists with contextual search,
  filters, and scope controls.
- Removed duplicate Published, Retracted, Trash, and review-history panels from
  unrelated views. Archive is now the single recoverable home for removed
  drafts.
- Packaged v0.5.4 with clearer live-refresh status, active publishing polling
  slowed from 5 seconds to 30 seconds, idle dashboard polling set to 1 minute,
  and an admin-only Creator development reset guarded by the exact phrase
  `RESET TEST CONTENT`.

The GeneDrift Editorial Platform was re-created/imported under the Creator owner
`piyugene02` and the main Article Workspace flow was repaired after several
account-migration issues.

Known-good Creator app URL:

```text
https://creatorapp.zoho.in/piyugene02/genedrift-editorial-platform#Article_Workspace
```

Avoid old-owner URLs such as:

```text
https://creatorapp.zoho.in/opensourceindia22/genedrift-editorial-platform#Article_Workspace
```

## Current known-good artifacts

- Creator widget:
  `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.1-taxonomy-fix.zip`
  - SHA-256:
    `1068232c6d529c4df7a0c573d9b58e699321ccc83149f0837e684362bb4634bd`
- Catalyst AppSail:
  `genedrift-catalyst-appsail-dev-v0.4.2.zip`
  - SHA-256:
    `1834f1924a953c21919d242e79f1d0bdaf847bd3abe35415697dd829afc9c3ff`

## Latest local workflow-polish candidate

- Creator widget:
  `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.4-refresh-reset.zip`
- SHA-256:
  `091f7bff1877b963b71ef1b5bc937840b10ea10dfe56dd7eb98af073a65b4d42`
- Installation guide:
  `creator/WORKFLOW_POLISH_SETUP.md`
- Matching Catalyst AppSail package for Caption-only inline rendering:
  `genedrift-catalyst-appsail-dev-v0.4.3-media-caption.zip`
  - SHA-256:
    `cdd7eb7e45e2a25ab4214bbdda71a5b94ce386171ff4d588f25e25070eec6e4b`
- Verification: TypeScript, production build, ZET validation, ZIP integrity,
  mock dashboard/workspace visual checks, submission preflight, workflow
  timeline, and browser console checks pass locally.
- Live status update on 2026-09-05: the user uploaded v0.5.4 to the migrated
  Creator app, added the reset Custom API, and verified the dashboard reset
  returns the app to a clean zero-count state. A full post-reset role smoke
  matrix is still pending.

The candidate includes the workflow-polish features plus the Editorial Command
Center, reliable Caption
persistence, simplified image metadata, direct inline-image controls,
reversible cover removal, newest-first draft ordering, clearer live-refresh
status, and a confirmation-gated Creator test-content reset. The reset keeps
employees, roles, policies, taxonomy, and settings, and does not delete
Catalyst immutable/public-site storage.

The first live v0.5.0 smoke test exposed Creator code 3001 when a newly created
tag was applied through the Widget SDK. v0.5.1 replaces that write with the
guarded `save_article_taxonomy` Custom API, which converts string record IDs into
the Number list required by Creator's multi-select lookup. Live save/reload and
publication verification of that correction now pass.

## Verified working after migration

- Article Workspace dashboard loads under `piyugene02`.
- New article creation works.
- Existing article open-in-place works with `articleId`.
- Draft save works after v0.4.16 widget verification fix.
- Submit for review works.
- Review/approval flow works.
- Catalyst AppSail accepts publish handoff.
- Catalyst can refresh Creator OAuth using the new `piyugene02` Self Client
  refresh token.
- Publication request succeeded.
- Published blog is visible on the public frontend.

## Main issues resolved

1. Wrong owner URL
   - Some paths still used `opensourceindia22`.
   - Correct owner for the migrated app is `piyugene02`.

2. Page/widget confusion
   - Development-environment URLs and duplicate page attempts caused Page Not
     Found/Broken Widget states.
   - The working route is the production Creator app URL with
     `#Article_Workspace`.

3. Custom API migration
   - Custom APIs had to be recreated manually in the new Creator account.
   - They now point to `https://www.zohoapis.in/creator/custom/piyugene02/...`.

4. OAuth refresh-token confusion
   - A Self Client generated code is not a refresh token.
   - The code must be exchanged once using
     `https://accounts.zoho.in/oauth/v2/token`.
   - The resulting refresh token goes into Catalyst
     `CREATOR_OAUTH_REFRESH_TOKEN`.

5. Catalyst connector confusion
   - `CREATOR_CONNECTION_NAME` must be blank/deleted for the current direct OAuth
     path.

6. Draft verification regression
   - v0.4.15 improved loading but introduced false save verification failures.
   - v0.4.16 fixes that and is the current widget to upload.

## Current Catalyst configuration shape

Current health/config check showed the expected Creator target:

```text
creator.accountOwner = piyugene02
creator.appLinkName = genedrift-editorial-platform
creator.apiBaseUrl = https://www.zohoapis.in
creator.environment = production
creator.validateUrl = https://www.zohoapis.in/creator/custom/piyugene02/validate_catalyst_publication_request
creator.callbackUrl = https://www.zohoapis.in/creator/custom/piyugene02/record_catalyst_publication_result
creatorOAuthClientIdPresent = true
creatorOAuthClientSecretPresent = true
creatorOAuthRefreshTokenPresent = true
creatorStaticOAuthTokenPresent = false
```

Do not store OAuth secrets in docs or Creator variables. Keep them only in
Catalyst environment variables.

## Migration guide

For future client transfer, use:

```text
docs/CREATOR_ACCOUNT_MIGRATION_RUNBOOK.md
```

It now contains the short step-by-step process that should be followed instead
of rediscovering the migration issues manually.

## Remaining work

- Separately role-test the live v0.5.4 workflow-polish install by following
  `creator/WORKFLOW_POLISH_SETUP.md`.
- Rotate any OAuth client secrets/refresh tokens that were exposed during manual
  debugging.
- Capture one clean final evidence packet for the migrated `piyugene02` app:
  Creator publish row, Catalyst request row, and frontend article URL.
- When ready for client transfer, follow the migration runbook exactly and use
  fresh client-owned Creator, Catalyst, OAuth, secrets, Vercel/Git, DNS, users,
  roles, and schedules.
- Continue Phase 2 website/design work only after deciding whether to proceed in
  this same task or start a clean new chat.

## Best resume order

1. `docs/CURRENT_CHECKPOINT_2026-09-05.md`
2. `docs/CURRENT_CHECKPOINT_2026-09-04.md`
3. `docs/CREATOR_ACCOUNT_MIGRATION_RUNBOOK.md`
4. `docs/HANDOFF.md`
5. `docs/STATUS.md`
6. `creator/CATALYST_PUBLISHING_SETUP.md`
7. `catalyst/README.md`
8. `docs/PHASE_2_WEBSITE_REVAMP_CLIENT_BASELINE.md`
9. `docs/WEBSITE_CONTENT_ARCHITECTURE_PLAN.md`
