# GeneDrift Frontend Hosting and Client Migration Guide

Status: beginner-friendly operator guide for the current Development system.
Production promotion is still blocked by the full Development matrix, fresh
Creator DS export, and negative role tests.

## 1. The simple mental model

GeneDrift has three separate applications. They are connected, but each has one
job:

```text
Editors and publishers
        |
        v
Zoho Creator  -- signed private jobs -->  Catalyst AppSail
     ^                                      |
     |------- OAuth callbacks --------------|
                                            |
                              public read API + media
                                            |
                                            v
                                      Vercel / Next.js
                                            |
                                            v
                                         Readers
```

- **Creator is the editorial control plane.** It owns drafts, review, approval,
  roles, publication jobs, and audit events.
- **Catalyst is the publication and serving plane.** It validates approved jobs,
  creates immutable public content/media, schedules work, processes retractions,
  and exposes the public read API.
- **Vercel is only the public website.** It reads the Catalyst public API. It
  must never receive Creator OAuth credentials, signing secrets, draft data, or
  direct Creator access.

If something changes, update the system that points **to** it. For example, when
the Catalyst URL changes, update Creator and Vercel. When only the public domain
changes, update Vercel and Catalyst; Creator does not need the public domain.

## 2. Recommended account ownership

For a client deployment, the client should own:

- the Zoho organization and Creator application;
- the Catalyst organization/project in the matching Zoho data center;
- the Zoho API Console OAuth client;
- the GitHub/GitLab/Bitbucket repository;
- the Vercel team/project; and
- the domain and DNS account.

You should be invited as an administrator or developer instead of creating the
permanent system under a personal account. Store recovery details and billing
ownership with the client. Use separate named user accounts; do not share one
password.

## 3. Environments: keep the lanes separate

Use two complete lanes:

| Lane | Creator | Catalyst | Vercel | Purpose |
| --- | --- | --- | --- | --- |
| Development/Preview | Creator Development | Catalyst Development | Vercel Preview or staging domain | Safe testing |
| Production | Creator Production | Catalyst Production | Vercel Production/custom domain | Real readers |

Never point a Production frontend at Development Catalyst, or Production Creator
at Development AppSail. Use different buckets, tables, OAuth grants, and secrets
for each lane.

## 4. Host the current frontend on Vercel

### A. Prepare the repository

The current repository has not yet been committed. Before Vercel:

1. Create a private repository owned by the client or the client's organization.
2. Create a checkpoint commit containing the reviewed GeneDrift source.
3. Push it to the private repository.
4. Confirm `.env.local`, tokens, secrets, Creator exports containing sensitive
   data, `node_modules`, and `.next` are not committed.
5. Keep `frontend/.env.example`; it contains names/placeholders, not secrets.

Git-based deployment is recommended because every branch can receive a safe
Preview URL and merging to `main` can create the Production deployment.

### B. Import it into Vercel

1. Sign in to the client's Vercel team.
2. Select **Add New → Project**.
3. Import the client's GeneDrift Git repository.
4. Set **Root Directory** to `frontend`.
5. Confirm Vercel detects **Next.js**.
6. Leave the normal Next.js build command (`npm run build`) and output settings
   at their detected defaults.
7. Add the two variables below before the first real deployment.

### C. Vercel environment variables

| Variable | Example | Where | Secret? |
| --- | --- | --- | --- |
| `GENEDRIFT_PUBLIC_API_BASE_URL` | `https://CLIENT-APPSAIL-URL` | Preview and Production, with the correct lane's URL | No, server-only configuration |
| `NEXT_PUBLIC_SITE_URL` | `https://insights.client.com` | Preview/staging and Production, with the correct site origin | Public by design |

Rules:

- Do not add a trailing slash.
- Preview should point to Catalyst Development.
- Production should eventually point to Catalyst Production.
- `NEXT_PUBLIC_SITE_URL` must be the canonical origin readers use. For early
  preview work, use the stable Vercel project alias or a staging subdomain.
- Never place `PUBLISHING_HMAC_SECRET`, `INTERNAL_JOB_SECRET`, or Creator OAuth
  credentials in Vercel.
- After changing a Vercel environment variable, create a **new deployment** or
  redeploy. Existing deployments retain their old values.

### D. First Preview deployment

After deployment, test:

1. `/` loads the latest published articles.
2. `/insights` searches, filters, and paginates.
3. A published `/insights/{slug}` loads.
4. A missing slug shows the 404 page.
5. A retracted slug shows the retraction notice and is `noindex`.
6. `/robots.txt` and `/sitemap.xml` use the intended site origin.
7. Mobile width, keyboard navigation, and long titles work.
8. Vercel logs contain no API or rendering errors.

The Catalyst API already returns true HTTP 410 for retracted slugs. The current
Next.js page renders a safe `noindex` retraction notice but returns HTTP 200.
Before public launch, add and verify a fast Vercel/Next.js proxy or hosting rule
that returns page-level 410 without performing a slow full-content fetch.

### E. Add the client's domain

1. In the Vercel project, open **Settings → Domains**.
2. Add the chosen domain, for example `insights.client.com`.
3. Copy the exact DNS record Vercel displays into the client's DNS provider.
   A subdomain normally uses a CNAME; an apex domain normally uses an A record.
4. Wait for Vercel to show the domain as verified and provision HTTPS.
5. Choose one canonical host. Redirect the alternate `www`/apex form rather
   than serving duplicate pages from both.
6. Change Production `NEXT_PUBLIC_SITE_URL` to the final `https://` domain and
   redeploy.
7. Set Production Catalyst `PUBLIC_SITE_BASE_URL` to that exact same origin and
   redeploy AppSail so its RSS/sitemap links agree.

Always copy the DNS values shown by the Vercel project; do not rely on an old
value from another project.

## 5. Where every connection value lives

### Creator: only two integration values

Creator's `Publishing` application-variable group contains:

| Creator variable | Must equal |
| --- | --- |
| `Catalyst_Base_URL` | The AppSail URL for the same environment, without trailing slash |
| `Signing_Secret` | Catalyst `PUBLISHING_HMAC_SECRET` for the same environment |

Creator must not store the OAuth client secret, refresh token, internal job
secret, bucket credentials, or Vercel settings.

### Catalyst: the private integration hub

Add the variables from `catalyst/.env.example` to each Catalyst environment.
They fall into these groups:

**Shared security**

- `PUBLISHING_HMAC_SECRET`: matches Creator `Signing_Secret`; minimum 32
  characters.
- `INTERNAL_JOB_SECRET`: private AppSail job-target secret; minimum 32
  characters and different from the signing secret.

The Development internal secret was exposed during live debugging and must be
rotated before any client or Production use. Rotate both secrets when moving to
a client-owned environment; never copy current test secrets.

**Catalyst resources**

- `GD_STRATUS_PRIVATE_BUCKET`
- `GD_STRATUS_PUBLIC_BUCKET`
- `GD_STRATUS_PUBLIC_BASE_URL`
- `GD_JOBPOOL_NAME`
- `GD_APPSAIL_NAME`
- `GD_APPSAIL_BASE_URL`
- `GD_APPSAIL_JOB_PATH`
- `GD_APPSAIL_CALLBACK_PATH`
- `PUBLIC_SITE_BASE_URL`

Use the exact names/URLs from the same Catalyst project and environment.

**Creator identity and endpoints**

- `CREATOR_CALLBACK_URL`
- `CREATOR_VALIDATE_URL`
- `CREATOR_API_BASE_URL`
- `CREATOR_ACCOUNT_OWNER`
- `CREATOR_APP_LINK_NAME`
- `CREATOR_MEDIA_REPORT_LINK_NAME`
- `CREATOR_MEDIA_FILE_FIELD_LINK_NAME`
- `CREATOR_ENVIRONMENT`

Custom API URLs and account owner names normally change when moving to a new
Creator owner/account. Copy them from the client's live Creator configuration;
do not edit the old URL by guessing.

**Creator OAuth, stored only in Catalyst**

- `CREATOR_OAUTH_CLIENT_ID`
- `CREATOR_OAUTH_CLIENT_SECRET`
- `CREATOR_OAUTH_REFRESH_TOKEN`
- `CREATOR_OAUTH_TOKEN_URL`
- `CREATOR_CONNECTION_NAME`

Use a client-owned OAuth client in the correct Zoho data center. Grant only the
required Creator Custom API execute and report-read scopes. Do not use the
short-lived `CREATOR_OAUTH_TOKEN` fallback in Production.

**Retry and safety settings**

Leave the documented defaults unchanged unless a measured production issue
requires a reviewed change: callback/publish attempts and delays, clock skew,
lease duration, pointer CAS attempts, and maximum media bytes.

### Vercel: public read connection only

Vercel stores only the Catalyst public API base and public site origin. It does
not need Creator details, OAuth, Stratus bucket credentials, or signing secrets.

## 6. Moving from your accounts to the client's accounts

Do this as a controlled new installation, not by changing random values in the
working test environment.

### Phase 1 — inventory and ownership

- Record current non-secret link names, table/column schemas, bucket policies,
  AppSail/Job Pool names, domains, and environment mapping.
- Export a fresh Creator DS and record its checksum.
- Record which setup items are manual: roles/profiles, data sharing, Custom APIs,
  application variables, OAuth consent, Catalyst tables/buckets, AppSail, Job
  Pool, Vercel variables, and DNS.
- Decide whether the client starts with clean content. For the present prototype,
  a clean client application is safer than moving test records.

If real content must move later, migrate records separately while preserving
Article/Revision/Media UUIDs and verifying file fields. Never assume a DS schema
export is a complete data, permission, connection, and secret backup.

### Phase 2 — client Creator Development

1. Import/validate the current DS in the client's Creator account.
2. Confirm the application owner and app link name.
3. Recreate and verify roles, profiles, sharing rules, application variables,
   Custom APIs, schedules, and widget installation.
4. Confirm the exact report/field link names required by AppSail.
5. Keep the old local publishing workflow disabled.
6. Export a fresh client DS after setup and run the DS/role checks.

### Phase 3 — client Catalyst Development

1. Create the client-owned Catalyst project in the same data center as Creator.
2. Recreate all Data Store tables/columns and their permissions.
3. Create separate private and public Stratus buckets with the documented
   policies.
4. Create AppSail and the Job Pool; platform retries remain zero.
5. Create new client-owned OAuth credentials and consent.
6. Add every Catalyst Development environment variable with the client's exact
   Creator/resource values and new secrets.
7. Deploy AppSail and confirm `/health` reports `ok: true` and the expected
   version/configuration-presence flags.

### Phase 4 — connect Creator and Catalyst

1. Put the new Development AppSail URL in Creator `Catalyst_Base_URL`.
2. Put the new shared signing secret in both Creator `Signing_Secret` and
   Catalyst `PUBLISHING_HMAC_SECRET`.
3. Put the client's callback/preflight Custom API URLs and OAuth credentials in
   Catalyst.
4. Test immediate publish, schedule, callback, media publication, duplicate
   request, and retract.
5. Confirm Creator audit events and Catalyst request/version/pointer/outbox rows.

Do not proceed if a job is merely Accepted. Require the final Succeeded state,
immutable public object, current pointer, delivered callback, and Creator state.

### Phase 5 — connect Vercel Preview

1. Import the client-owned Git repository with `frontend` as Root Directory.
2. Point Preview `GENEDRIFT_PUBLIC_API_BASE_URL` at client Catalyst Development.
3. Set the stable Preview/staging `NEXT_PUBLIC_SITE_URL`.
4. Set Catalyst Development `PUBLIC_SITE_BASE_URL` to that same preview origin
   if testing Catalyst RSS/sitemap.
5. Deploy and run the frontend Preview checks.

### Phase 6 — build Production separately

Repeat the provisioning in Creator Production, Catalyst Production, and Vercel
Production using new Production buckets, tables, OAuth grant, URLs, and secrets.
Run the full matrix again with disposable Production test articles. Only then:

1. point the custom domain to Vercel Production;
2. set Vercel Production `NEXT_PUBLIC_SITE_URL` to the custom domain;
3. set Catalyst Production `PUBLIC_SITE_BASE_URL` to the same domain;
4. redeploy both systems;
5. retract/remove launch test articles; and
6. verify the public list, detail, media, sitemap, RSS, 404, and 410 behavior.

## 7. What to update when one piece changes

| Change | Update | Then test |
| --- | --- | --- |
| Creator owner/account/app | Catalyst Creator URLs, owner/app/report fields, OAuth credentials; recreate Creator variables/APIs/permissions | preflight, callback, media download, full publish |
| Catalyst project/AppSail URL | Creator `Catalyst_Base_URL`; Vercel `GENEDRIFT_PUBLIC_API_BASE_URL`; Catalyst `GD_APPSAIL_BASE_URL` | health, publish, public list/detail |
| Signing secret | Creator `Signing_Secret` and Catalyst `PUBLISHING_HMAC_SECRET` together | one signed handoff and callback |
| Internal job secret | Catalyst environment and every Job Pool/cron target header that uses it | immediate, scheduled, and retry job |
| OAuth client/token | Catalyst OAuth variables only | preflight, callback, media download |
| Public bucket | Catalyst bucket name/base URL; verify permissions | article JSON and media URL |
| Public website domain | Vercel `NEXT_PUBLIC_SITE_URL`; Catalyst `PUBLIC_SITE_BASE_URL`; DNS | canonical metadata, robots, sitemap, RSS |
| Vercel API target | Vercel `GENEDRIFT_PUBLIC_API_BASE_URL` | list/detail/retraction; redeploy Vercel |
| Creator schema/link name | Deluge/custom API/report setup and matching Catalyst identifier variable | health config, preflight, callback |

## 8. Safe change procedure

For every URL, token, or secret change:

1. Change Development/Preview first.
2. Keep the old credential active while installing the new one when possible.
3. Update both ends of a shared value before testing.
4. Redeploy the service whose environment variables changed.
5. Run one focused smoke test and one full workflow test.
6. Record the date, operator, environment, deployment version, and result.
7. Revoke the old credential only after the new path succeeds.
8. Repeat separately in Production.

Never paste secret values into documentation, Git, screenshots, issue trackers,
or chat. Record only the variable name, owner, environment, creation/rotation
date, and where the secret is securely stored.

## 9. Fast troubleshooting map

| Symptom | Check first |
| --- | --- |
| Vercel build fails | Root Directory is `frontend`; build log; Node/Next dependency install |
| Website loads but has no articles | Vercel API base points to the correct AppSail environment; Catalyst list endpoint |
| Old API/domain remains after an edit | Redeploy; Vercel variable changes do not change old deployments |
| Creator says handoff rejected | Creator Catalyst URL/signing secret; AppSail logs; matching Catalyst environment |
| AppSail cannot call Creator | OAuth data center, client/refresh token, Custom API URL, owner/app link names |
| Media fails | media report/file field names, report permission, checksum/type/size/dimensions |
| Schedule accepted but never completes | Job Pool target, internal secret header, exact timezone, AppSail worker logs |
| Callback not reflected in Creator | callback URL/OAuth, outbox status, callback audit event, state conflict |
| Retracted article still appears | Catalyst pointer serving status, public API 410/list removal, frontend deployment/cache |
| Sitemap/RSS returns 503 or wrong links | Catalyst `PUBLIC_SITE_BASE_URL` and redeployment |
| Custom domain fails | Vercel domain verification and the exact DNS record shown for that project |

## 10. Final handoff packet for the client

Give the client a secure inventory containing:

- owners/admins for Creator, Catalyst, OAuth, Git, Vercel, domain, and billing;
- environment map and non-secret project/resource identifiers;
- where each secret is stored and its last rotation date, without secret values;
- Git repository and production branch;
- Vercel project, custom domain, and environment-variable names;
- Creator DS export/checksum plus completed role matrix;
- Catalyst schema/bucket/job/AppSail setup record;
- Development and Production deployment versions;
- promotion-test evidence and known limitations;
- rollback procedure; and
- the ordered verification checklist.

Keep `docs/CREATOR_CATALYST_INTEGRATION_CHECKLIST.md` as the detailed technical
test gate. This guide explains ownership and wiring; that checklist decides
whether the integration is actually verified.

## Official Vercel references

- [Deploying Git repositories](https://vercel.com/docs/git)
- [Vercel environments](https://vercel.com/docs/deployments/environments)
- [Environment variables](https://vercel.com/docs/environment-variables)
- [Setting up a custom domain](https://vercel.com/docs/domains/set-up-custom-domain)
- [Rotating environment variables safely](https://vercel.com/docs/environment-variables/rotating-secrets)
