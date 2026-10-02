# GeneDrift Deployment and Migration Record

Copy this file for each environment/cutover. Store secret **references**, never secret values.

## Record identity

| Item | Value |
|---|---|
| Environment | `<development / staging / production>` |
| Record owner | `<name and team>` |
| Change/cutover ID | `<ticket or release>` |
| Start time and timezone | `<ISO timestamp>` |
| Completion time and timezone | `<ISO timestamp>` |
| Client sign-off owner | `<name>` |
| Status | `<planned / in progress / accepted / rolled back>` |

## Architecture decision

| Decision | Recorded value |
|---|---|
| Catalyst topology | `<A: two projects / B: one project two services / C: combined service / D: gateway>` |
| Reason | `<business and technical reason>` |
| Public API hostname(s) | `<hostnames>` |
| Frontend implementation/host | `<repository, framework, provider>` |
| Zoho data centre | `<region>` |
| Article URL rule | `<example and content-type/category rule>` |
| History migration strategy | `<fresh republish / historical copy / hybrid>` |
| Public-object retention | `<policy>` |
| RPO / RTO | `<agreed targets>` |
| Rollback decision owner | `<name/role>` |

## Ownership

| System | Client owner | Technical owner | Incident contact |
|---|---|---|---|
| Source repositories |  |  |  |
| Editorial Creator |  |  |  |
| Website Creator |  |  |  |
| Editorial Catalyst |  |  |  |
| Website Catalyst |  |  |  |
| Frontend/Hostinger |  |  |  |
| DNS/domain/email records |  |  |  |
| Secrets/identity |  |  |  |
| Content and approvals |  |  |  |

## Source and artifact manifest

| Component | Repository/commit | Artifact path/name | SHA-256 | Built by/at | Installed target/at |
|---|---|---|---|---|---|
| Editorial Creator DS |  |  |  |  |  |
| Editorial widget |  |  |  |  |  |
| Editorial AppSail |  |  |  |  |  |
| Website Creator DS/config |  |  |  |  |  |
| Website widget |  |  |  |  |  |
| Website AppSail |  |  |  |  |  |
| Public frontend |  |  |  |  |  |

Attach artifact-content scans showing that no `.env`, credentials, tokens, keys or debug dumps were packaged.

## Creator target inventory

### Editorial Creator

| Item | Value/evidence |
|---|---|
| Account owner and app link name |  |
| Application URL |  |
| DS export/import date and hash |  |
| Widget name/index page/installed hash |  |
| Custom API names and scopes |  |
| Connection names and owners |  |
| Application variable names | `Catalyst_Base_URL`, `Signing_Secret` plus approved additions |
| Permission profiles/sharing |  |
| Schedules and timezone |  |
| Employee/team directory decision |  |
| Role matrix evidence |  |

### Website Creator

| Item | Value/evidence |
|---|---|
| Account owner and app link name |  |
| Application URL |  |
| Schema/import date and hash |  |
| Widget name/index page/installed hash |  |
| Custom API names |  |
| Application variable names | `Catalyst_Base_URL`, `Signing_Secret`, `Website_Base_URL`, `Revalidate_Secret` |
| Permission profiles/sharing |  |
| Country-services status | `<on hold / approved>` |
| Adverse-event status/owner |  |

## Record and file reconciliation

Record old-to-new Creator IDs separately in an encrypted migration map. Keep IDs as strings.

| Form/data set | Source records | Target records | Source files | Target files | Hash/relationship result | Evidence |
|---|---:|---:|---:|---:|---|---|
| Editorial forms |  |  |  |  |  |  |
| Article revision JSON |  |  |  |  |  |  |
| Media assets |  |  |  |  |  |  |
| Website pages/sections |  |  |  |  |  |  |
| Website collections |  |  |  |  |  |  |

Unresolved relationship or missing-file list: `<secure attachment>`

## Catalyst inventory

### Editorial project/service

| Item | Value/evidence |
|---|---|
| Project/environment/AppSail name |  |
| Base URL |  |
| Private/public bucket names |  |
| Data Store tables created |  |
| Job pool and job targets |  |
| Retry/cleanup schedules |  |
| Creator callback and validation endpoints |  |
| OAuth client owner/scopes/secret reference |  |
| HMAC secret reference |  |
| Internal-job secret reference |  |
| Health/config verification time |  |

### Website project/service

| Item | Value/evidence |
|---|---|
| Project/environment/AppSail name |  |
| Base URL |  |
| Private bucket name |  |
| HMAC secret reference |  |
| Replay/idempotency decision |  |
| Health verification time |  |

Configuration values must be recorded in the approved secret manager. This record contains only the secret manager path/name and rotation date.

## Frontend and hosting inventory

| Item | Value/evidence |
|---|---|
| Repository/commit |  |
| Framework and Node version |  |
| Hostinger plan or other host |  |
| Editorial API origin |  |
| Website API origin |  |
| Canonical public site URL |  |
| Media allowlist |  |
| Indexability value |  |
| Revalidation secret reference |  |
| Contact/careers config references |  |
| Development fallback production gate |  |
| DNS change record |  |
| MX/SPF/DKIM/DMARC preservation evidence |  |

## Product decisions

| Question | Answer/owner/date |
|---|---|
| Public authors/bylines |  |
| Content type versus category |  |
| Redirect source and public contract |  |
| First-published versus version-published date |  |
| Unsupported rich-text features |  |
| Slug ownership rule |  |
| Retraction and cache target |  |
| Old public object/media retention |  |
| AI writing provider/data rules |  |

## Test evidence

Mark `Pass`, `Fail`, `Accepted risk` or `Not applicable`, and link timestamped evidence.

| Test | Result | Evidence/notes |
|---|---|---|
| Clean builds, typechecks and unit tests |  |  |
| Widget package validation/install |  |  |
| Author/reviewer/publisher happy path |  |  |
| Negative role/permission tests |  |  |
| Rich-text publication fidelity |  |  |
| Media formats, alt text, limits and hashes |  |  |
| Duplicate/idempotency/conflicting-body tests |  |  |
| Timestamp/nonce/replay tests |  |  |
| OAuth refresh and callback authentication |  |  |
| Callback outage/retry/dead-letter visibility |  |  |
| Schedule fires once in correct timezone |  |  |
| Stale/revoked approval rejection |  |  |
| Cross-article slug collision prevention |  |  |
| Article listing/detail/taxonomy/RSS/sitemap |  |  |
| 404/409/410 frontend handling |  |  |
| Retraction visible within cache target |  |  |
| Website root/page/collection publishing |  |  |
| Website rollback/unpublish reconciliation |  |  |
| Real CMS data; no production fixtures |  |  |
| Contact/careers integration |  |  |
| Backup restore exercise |  |  |
| Load/cold-start limits accepted |  |  |

## Cutover log

| Time/timezone | Actor | Action | Result/evidence |
|---|---|---|---|
|  |  | Publishing freeze |  |
|  |  | Final backup/export |  |
|  |  | Secret rotation |  |
|  |  | Target deployment |  |
|  |  | Frontend/API switch |  |
|  |  | DNS switch |  |
|  |  | Smoke test |  |
|  |  | Monitoring observation |  |
|  |  | Client acceptance |  |

## Rollback record

| Item | Value |
|---|---|
| Trigger thresholds |  |
| Previous frontend/API endpoints |  |
| Creator publishing freeze method |  |
| Website pointer and Creator reconciliation steps |  |
| Editorial prior-revision republish steps |  |
| DNS rollback steps and TTL |  |
| Backup/restore location |  |
| Decision and execution owners |  |
| Rollback tested at |  |

## Open risks and exceptions

| Risk/exception | Severity | Owner | Due date | Mitigation/acceptance |
|---|---|---|---|---|
|  |  |  |  |  |

## Final acceptance

- [ ] Source and artifacts are traceable by hash.
- [ ] Secrets have been rotated and only references appear in this record.
- [ ] Creator records, files and relationships reconcile.
- [ ] Target runtime and dependency health is verified.
- [ ] Required security and workflow tests pass.
- [ ] Monitoring, backups and restore responsibilities are assigned.
- [ ] Rollback is usable for the agreed window.
- [ ] Open risks are accepted by named client owners.
- [ ] Operations/support handover is complete.

| Sign-off | Name | Date/time/timezone | Evidence |
|---|---|---|---|
| Engineering |  |  |  |
| Security |  |  |  |
| Content/product |  |  |  |
| Client production owner |  |  |  |

