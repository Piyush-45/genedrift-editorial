# GeneDrift Current Checkpoint — 2026-09-01

Status: **Phase 1 blog product is functionally strong; public website revamp
checkpoint is now live on Vercel; final release evidence is still being closed.**

Use this file as the first read when starting a new chat. It summarizes the live
Creator/Catalyst/Vercel testing performed through 2026-09-01 and points to the
deeper evidence docs.

## Resume context

- Product in scope: Phase 1 Insights/blog editorial product plus the first
  public website revamp pass for the GeneDrift marketing homepage, Insights
  archive, and article detail pages.
- Phase 2 website-revamp baseline has now been received from the client. Read
  `docs/PHASE_2_WEBSITE_REVAMP_CLIENT_BASELINE.md` before any new website design
  work. The client wants three initial sample templates/design concepts before
  full development: two closely aligned to the LF20 design philosophy and
  corporate presentation, plus one more independent premium concept.
- Current operator-facing Creator app: GeneDrift Editorial Platform.
- Public frontend checked during testing: Vercel project
  `genedrift-vercel-preview-0.4`.
- Current live frontend URL:
  `https://genedrift-vercel-preview-04.vercel.app`.
- Vercel ownership recovered from dashboard:
  - Account shown: `opensourceindia22-8134`.
  - Account email shown: `opensourceindia22@gmail.com`.
  - Team/workspace slug: `ztm2`.
  - Team ID: `team_8OHZR3PCWIiPgfRTWDp7crr8`.
  - Project ID: `prj_Nz73OBb1V6bZBIV6W6Qdjj2S2gpG`.
- Vercel project is **not connected to Git**. Latest deployment was direct CLI
  deployment to the existing Vercel project. For long-term maintenance, connect
  GitHub/GitLab/Bitbucket or keep using controlled direct deployments.
- Current UI palette preference:
  - Dark Deep Purple `#241653` for hero/dark backgrounds.
  - Primary Purple `#5B3FD2` for brand accents, icons, labels, and highlights.
  - Light Lavender `#F0EEFB` for cards/subtle section backgrounds.
  - White for primary canvas and typography on dark surfaces.
  - Black/dark grey for headings and body text.
  - Very light neutral grey for secondary surfaces/cards.
- Client Phase 2 design mandate:
  - Website is a bottom-up enterprise rebuild, not a reskin of the current site.
  - It must feel like a premium global regulatory consulting and intelligence
    platform, not a generic consulting brochure.
  - It must remain a digital extension of the LF20 presentation visual language:
    deep-purple hero/closing sections, white content canvas, lavender/neutral
    cards, restrained purple line iconography, purple/grey maps, strong
    hierarchy, generous spacing, and reusable structured components.
  - Avoid generic stock imagery as the primary identity; prefer
    content-specific visuals, AI-generated visuals where appropriate, maps,
    matrices, regulatory/geographic graphics and structured infographics.
  - Primary IA pillars: Home, Explore, Expertise, Markets, Knowledge Hub, Client
    Success, Company, Careers and Contact.
  - Production content architecture should extend the Phase 1 blog publishing
    model: Creator is where the client edits/reviews/approves; Catalyst stores
    approved public versions, media, indexes and current pointers; Vercel/Next.js
    renders the public website from Catalyst APIs/cache. Do not serve public
    visitor traffic directly from Creator.

## Latest deployable artifacts

- Latest public frontend code checkpoint:
  - `a55a727` — `Revamp GeneDrift public website frontend`.
  - `cdea0c0` — `Fix Vercel frontend deployment config`.
  - Vercel production deployment:
    `dpl_2XJVNVS1f34WSebPsGs6RkW9o6fc`.
  - Stable alias updated:
    `https://genedrift-vercel-preview-04.vercel.app`.
  - Vercel-specific fix: removed Next.js `output: "standalone"` because Vercel's
    managed Next.js build expected the standard output layout. Local and Vercel
    production builds pass after this change.
  - Temporary one-hour deploy token was created for the exact project scope,
    used for deployment, revoked from Vercel, and removed from the local temp
    file path after deployment.
- Latest Creator widget ZIP:
  `genedrift-editor-widget-final-polish-v0.4.5.zip`
  - SHA-256:
    `1210fe55854a2aba1ebffa403c8c87e8a5097ea641e2d17ecbacb0bff0fae8ab`
  - Contents validated with archive integrity check.
  - TypeScript and production build passed.
  - ZET pack succeeded. The Zoho toolkit update-check warning about local
    `.config` permissions is non-blocking; the ZIP is valid.
- Latest AppSail ZIP present for the Catalyst backend:
  `genedrift-catalyst-appsail-dev-v0.4.2.zip`
  - SHA-256:
    `1834f1924a953c21919d242e79f1d0bdaf847bd3abe35415697dd829afc9c3ff`

## What is live-proven now

- Public website homepage revamp is live on Vercel with the dark-purple global
  regulatory consulting hero, world-map visual, expertise sections, market
  messaging, and refreshed typography/layout.
- Public Insights archive revamp is live on Vercel with the newer archive
  heading, search/category filtering UI, card/list treatment, and published
  article links.
- Public article detail revamp is live on Vercel with richer article metadata,
  GeneDrift Insights byline block, editorially approved badge, on-page outline,
  executive brief/key takeaways, readable article body styling, and tag/footer
  treatment.
- Live Vercel checks after deployment passed for `/`, `/insights`, and one
  article detail route. Browser console had no warnings/errors on the checked
  pages.
- Author creates, edits, saves, reloads, adds taxonomy/media, and submits.
- Submitted articles become read-only.
- Reviewer claim, comment, approve, reject/changes-requested behavior works.
- Changes Requested creates a new editable draft revision while preserving the
  submitted reviewed snapshot.
- Standard Review and Regulated two-distinct-reviewer approval have been observed
  live.
- Separate-role behavior has been tested visually for Author-only, Reviewer-only,
  Publisher-only, and Editorial Admin configurations.
- Publisher/Admin can see approved work in the correct Queue/Publishing views.
- Immediate publication reaches Catalyst, Creator Published state, public API,
  and public frontend.
- Valid scheduled publication stays Scheduled before due time and publishes at
  the intended minute.
- Too-soon schedules are rejected safely with the two-minute future rule.
- Retraction removes an article from public listings/search and shows a public
  retraction page rather than serving the article body.
- The dashboard now exposes enough workflow ownership to know who wrote,
  approved, scheduled, published, or retracted a row even when no comment was
  supplied.

## 2026-09-01 live evidence highlights

- `ROLE-03 Publisher-only`
  - Publisher-only account could not edit or review.
  - It could see approved publishing work under Queue/Publishing.
  - It scheduled the article for `01 Sep, 01:55`.
  - A later recovery-path issue exposed two defects:
    approved-pointer guard on scheduled reconcile, then duplicate cron-name
    handling. Fixes were prepared and superseded by the later successful run.
- `SCHED-01 Too-soon Schedule Rejection`
  - Despite the name, the chosen time was valid.
  - It was scheduled for `01 Sep, 01:11`, processed, published, and appeared on
    the public frontend.
- Too-soon schedule rejection
  - Attempting to schedule less than two minutes in the future correctly showed:
    `Scheduled publication must be at least two minutes in the future.`
- `RETRY-02 Scheduled Reconcile — 01 Sep 2026`
  - Scheduled for `01 Sep, 06:04`.
  - Before due time it showed Scheduled, not premature Needs retry.
  - At due time it became Published and appeared in the Published panel and public
    frontend.
  - It was then retracted with reason `testing retraction`.
  - Public listing/search no longer showed it.
  - Former public detail showed `This article has been retracted` with the
    reason and a browse-current-insights action.
  - Creator retained the unpublished/retracted record and audit/history context.
- `SAFETY-01 Stale Approval Guard — 01 Sep 2026`
  - Author submitted article and the editor became read-only.
  - The submitted context did not allow Save Draft or metadata editing.
  - After approval/publish, the public article showed the approved content.

## Dashboard polish shipped in widget v0.4.5

- Brand palette applied across dashboard shell, command bar, filters, active
  tabs, cards, metrics, row hover states, focus rings, and neutral surfaces.
- Ownership metadata changed from bulky badge-like chips to a quieter inline
  audit trace.
- Scheduled article rows now show the scheduled date/time in general article rows
  as well as the publishing queue.
- Approved article rows now explain that the article is waiting for publisher
  action.
- Published, Unpublished/Retracted, In Review, Changes Requested, Scheduled, and
  Processing states have clearer row subtitles/details.
- Dense dashboard rows were tightened so long titles, timestamps, status labels,
  ownership metadata, and buttons fit better at common laptop widths.
- Empty-state copy now clarifies when work may exist outside the current scope or
  filters.

## Still open before a confident Phase 1 release claim

These are not blockers to the core flow being functional, but they remain release
evidence/polish items.

1. Fresh Creator DS export audit.
   - Export the current live Creator app.
   - Record SHA-256.
   - Compare forms, fields, reports, functions, Custom APIs, schedules, roles,
     sharing rules, menu visibility, and deployed widget package against expected
     setup.
2. P3 duplicate/idempotency stress retest.
   - Use one controlled article/job.
   - Repeat the same handoff or Reconcile path.
   - Confirm no duplicate cron error, duplicate public version, duplicate
     callback, or second pointer advance.
3. P4 fresh regulated-review confidence run.
   - Fresh Regulated Review article.
   - Reviewer A approves and cannot approve the second slot.
   - Reviewer B approves and article becomes Approved exactly once.
4. Media-format validation matrix.
   - Fresh JPEG and PNG are required before production claim.
   - GIF/WebP only if promised.
   - Invalid/oversized media must fail clearly without leaving Processing stuck.
5. Accessibility/public-site smoke.
   - Basic live smoke now passed for homepage, archive, and one article detail
     route with no console warnings/errors.
   - Remaining: full desktop/mobile matrix, keyboard focus, contrast, labels,
     Lighthouse, metadata, robots/noindex, structured data, sitemap, RSS, and
     strict retracted-route HTTP 410 handling.
6. 1,800-post scale evidence.
   - First prove catalog-size behavior with deterministic synthetic posts.
   - Then run read-only staged traffic on an approved non-production target.
   - Do not send 1,800 publish jobs; workflow throughput should be tested
     separately at 10, 25, and at most 100 controlled jobs.

## Remaining UX polish backlog

- Homepage hero still needs final visual tuning after client/design review:
  maintain the dark-purple direction, keep the world map more breathable, avoid
  over-zoomed or cramped text at 100% MacBook viewport, and keep color intensity
  refined rather than flat neon.
- Public article detail page should continue moving toward a more professional
  editorial product: stronger author/reviewer/publisher metadata where public
  policy allows, better section rhythm, richer pull-quotes/insight cards, and
  improved media presentation.
- Review feedback presentation needs a cleaner hierarchy so reviewer comments,
  discussion comments, decision summaries, reviewer, revision, and time do not
  feel duplicated.
- Important failure/recovery messages should remain visible until dismissed or be
  available in a durable status/history area.
- Autosave/media-loading flicker should be replaced with a calmer loading state.
- Category/tag display and edit affordances should stay consistent across Draft,
  In Review, snapshot, and published views.

## Best next step

Continue with release evidence and controlled polish, not broad new features:

1. If continuing the website thread, connect Git to Vercel or document the
   direct-deploy process as the temporary deployment lane.
2. Upload/use widget `v0.4.5` if not already deployed.
3. Capture a fresh Creator DS export and audit it.
4. Run the P3 duplicate/idempotency test.
5. Run the P4 fresh regulated-review test.
6. Complete public-site/accessibility and 1,800-post evidence.
7. If shifting to Phase 2 design, start from
   `docs/PHASE_2_WEBSITE_REVAMP_CLIENT_BASELINE.md` and prepare the three
   requested design concepts/templates before broad implementation.

## Detailed files to read next

1. `docs/PHASE_2_WEBSITE_REVAMP_CLIENT_BASELINE.md`
2. `docs/PHASE_1_RELEASE_CLOSURE.md`
3. `docs/MANUAL_VERIFICATION_2026-08-30.md`
4. `docs/STATUS.md`
5. `docs/HANDOFF.md`
6. `docs/PRE_CLIENT_DEMO_AND_SCALE_TEST_PLAN.md`
7. `docs/WORKLOG.md`
