# Creator Account Migration Runbook

Use this when moving GeneDrift from one Zoho Creator account to another account,
including the final client transfer. Keep this runbook short, exact, and
sequential. The safest migration is a clean install plus verification, not
patching random values after errors appear.

Last validated: 2026-09-05, after uploading v0.5.4 and verifying the
admin reset in Creator owner `piyugene02`.

## Migration rule

Never migrate secrets or old account-specific IDs.

Recreate them in the new owner account, wire both ends, then prove the flow with
one complete article publish.

## Current known-good deployable artifacts

- Creator widget:
  `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.4-refresh-reset.zip`
  - SHA-256:
    `091f7bff1877b963b71ef1b5bc937840b10ea10dfe56dd7eb98af073a65b4d42`
- Catalyst AppSail:
  `genedrift-catalyst-appsail-dev-v0.4.2.zip`
  - SHA-256:
    `1834f1924a953c21919d242e79f1d0bdaf847bd3abe35415697dd829afc9c3ff`

## What moves through DS import

- Forms, reports, fields, pages, menus, Deluge functions, and most app
  structure.
- Seed records if the DS/export includes them and they are intentionally kept:
  categories, tags, approval policies, demo employees, and role assignments.

## What must be recreated manually

- Creator users/app sharing.
- Employee-to-login mapping and editorial role records.
- Widgets and page-widget placement.
- Creator Custom APIs under Microservices.
- Creator app variables.
- Zoho OAuth client/grant/refresh token.
- Catalyst environment variables that reference Creator owner/account URLs.
- Schedules and any environment-specific settings.

Do not reuse old record IDs, file URLs, OAuth grants, or owner URLs.

## Step 1 - Import the Creator app

1. In the target Zoho account, import the `.ds` file as a new app.
2. Confirm the target owner and app link name. Example:
   - Owner: `piyugene02`
   - App link: `genedrift-editorial-platform`
3. Open the production app URL, not the development-environment URL:
   - Correct pattern:
     `https://creatorapp.zoho.in/<owner>/<app-link>#Article_Workspace`
   - Example:
     `https://creatorapp.zoho.in/piyugene02/genedrift-editorial-platform#Article_Workspace`
4. Do not use old-owner URLs such as `opensourceindia22` after migration.

## Step 2 - Recreate Creator users and roles

1. Add the real Zoho users to the Creator app.
2. Create or update the matching `Employees` records.
3. Make sure each employee record maps to the exact Zoho login email.
4. Add active editorial role assignments:
   - Author
   - Reviewer
   - Publisher
   - Editorial Admin / CEO as needed
5. Confirm the dashboard header shows the expected current role for each user.

Creator app access alone is not enough. The widget depends on the internal
employee and editorial role records.

## Step 3 - Add approval policies

Create at least these two records:

| Policy key | Policy name | Required approvals | Distinct reviewers | Default |
| --- | --- | ---: | --- | --- |
| `STANDARD` | Standard Review | `1` | `true` | `true` |
| `REGULATED` | Regulated Review | `2` or higher | `true` | `false` |

For regulated review with 3+ reviewers, set `Required Approvals` to `3`, `4`,
etc. The workflow counts distinct approval decisions. It is not limited to two
unless the policy record says `2`.

## Step 4 - Upload the widget correctly

1. Go to Creator app builder -> Settings -> Widgets.
2. Upload:
   `editor-widget/genedrift-editor-widget-workflow-polish-v0.5.4-refresh-reset.zip`
3. Use internal hosting.
4. Use index file:
   `/index.html`
5. Create or open the page named `Article_Workspace`.
6. Place the custom widget on that page.
7. Save/Done.
8. Access the app with:
   `https://creatorapp.zoho.in/<owner>/<app-link>#Article_Workspace`

If the app shows only "Page Not Found", first check the page link name and URL
owner. If the design page shows "Broken widget", re-upload or reselect the
widget. Do not create multiple random duplicate pages unless the original page
is truly missing.

## Step 5 - Recreate Creator Custom APIs

In Creator -> Microservices -> Custom API, recreate each required API with the
same function and settings.

Required common settings:

- Method: `POST`
- Authentication: `OAuth2`
- Argument type: `Key and Value`
- Request body content type: `application/json`
- User scope: all users, unless a narrower app rule is intentionally configured

Minimum APIs required by the current flow include:

- `submit_article_for_review`
- `claim_review_assignment`
- `add_review_comment`
- `record_review_decision`
- `publish_approved_article`
- `schedule_approved_article`
- `validate_catalyst_publication_request`
- `record_catalyst_publication_result`
- `retract_published_article`, if retraction is enabled
- `archive_draft_article`
- `restore_archived_article`
- `create_editorial_taxonomy_term`
- `save_article_taxonomy`
- `update_media_metadata`
- `reset_editorial_test_content`

Copy the generated endpoint URLs. They must contain the new owner:

```text
https://www.zohoapis.in/creator/custom/<new-owner>/<api-link-name>
```

Example:

```text
https://www.zohoapis.in/creator/custom/piyugene02/submit_article_for_review
```

## Step 6 - Set Creator app variables

In Creator, set:

- `Publishing.Catalyst_Base_URL`
  - AppSail base URL, no trailing slash.
- `Publishing.Signing_Secret`
  - Must exactly match Catalyst `PUBLISHING_HMAC_SECRET`.

Do not store OAuth client secrets or refresh tokens in Creator.

## Step 7 - Generate the Zoho OAuth refresh token

This is the step that caused the most friction. The Self Client code is not the
refresh token. It is a short-lived one-time code. Generate it, then immediately
exchange it.

1. Go to [Zoho API Console](https://api-console.zoho.in/).
2. Use Self Client in the same India data center.
3. Generate a code with exactly these scopes:

```text
ZohoCreator.customapi.EXECUTE,ZohoCreator.report.READ
```

4. Choose 10 minutes.
5. Copy the generated JSON.
6. Replace the JSON object in this command with the generated values and run it
   once:

```bash
node -e 'const fs=require("fs"); const {execFileSync}=require("child_process"); const j={"scope":["ZohoCreator.customapi.EXECUTE","ZohoCreator.report.READ"],"expiry_time":0,"client_id":"1000.x","client_secret":"x","code":"1000.x.x","grant_type":"authorization_code"}; const out=execFileSync("curl",["-sS","-X","POST","https://accounts.zoho.in/oauth/v2/token","--data-urlencode",`grant_type=${j.grant_type}`,"--data-urlencode",`client_id=${j.client_id}`,"--data-urlencode",`client_secret=${j.client_secret}`,"--data-urlencode",`code=${j.code}`],{encoding:"utf8"}); const body=JSON.parse(out); if(!body.refresh_token){console.error(JSON.stringify(body,null,2)); process.exit(1);} fs.writeFileSync("/private/tmp/zoho-refresh-token.txt",body.refresh_token); execFileSync("pbcopy",{input:body.refresh_token}); console.log(body.refresh_token);'
```

Expected result:

- The full refresh token prints in terminal.
- The same token is saved to `/private/tmp/zoho-refresh-token.txt`.
- The same token is copied to clipboard.
- It starts with `1000.`

If Zoho returns `invalid_code`, generate a fresh Self Client code. A code expires
quickly and can be used only once.

## Step 8 - Update Catalyst environment variables

In Catalyst AppSail -> Configuration -> Environment Variables, update these
Creator-specific values:

```text
CREATOR_ACCOUNT_OWNER=<new-owner>
CREATOR_APP_LINK_NAME=genedrift-editorial-platform
CREATOR_ENVIRONMENT=production
CREATOR_API_BASE_URL=https://www.zohoapis.in
CREATOR_OAUTH_TOKEN_URL=https://accounts.zoho.in/oauth/v2/token
CREATOR_VALIDATE_URL=https://www.zohoapis.in/creator/custom/<new-owner>/validate_catalyst_publication_request
CREATOR_CALLBACK_URL=https://www.zohoapis.in/creator/custom/<new-owner>/record_catalyst_publication_result
CREATOR_MEDIA_REPORT_LINK_NAME=Media_Assets_Report
CREATOR_MEDIA_FILE_FIELD_LINK_NAME=Draft_File
CREATOR_OAUTH_CLIENT_ID=<new-self-client-id>
CREATOR_OAUTH_CLIENT_SECRET=<new-self-client-secret>
CREATOR_OAUTH_REFRESH_TOKEN=<real-refresh-token-from-step-7>
```

Keep these Catalyst-side values as-is unless the Catalyst project is also being
moved:

```text
CATALYST_APPSAIL_BASE_URL
CATALYST_STRATUS_PRIVATE_BUCKET
CATALYST_STRATUS_PUBLIC_BUCKET
CATALYST_STRATUS_PUBLIC_BASE_URL
PUBLISHING_HMAC_SECRET
INTERNAL_JOB_SECRET
GD_JOBPOOL_NAME
```

Important:

```text
CREATOR_CONNECTION_NAME
```

Leave this blank or delete it for the current direct OAuth path. If it is set
incorrectly, Catalyst may fail with OAuth connector/access-token errors.

## Step 9 - Redeploy Catalyst AppSail

After any Catalyst environment-variable change, redeploy AppSail.

Use:

- Build file:
  `genedrift-catalyst-appsail-dev-v0.4.2.zip`
- Stack:
  Node 24
- Startup command:
  `npm start`

After deployment, open the AppSail health/config URL and confirm:

- `ok: true`
- `creator.accountOwner` is the new owner.
- `creator.appLinkName` is correct.
- `creator.validateUrl` and `creator.callbackUrl` contain the new owner.
- `creatorOAuthClientIdPresent: true`
- `creatorOAuthClientSecretPresent: true`
- `creatorOAuthRefreshTokenPresent: true`
- `creatorStaticOAuthTokenPresent: false`

## Step 10 - Final smoke test

Run this exact workflow in the target account:

1. Open:
   `https://creatorapp.zoho.in/<owner>/<app-link>#Article_Workspace`
2. Create a new article.
3. Add body text, category, excerpt, SEO title, and cover image if needed.
4. Save draft.
5. Submit for Standard Review.
6. Approve as reviewer or admin.
7. Publish as publisher/admin.
8. Confirm the article appears on the public frontend.

## Step 11 - Debug with Catalyst ZCQL, not browser find

When Creator shows a publication row with an idempotency key, search Catalyst
Data Store using ZCQL. Do not use browser Cmd+F on the Catalyst UI.

Request query:

```sql
SELECT Request_ID, Idempotency_Key, Action, Status, Attempt_Count, Next_Attempt_At, Last_Error_Code, Last_Error_Message, Created_At, Updated_At
FROM GD_Publication_Requests
WHERE Idempotency_Key = 'PASTE_IDEMPOTENCY_KEY_HERE'
```

Attempts query:

```sql
SELECT *
FROM GD_Publication_Attempts
WHERE Request_ID = 'PASTE_REQUEST_ID_HERE'
```

Good result:

```text
Status = Succeeded
Last_Error_Code = blank
Last_Error_Message = blank
```

Common failures:

| Error | Meaning | Fix |
| --- | --- | --- |
| `Creator OAuth refresh failed with HTTP 400` | Refresh token/client/DC/owner mismatch, old token, revoked token, or wrong token URL | Generate a fresh Self Client code in India, exchange it for a refresh token, update Catalyst, redeploy |
| `Creator OAuth refresh failed with HTTP 200` | Catalyst got a JSON response but no `access_token`; usually a temporary Self Client code was pasted as the refresh token | Exchange the code properly and paste the returned refresh token |
| `access_token cannot be null or undefined` | Bad `CREATOR_CONNECTION_NAME` connector path | Blank/delete `CREATOR_CONNECTION_NAME`, use direct OAuth vars, redeploy |
| `No workspace named appfiles found` | Catalyst/widget still pointed at old workspace/account or old app-specific setup | Confirm owner/app URLs, widget package, Creator variables, and Catalyst env |
| Widget says current workspace cannot be detected | Page/widget URL or owner detection is wrong | Use production app URL with `#Article_Workspace`; ensure latest widget is uploaded |
| Page Not Found | Wrong page link name or wrong owner URL | Confirm `Article_Workspace` page exists and URL owner is correct |

## Done criteria

Migration is not done when the app imports. It is done only when:

- Dashboard opens in the new account.
- Draft save works.
- Submit for review works.
- Review approval works.
- Publish succeeds in Catalyst.
- Public frontend shows the new article.
- Catalyst request row shows `Succeeded`.
