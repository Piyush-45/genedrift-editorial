# GeneDrift Editorial Platform (Creator app): how it works, and what to fix before handover

Read from a fresh `.ds` export of the live app (owner `piyugene02`, exported
2 Oct 2026, 22:56 IST). The export's signing secret is not reproduced here.
Companion to `editorial-engineering-and-deployment-guide.md`.

---

## 1. The app in one paragraph

Writers draft articles in the **Article Workspace** (a Creator page hosting
the React editor widget). Every save is a **revision**. A finished draft is
**submitted**, which opens review slots. **Reviewers** claim a slot, comment
and decide. When enough distinct reviewers approve (the article's **approval
policy**), the revision is **Approved** and publishers are emailed. A
**Publisher** then publishes now, schedules, or later retracts. Publishing
creates a **Publication Job**, which Creator hands to Catalyst with a signed
request; Catalyst checks back with Creator, publishes, and calls Creator back
to mark it Published. Every step writes an **Audit Event** and most send a
branded email.

## 2. The 17 forms, grouped

| Group | Forms | What they hold |
|---|---|---|
| Content | `Articles`, `Article_Revisions`, `Article_Contributors` | Article identity and workflow state; every version of the text (title, slug, excerpt, editor JSON file, checksum, SEO, media, word count); co-authors |
| Review | `Review_Assignments`, `Review_Comments` | Review slots (queued, assigned, claimed, decided) and threaded comments |
| Publishing | `Publication_Jobs`, `Redirects` | One job per publish, schedule or retract, with status, attempts and errors ("Publishing Health"); redirects (stored but **not served** by the API yet) |
| Media | `Media_Assets` | Uploaded files with alt text, caption, checksum, size, and the published URL once Catalyst stores them |
| Taxonomy | `Categories`, `Tags`, `Approval_Policies` | Categories (each with a default policy), tags, and policies (Standard = 1 approval, Regulated = 2 distinct) |
| People | `Demo_Employees`, `Demo_Teams`, `Demo_Team_Memberships`, `Editorial_Role_Assignments` | The staff directory the app uses for every permission check, and who is Author, Reviewer, Publisher or Editorial Admin |
| Admin | `Site_Settings`, `Audit_Events` | Site defaults, and the full history log |

**Identity rule used everywhere:** the logged-in Creator user is matched to a
`Demo_Employees` row by `Work_Email`, then by `Creator_Username`. No match =
nothing works ("not mapped to an active editorial employee"). Roles come from
`Editorial_Role_Assignments`, not from Creator's own profiles.

## 3. Article states

`Draft → In Review → Approved → (Scheduled) → Published → Unpublished`
plus `Changes Requested` (back to a new draft revision), `Rejected`, and
`Archived` ("Trash", recoverable).

Revision states: `Draft → Submitted → Approved → Published`, older published
ones become `Superseded`.

## 4. Every function, in plain English

| Function | Who can run it | What it does |
|---|---|---|
| `submit_article_for_review` | Owner, primary author, Editorial Admin | Needs title, slug, saved content and a category. Creates assigned slots for chosen reviewers (not the author, no duplicates) plus queue slots up to the policy's approval count. Article → In Review. Emails reviewers |
| `claim_review_assignment` | Active Reviewer (not the primary author) | Takes a queued slot, or confirms an assigned one. One slot per reviewer per revision |
| `add_review_comment` | Author, assigned reviewer, Admin | Adds a comment (General, Change Request, Reply, Resolution), max 8,000 characters |
| `record_review_decision` | The reviewer who claimed it | Approved: once distinct approvals reach the policy count, the revision is Approved and publishers are emailed. Changes Requested: copies the revision into a new Draft (reason required). Rejected: closes it. Remaining open slots are cancelled |
| `publish_approved_article` | Publisher or Editorial Admin | Creates a Publish job (idempotency key `PUB-<article>-<revision>`), hands it to Catalyst. Re-running reuses the open job instead of duplicating |
| `schedule_approved_article` | Publisher or Editorial Admin | At least 2 minutes ahead; article → Scheduled; Catalyst owns the timing |
| `retract_published_article` | Publisher or Editorial Admin | Reason 3 to 1,000 characters, optional replacement path. Creates an Unpublish job; the site then shows "withdrawn" (410) |
| `handoff_publication_to_catalyst` | Internal | Re-checks everything (exact approved revision, document, checksum, media metadata incl. alt text), builds the payload, signs it (HMAC), POSTs to `Catalyst_Base_URL/v1/publications`. Transient failure → retry in 1 minute |
| `validate_catalyst_publication_request` | Catalyst (Custom API, OAuth) | Catalyst asks "is this exact job still valid?" just before writing |
| `record_catalyst_publication_result` | Catalyst (Custom API, OAuth + signature) | Verifies the signature and clock, ignores duplicates, then marks job, revision, article and media Published (or Failed / Retracted), and emails the author |
| `process_scheduled_publication(s)` | Schedules (all **inactive**) | Reconciliation: re-sends hand-offs that never reached Catalyst |
| `archive_draft_article` / `restore_archived_article` | Owner, author, Admin | Trash and restore drafts; nothing is deleted |
| `save_article_taxonomy` | Owner, author, Admin | Category and tags, drafts only |
| `create_editorial_taxonomy_term` | Category: Admin only. Tag: Author or Admin | Creates or reuses by slug |
| `update_media_metadata` | Uploader, Author, Admin | Alt text (required) and caption |
| `send_editorial_notification` | Internal | Branded HTML email via Zoho, logged in Audit Events |
| `seed_editorial_configuration`, `seed_workflow_test_users` | Developer | Create the demo admin, team, categories, tags, policies, roles, settings, and four example.com test users |
| `reset_editorial_test_content` | "CEO or Editorial Admin" + typing `RESET TEST CONTENT` | **Deletes every article, revision, review, job, media record and audit event** |

## 5. What must be fixed or decided before the client move

**Certain:**

1. **Signing secret.** The export holds `Publishing.Signing_Secret` in plain
   text, and the value is the **same one exposed in September**. It was
   reused for the rehearsal. Generate a new one, set it in Catalyst
   (`PUBLISHING_HMAC_SECRET`) and Creator together, Create Deployment. Never
   paste a `.ds` into chat, email or git.
2. **Remove `reset_editorial_test_content` from production** (or the
   function body). One typed phrase wipes all editorial history, including
   the audit trail, on a regulated client's site.
3. **Demo staff and seeds.** `Demo_Employees` contains Piyush's personal
   address as "Platform Administrator" and example.com test users. Replace
   with the client's real editorial team and roles; drop the seed functions
   or keep them out of the client app. "Demo_" link names can stay (renaming
   is a schema change) but the labels should read "Employees", "Teams".
4. **Author profile is far too wide.** The "Editorial Author" profile has
   View/Edit/Delete on every report, including `Publication_Jobs`,
   `Audit_Events`, `Editorial_Role_Assignments`, `Approval_Policies` and
   `Demo_Employees`. An author could give themselves the Publisher role,
   mark a job Succeeded, or delete audit events. The functions guard the
   workflow, but the raw reports bypass them. Reduce to: own drafts via the
   workspace, read-only on taxonomy, no access to jobs, roles, policies,
   employees or audit.
5. **Data centre is hard-coded to India.** `creatorapp.zoho.in` (email links),
   `www.zohoapis.in`, `accounts.zoho.in`, Catalyst `.in`, and `+05:30` in the
   payload. The client's existing Creator app (`proton`) is on the **US**
   centre. If the editorial app moves to their account, every `.in` reference
   and the Catalyst project's region must match their centre. Decide this
   first.
6. **Schedules are all inactive.** Without "Reconcile Catalyst Handoffs", a
   hand-off that fails before Catalyst accepts it is only retried when someone
   presses Reconcile. Activate it (e.g. every 15 minutes) in production.
7. **New-article owner lookup differs.** `Initialize_New_Article` matches
   `Creator_Username == zoho.loginuserid`; the functions match `Work_Email`
   first. A user mapped only by email gets no auto-filled Owner/Author. Align
   both.

**Worth testing, then tidying:**

8. **Unbracketed `&&` / `||` conditions.** Many checks read like
   `Employee == x && Active == true && Role == "Publisher" || Role == "Editorial Admin"`.
   The live flow works (the rehearsal publish passed the Catalyst
   validation, which has the same shape), so Deluge evidently groups these
   the intended way. But it is easy to misread and to break. Before handover:
   one negative test (an Author tries to publish, schedule, retract; must be
   refused), then add explicit brackets everywhere.
9. **Approve without a summary.** The decision check appears to require a
   summary even for "Approved". Confirm in the workspace; if so, either
   accept it as policy or relax it.

**Known product gaps (from the engineering guide):** slug uniqueness across
articles, public author bylines, redirects not served, editor features the
publisher does not render (tables, highlight, alignment), content type vs
category in URLs.

## 6. Rehearsal state (2 Oct)

`Publishing.Catalyst_Base_URL` = the rehearsal editorial publisher
(`gd-editorial-publisher-50046492215.development.catalystappsail.in`). The
test article "Rehearsal test: publishing check" is published there; delete or
retract before handover.
