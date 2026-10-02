# GeneDrift Phase 2 — CMS Form and Component Blueprint v1

Prepared: 2026-09-06  
Status: planning proposal; no Creator or production changes made

## 1. Recommended editing approach

Do not build a second article-style editor for ordinary website pages.

- Keep the existing Article Workspace for Insights and other long-form editorial
  content.
- Add a lighter Website Workspace for pages and reusable collections.
- Use structured fields, controlled section types, image selectors,
  relationship selectors, ordering controls and a real private preview.
- Allow limited rich text only inside fields that genuinely need formatted body
  copy. Do not allow arbitrary HTML, scripts, colours or page layouts.

The client experiences one coherent workspace even though several related
Creator records store the data underneath.

## 2. Counts to use for planning

- **9 top-level information areas** in the client sitemap.
- **About 14 frontend page families/templates**, reused across all public pages.
- **About 37–46 curated pages at launch**, pending the client's content choices,
  plus current and future Insights articles.
- **17 website content/governance record types** proposed below, plus the
  existing shared Media, Employee, Role, Review, Publication and Audit records.
- **7–8 client-facing workspace screens**, because editors should not have to
  work directly with every underlying record type.

The record count is not the number of public pages and is not the number of
navigation items.

## 3. Proposed Creator record types

### Core page records

1. `Website_Pages` — stable page identity, family, path, ownership and state.
2. `Website_Page_Revisions` — draft/review/published revision identity and SEO.
3. `Website_Sections` — ordered section instances belonging to a revision.

Section fields should be validated by section type. In Creator this can be
implemented with typed fields/subforms or a validated payload plus relationship
records. The public contract must never accept arbitrary component names or
unchecked HTML.

### Reusable content collections

4. `Capabilities`
5. `Sub_Capabilities`
6. `Explore_Journeys`
7. `Regions`
8. `Markets`
9. `Industries`
10. `Case_Studies`
11. `People`
12. `Offices`
13. `Jobs`
14. `Proof_Points`
15. `FAQs`
16. `Calls_To_Action`
17. `Global_Content` — navigation, footer, contact details, social links and
    site-wide notices.

`Website_Redirects` is a technical governance record and can extend the existing
redirect mechanism instead of becoming a separate client editing area.

Reuse the existing `Media_Assets`, Employee/role, review assignment,
publication job and audit structures where their current contracts remain
suitable. Do not duplicate them merely to give them a website prefix.

## 4. Client-facing Website Workspace

Expose these workspace areas rather than 17 raw forms:

1. **Overview** — drafts, assigned reviews, scheduled changes, failures and
   recent publications.
2. **Pages** — Home, hubs, institutional pages and reusable detail pages.
3. **Collections** — capabilities, journeys, markets, industries, case studies,
   jobs, people, offices, proof points, FAQs and CTAs.
4. **Navigation & Global Content** — menus, footer, contacts and global notices.
5. **Media** — existing governed media library.
6. **Review** — comparison, comments, approve and request-changes actions.
7. **Publishing** — publish, schedule, retry, rollback and retract actions.
8. **SEO & Redirects** — metadata, canonical/indexing controls and URL changes.

## 5. Page editor fields

Every page editor should provide:

- internal title, page family and canonical path;
- owner and workflow state;
- SEO title, meta description, social image, canonical and robots choice;
- ordered allowed sections;
- fields appropriate to each section;
- links to reusable records such as capabilities, markets and insights;
- readiness errors and warnings;
- revision history and review comments;
- authenticated desktop/mobile preview.

For the homepage, keep the approved sequence protected:

1. Hero and discovery access
2. Featured Expertise
3. Explore Business Needs
4. Explore Markets
5. Latest Regulatory Intelligence
6. Featured Insights
7. Client Success Highlights
8. Industry / Product Expertise
9. Why GeneDrift
10. Delivery / Operating Model
11. Global Presence
12. Speak to an Expert

The client may edit content, choose approved related records, and hide only
sections marked optional. Required sections and their relative order remain
protected.

## 6. How reusable frontend components work

Next.js owns a controlled component registry. Each published section has an
approved `type` and matching data contract, for example:

```text
hero_enterprise          -> HeroEnterprise
featured_capabilities    -> FeaturedCapabilities
journey_cards            -> JourneyCards
market_map               -> MarketMap
insight_feed              -> InsightFeed
case_study_feature        -> CaseStudyFeature
proof_metrics             -> ProofMetrics
contact_cta               -> ContactCTA
```

Creator stores content and relationships; it does not store React code or CSS.
Catalyst validates and resolves the section data before publication. Next.js
maps the published type to the approved component. An unknown or invalid type
fails publication instead of breaking the public page.

A reusable item is edited once and referenced by many pages. Publishing a
change to that item calculates every affected route, advances its public
version, and refreshes those pages. Pages should resolve explicit published
versions so an unpublished reusable edit cannot leak onto the site.

## 7. Data flow

1. Editor changes structured fields in Creator and saves a draft revision.
2. Private preview renders that exact draft with the real Next.js components.
3. Reviewer approves or requests changes.
4. Publisher publishes or schedules the approved revision.
5. Catalyst validates the current approval, section contracts, relationships,
   paths, links and media.
6. Catalyst creates an immutable public snapshot and advances the current
   pointer in one controlled operation.
7. Catalyst updates navigation/search/relationship indexes and requests
   revalidation for affected Next.js paths and tags.
8. Vercel serves the updated page from the Catalyst public API/cache.

Saving a draft never changes the public website. Rollback advances the pointer
to a prior immutable version and refreshes the affected routes.

## 8. What is known

- Nine top-level information areas and the route philosophy.
- Ten Explore journeys, six main capabilities, five industries, four regions
  and 31 named country markets.
- The Knowledge Hub ecosystem and the requirement to retain `/insights`.
- Client Success, Company, Careers and Contact topic inventories.
- The homepage content order at a high level.
- Brand palette, LF20 direction and visual restrictions.
- Creator → Catalyst → Next.js/Vercel as the publishing architecture.
- A working Insights workflow that can be reused for approvals, immutable
  versions, publication jobs, audit and public delivery.

## 9. What must still come from the client

- Exact launch-page list and priority countries/journeys/company pages.
- Approved copy, market facts, regulatory claims and source ownership.
- Approved case studies, client names, outcomes and metrics.
- Leadership biographies/headshots and confirmed office information.
- Official logo files, licensed fonts, editable LF20 assets and icon direction.
- Current vacancies and the job application destination.
- Contact-form routing: CRM, email, ticketing and ownership for each enquiry.
- Legal/privacy/cookie/accessibility copy and analytics/consent requirements.
- Existing URL inventory for redirects.
- Approval rules for normal and high-risk website content.
- Launch status for comparison tools, questionnaire, newsletter, calendar,
  webinars/videos/downloads, localization and the future AI assistant.

## 10. Recommended build order

1. Approve the launch-page matrix and the 14 page families.
2. Select the visual direction and finish the complete responsive homepage.
3. Approve the component registry and editable-field dictionary.
4. Define Catalyst public snapshot/API contracts.
5. Build one Home vertical slice: edit, preview, review, publish and render.
6. Add repeatable Expertise, Explore, Market and Company families.
7. Add industries, Client Success, careers, conversion and global content.
8. Add cross-site search, sitemap, feeds, redirects and migration tooling.

The Home vertical slice should be the first CMS implementation. It proves the
entire content path before the same machinery is expanded to dozens of pages.
