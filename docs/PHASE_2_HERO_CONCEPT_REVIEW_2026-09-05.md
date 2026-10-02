# GeneDrift Phase 2 — Hero concept review

Prepared 2026-09-05. Status: three implemented concepts; client feedback has
been received but is not yet recorded in this document. Apply the user's exact
feedback in the next task before recording selection. Complete homepage
intentionally not started.

## Audit and boundaries

Read the full CURRENT_CHECKPOINT_2026-09-05, HANDOFF, STATUS, WORKLOG and PHASE_2_WEBSITE_REVAMP_CLIENT_BASELINE documents before implementation. Reviewed the existing Next.js homepage, root layout, header/footer, navigation and regulatory atlas. Historical Phase 1 pending tasks do not override the user's current support-only boundary. No Creator, widget or Catalyst changes were made.

The existing frontend has a working Insights integration, navigation primitives, Instrument Sans, a purple token family, and geographic libraries. Its current homepage already uses a dark split hero with a map and metric strip. Several existing frontend files have unrelated uncommitted changes; those are preserved. This study adds only an isolated `/designs/phase-2` route with scoped styles. The site's ordinary homepage and Insights routes retain their existing presentation.

No synced source documents were available in `sources/` during this audit. The durable Phase 2 baseline is the reference for the client attachments; no claim is made that the original LF20 PDF or presentation was visually inspected. All sources remain read-only.

The user selected manual browser testing. No browser application was accessed. Research below used web retrieval, not a visual browser audit. Do not treat the references as pixel-level layout verification.

## Research translated into useful patterns

References accessed 2026-09-05; some design studies describe older work and are not presented as new launches.

- [BCG Biopharma](https://www.bcg.com/industries/health-care/biopharma): distinct paths into industry knowledge, capabilities, insights and experts. Apply this by keeping navigation based on visitor intent and separating the corporate message from supporting knowledge.
- [IQVIA Regulatory Compliance](https://www.iqvia.com/solutions/safety-regulatory-compliance/regulatory-compliance): regulatory services, intelligence and lifecycle support are connected in the content architecture. Apply this by showing how understanding becomes action, rather than treating intelligence as a decorative feed.
- [MIT Technology Review / Pentagram](https://www.pentagram.com/work/mit-technology-review): the published design study describes a flexible 12-column grid, sidebars, infographics and a deliberate typographic system. Apply an editorial hierarchy and a bespoke planning graphic. Do not borrow the monogram, signature diagonal or bright palette.
- [Financial Times](https://www.ft.com/): topic navigation and clear lead-story/supporting-story hierarchy. Apply a strong lead idea with compact subordinate labels, without importing the pink identity or presenting fictional dated news.
- [Control Risks](https://www.controlrisks.com/): advisory positioning connects business uncertainty, expertise and analysis. Apply a consultative invitation and explicit pathways to expertise rather than an aggressive sales funnel.

No source layouts, images, headlines or brand devices were copied.

## The three concepts

### 01 — LF20 Conservative Enterprise / The regulatory atlas

A deep-purple institutional introduction with a light-purple geographic atlas. The headline is “A world of complexity. One clear direction.” White primary CTA, quiet secondary expertise link, precise sans-serif type and a restrained regional index establish clarity.

The region buttons change the highlighted countries and caption. The map shows markets listed in the brief, not verified office locations, client activity or live coverage status. It carries an explicit legend. On mobile, the copy leads and the atlas follows; capability cards stack.

Best for immediate corporate confidence. Its limitation is familiarity: this direction remains closest to the existing dark-map approach, although the new map is an edited geographic index rather than floating service cards or unsupported metrics.

### 02 — LF20 Editorial Intelligence / The intelligence briefing

White canvas, large purple/ink sans-serif typography, fine editorial rules, a compact utility line, and a lavender briefing. The headline is “See the change. Understand what comes next.”

A four-part planning matrix makes product classification, local requirements, evidence readiness and delivery pathway visible. Expandable steps explain understanding, interpretation and action. It is an original conceptual framework, not scored regulatory data or a live news feed. On mobile the briefing follows the positioning; every matrix cell remains readable without horizontal scrolling.

Best for making expertise tangible. It retains LF20's clean sans-serif character but gives GeneDrift a stronger publishing identity. The full site will need approved, useful editorial material to sustain the promise.

### 03 — Independent Premium Advisory / A clear path forward

Lavender-white canvas, oversized serif statement, restrained sans-serif navigation, and a strategic pathway: Understand → Navigate → Sustain. The headline is “The ambition is yours. The way forward, together.”

The composition uses whitespace and typographic rhythm rather than a conventional image/card hero. Its next section switches to deep purple. On mobile the headline scales down and the pathway becomes a vertical sequence. System serif fallbacks are specified; final typeface licensing and rendering should be settled after selection.

Best for a distinctive premium identity. Serif display typography deliberately departs from the LF20 sans-serif convention and requires the client's acceptance of that interpretation.

## Recommendation

Choose 02, LF20 Editorial Intelligence. It gives the Knowledge Hub a natural reason to exist, demonstrates the consulting thought process and retains the client palette and typography character. 01 is strongest if corporate familiarity is the priority; 03 is strongest if a more expressive advisory identity is the priority. No selection has been recorded.

## Homepage continuation after selection

The baseline's Home summary and the existing frontend establish the following working sequence. Retain it when designing the complete homepage:

1. Hero / positioning, primary CTA and discovery access
2. Featured Expertise
3. Explore Business Needs
4. Explore Markets
5. Latest Regulatory Intelligence
6. Featured Insights
7. Client Success Highlights
8. Industry / Product Expertise
9. Why GeneDrift (present in the existing implementation)
10. Delivery / Operating Model
11. Global Presence
12. Speak to an Expert / closing conversion

The baseline does not provide a separately numbered, detailed homepage section list. The above preserves its listed order and retains the existing Why GeneDrift module ahead of Operating Model. Validate against the original vendor brief when available; do not silently remove or reorder sections.

All three studies stop after the beginning of Featured Expertise. An editorial visual within the hero does not move the later Regulatory Intelligence or Featured Insights sections ahead of their required place.

Keep all nine IA pillars: Home, Explore, Expertise, Markets, Knowledge Hub, Client Success, Company, Careers, Contact. The wordmark links Home; main menus surface Explore, Expertise, Markets, Knowledge Hub and Company; Client Success, Careers and Contact are available within Company (and utility navigation where appropriate). Knowledge Hub links to `/insights`. The study uses existing homepage anchors and the existing careers email destination until the remaining pages are implemented; these are not final URL architecture decisions.

The approved full build should use structured, reviewable homepage content that can later flow through Creator → Catalyst → Next.js. No CMS extension or publishing implementation was added during concept selection. Resolve approved logo/font assets, supported market claims, real editorial content and approved case-study proof before publishing the selected homepage.

## Manual review

Preview: http://127.0.0.1:3020/designs/phase-2 (local server must be running).

1. Compare all three options at 1440px and 1280px desktop widths.
2. Repeat at 390px and 360px mobile widths: headline wrapping, CTA clarity, no horizontal overflow, readable atlas/matrix/pathway, and natural continuation.
3. Open each navigation group. On mobile open Menu, expand groups and follow a link. Tab through controls; Escape closes the active group and returns focus, then closes the mobile menu.
4. In Enterprise, select each region; confirm map highlights and caption change together.
5. In Editorial, expand each briefing step and collapse it again.
6. Toggle Design notes; compare the explanation with the displayed option. Use View this direction in the comparison section to return to each hero.
7. Check browser zoom at 200% and reduced-motion preference. Report browser, viewport and option number with any issue.
8. Select 01, 02 or 03, plus any specific elements you want adjusted. Selection triggers the complete homepage stage.

## Verification

- `npm run typecheck` in frontend: passed.
- `npm run build` in frontend: passed; `/designs/phase-2` generated as a static route.
- Browser rendering, mobile overflow, console behaviour and interactive keyboard testing: pending user manual review.
- Local preview only; no deployment or publication performed.
