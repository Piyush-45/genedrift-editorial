# GeneDrift Current Checkpoint - 2026-09-07

Status: **Phase 2 website concepts and content architecture are prepared; client
design feedback is the next active task. Phase 1 remains support-only. A Creator
OAuth publishing incident was remediated by the operator, but the affected
publication's final Catalyst/public status was not captured in this chat.**

Use this as the first file to read when resuming.

## Immediate next task

The client has supplied reviews of the website designs. Start the next chat by
reading this checkpoint and then obtain the exact client comments from the user.
Apply the feedback to the Phase 2 concepts or selected direction. Do not resume
general Article Workspace development unless the user explicitly asks for
support.

Primary Phase 2 references:

- `docs/PHASE_2_WEBSITE_REVAMP_CLIENT_BASELINE.md`
- `docs/PHASE_2_HERO_CONCEPT_REVIEW_2026-09-05.md`
- `docs/PHASE_2_WEBSITE_INFORMATION_AND_EDITING_ARCHITECTURE_2026-09-05.md`
- `docs/PHASE_2_CMS_FORM_AND_COMPONENT_BLUEPRINT_V1.md`
- `docs/WEBSITE_CONTENT_ARCHITECTURE_PLAN.md`

## Phase 2 design state

- Three distinct hero studies are implemented at `/designs/phase-2`:
  1. LF20 Conservative Enterprise / Regulatory Atlas
  2. LF20 Editorial Intelligence / Intelligence Briefing
  3. Independent Premium Advisory / Clear Path Forward
- Repository recommendation is concept 02, but no final user/client selection
  has been recorded.
- The complete homepage has intentionally not been built because the user asked
  to wait for selection.
- The required homepage continuation is:
  Hero; Featured Expertise; Explore Business Needs; Explore Markets; Latest
  Regulatory Intelligence; Featured Insights; Client Success Highlights;
  Industry/Product Expertise; Why GeneDrift; Delivery/Operating Model; Global
  Presence; Speak to an Expert.
- Browser/device review remains user-managed. Do not access a browser without
  discussing the testing choice again.

## Phase 2 information and editing architecture

- Keep the nine top-level areas: Home, Explore, Expertise, Markets, Knowledge
  Hub (`/insights`), Client Success, Company, Careers and Contact.
- Plan around approximately 14 reusable frontend page families, not one coded
  template per sitemap label.
- The current content-led estimate is 37–46 curated launch pages plus existing
  and future Insights articles. Final count depends on the client's launch
  content.
- Keep the three-layer ownership model:
  - Creator: private structured editing, preview, review and publishing control.
  - Catalyst: validated immutable public versions, media, indexes and APIs.
  - Next.js/Vercel: public templates, responsive design, accessibility, SEO and
    caching.
- Normal website content should use a lighter structured Website Workspace with
  forms, relationships and preview. Do not build a second unrestricted article
  editor or drag-and-drop site builder.
- The CMS blueprint proposes 17 underlying website content/governance record
  types exposed through 7–8 coherent client-facing workspace areas.
- The first CMS implementation should be a Home vertical slice from Creator
  draft through Catalyst publication to Next.js rendering.

## Cross-account role evidence from 2026-09-06

- The operator added the separate ZTM test identity at Creator platform level as
  `Editorial Author` with `Write` permission.
- Internal GeneDrift role assignments gave that identity Author and Reviewer,
  and later Publisher for capability testing.
- Piyu created `testing role based acess version -v`, suggested ZTM as reviewer,
  and submitted it.
- ZTM saw the assigned review, opened the submitted revision read-only, claimed
  it and approved it.
- Piyu's dashboard then showed the article Approved and ready to publish, with
  matching Review Claimed, Review Approved and notification-handoff activity.
- After Publisher was assigned internally, ZTM saw Publish and Schedule controls
  for the approved article. This proves the current widget responds to internal
  editorial roles when the Creator account has sufficient platform access.
- This was an assigned-review test. The screenshot showed zero shared-queue
  review items, so do not cite it as a fresh shared-queue claim test.
- The Creator base `Write` profile still exposes broad native application areas.
  Treat it as useful test access, not final least-privilege production evidence.

## Refreshed article route support

- A live refresh failure first exposed expired Creator browser sessions as HTTP
  401 / code 2945 / Z223.
- After reauthentication, the shortened `#Article_Workspace?...` route could
  still strand Creator's loader, while the explicit
  `#Page:Article_Workspace?...` route reconstructed the article.
- Package
  `editor-widget/genedrift-editor-widget-support-v0.5.7-refresh-route.zip`
  changes widget navigation to explicit `#Page:` URLs and adds the callback
  expected by the current image SDK.
- SHA-256:
  `4868fce60fc067539e44ccca0418289f3ec36a3b62c9dd976ac5b9d180f30df3`.
- Live upload of v0.5.7 was not captured. Keep v0.5.5 as the last explicitly
  live-smoke-verified widget unless the user supplies new installation evidence.

## OAuth publication incident and remediation

- Article `test with Akshay 2`, revision
  `REV-ART-8f5ab2b5161d75fd8cd21856f24e0dad-0002`, requested Publish at
  2026-09-06 11:17:13 IST.
- Creator correctly showed Processing, attempt 0 and HTTP 202 after handoff.
- Catalyst request
  `req_23feb000c4517b7790cdfef39a93eddd66885ada` reached `RetryScheduled`
  with attempt count 3 and error `CREATOR_OAUTH_REFRESH_FAILED` /
  `Creator OAuth refresh failed with HTTP 200`.
- This proves the Catalyst worker ran; it failed while obtaining a usable Creator
  access token. The project runbook identifies HTTP 200 without `access_token`
  as commonly caused by storing a temporary Self Client code as the refresh
  token.
- The operator generated a fresh India Self Client code with scopes
  `ZohoCreator.customapi.EXECUTE,ZohoCreator.report.READ`, exchanged it for the
  actual refresh token, updated Catalyst configuration and redeployed the
  current AppSail package.
- Current AppSail package:
  `genedrift-catalyst-appsail-dev-v0.4.3-media-caption.zip`.
- SHA-256:
  `cdd7eb7e45e2a25ab4214bbdda71a5b94ce386171ff4d588f25e25070eec6e4b`.
- The user reported the remediation done. No post-remediation request row,
  Creator Succeeded state or public article URL was supplied afterward. Verify
  those before claiming this particular publication succeeded.
- Ordinary browser sign-in on another device does not rotate an OAuth client ID
  or normally replace a refresh token. Do not describe that as the technical
  root cause in permanent documentation.

## Security cleanup

- Do not store OAuth JSON, client secrets, authorization codes, refresh tokens or
  access tokens in this repository or future chat messages.
- A non-expiring Vercel token was previously pasted into chat and used for the
  redirect deployment. Revoke it before client handoff.
- The locally downloaded Zoho Self Client JSON and temporary refresh-token file
  are sensitive operator artifacts. Remove them after configuration and rotate
  the credentials if they may have been exposed.

## Public links

- Insights: `https://genedrift.site/insights`
- Design references: `https://genedrift.site/designs`
- Temporary revised-design redirect:
  `https://genedrift.site/revised-designs` ->
  `https://starlit-gumption-65a19b.netlify.app/meridian/`

The redirect target still includes `/meridian/`; the user later said the desired
source was the Netlify site root. Confirm the desired target before changing it.

## Resume order

1. `docs/CURRENT_CHECKPOINT_2026-09-07.md`
2. `docs/PHASE_2_WEBSITE_REVAMP_CLIENT_BASELINE.md`
3. `docs/PHASE_2_HERO_CONCEPT_REVIEW_2026-09-05.md`
4. `docs/PHASE_2_WEBSITE_INFORMATION_AND_EDITING_ARCHITECTURE_2026-09-05.md`
5. `docs/PHASE_2_CMS_FORM_AND_COMPONENT_BLUEPRINT_V1.md`
6. `docs/HANDOFF.md`
7. `docs/STATUS.md`
8. `docs/WORKLOG.md`
9. `docs/CREATOR_ACCOUNT_MIGRATION_RUNBOOK.md` only if Phase 1 support resumes

