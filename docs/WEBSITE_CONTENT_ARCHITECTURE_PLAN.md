# GeneDrift Website Content Architecture Plan

Client Phase 2 baseline received on 2026-09-01. Read
`docs/PHASE_2_WEBSITE_REVAMP_CLIENT_BASELINE.md` before using this plan for any
new website design or development work.

## Decision

Use **Zoho Creator + Catalyst + Next.js/Vercel**.

- **Creator is the content workspace:** editors create, review, approve and publish website content.
- **Catalyst is the publishing and delivery layer:** it validates approved content, stores public versions and media, maintains indexes, and exposes the public API.
- **Next.js on Vercel is the presentation layer:** it renders the approved design and reads only the Catalyst public API.

Creator alone is sufficient for editing, but it should not be the public website database. Public pages must not call Creator for every visitor because that would couple site speed, availability, credentials and API limits to the editorial system.

Client customization requirement: the client should be able to update website
copy/sections from Creator, but those edits should become public only after
approval and publication into Catalyst. The production website should render
from Catalyst public APIs/cache, not directly from Creator.

## System architecture

```mermaid
flowchart LR
    E[GeneDrift editor] -->|Edit and approve| C[Zoho Creator CMS]
    C -->|Signed publish request| P[Catalyst publishing service]
    P -->|Immutable page JSON and media| S[Catalyst Stratus]
    P -->|Pointers, indexes and taxonomy| D[Catalyst Data Store]
    P -->|Invalidate page and tags| R[Next.js cache revalidation]
    V[Website visitor] --> W[Next.js on Vercel]
    W -->|Public API request| A[Catalyst public API]
    A --> D
    A --> S
    W -->|Rendered page| V
```

## Where content lives

```mermaid
mindmap
  root((Website content))
    Creator - working source
      Draft text and images
      Review and approval
      Roles and audit history
      Page and section relationships
    Catalyst - published source
      Immutable page versions
      Public media
      Current-version pointers
      Search and taxonomy indexes
    Next.js - protected presentation
      Approved page templates
      Responsive layouts
      Animation and interaction
      SEO and structured data rendering
      Cached public pages
```

### Recommended Creator records

- `Website_Pages`: title, slug, page family, status, SEO and current revision.
- `Website_Page_Revisions`: the editable content for one revision.
- `Website_Sections`: approved section type, order, visibility and structured fields.
- Reusable collections: `Markets`, `Capabilities`, `Client_Success`, `Offices`, `FAQs`, `CTAs` and `Media_Assets`.
- Controlled relationships and taxonomies connect pages, markets, expertise, industries and insights.

Each published page becomes one structured public snapshot, for example:

```text
Page identity + slug + template
SEO title + description + social image
Ordered approved sections
Related markets + capabilities + insights
Publication version + timestamps
```

## What the client can edit

Editors can change:

- headings, paragraphs and labels;
- images, alt text and downloadable files;
- buttons, links and contact routes;
- SEO title, description and social image;
- approved section visibility and ordering;
- reusable market, capability, office and proof content.

The application protects:

- page-family layouts and design-system rules;
- responsive behaviour and accessibility;
- animations and interactive map logic;
- validation, security and integration code;
- unsupported section types or arbitrary HTML.

This is a structured CMS, not an unrestricted drag-and-drop builder.

## What happens when a heading is updated

```mermaid
sequenceDiagram
    participant Editor
    participant Creator
    participant Catalyst
    participant Vercel as Next.js/Vercel
    participant Visitor

    Editor->>Creator: Edit heading and save draft
    Editor->>Creator: Review, approve and publish
    Creator->>Catalyst: Signed revision-specific publish request
    Catalyst->>Creator: Validate current approval and revision
    Catalyst->>Catalyst: Create immutable public page version
    Catalyst->>Catalyst: Advance pointer and update index
    Catalyst->>Vercel: Revalidate affected path and content tags
    Catalyst-->>Creator: Record publication result
    Visitor->>Vercel: Request page
    Vercel->>Catalyst: Fetch current public version if cache is stale
    Vercel-->>Visitor: Serve page with updated heading
```

Publishing should never edit the existing public object in place. It creates a new version and advances a pointer. This preserves rollback, auditability and safe cache refresh.

## Cache and update behaviour

1. Catalyst sends a secured on-demand revalidation request for the changed page and related listings.
2. Next.js refreshes the affected route and tagged data instead of rebuilding the entire website.
3. Catalyst responses retain ETags and CDN caching.
4. A short time-based refresh acts as a fallback if the revalidation callback fails.
5. Rollback republishes a previous immutable version and triggers the same cache refresh.

## Delivery roadmap

```mermaid
flowchart LR
    P0[1. Approve page families] --> P1[2. Map editable fields]
    P1 --> P2[3. Build Creator website CMS]
    P2 --> P3[4. Extend Catalyst publishing and public APIs]
    P3 --> P4[5. Build Next.js section renderer and preview]
    P4 --> P5[6. Connect markets, capabilities, offices and careers]
    P5 --> P6[7. Security, accessibility, load and acceptance testing]
    P6 --> P7[8. Client-owned production launch and training]
```

### Immediate next checkpoint

Before building the wider CMS, approve:

1. the final sitemap and reusable page families;
2. which fields are editable on each page family;
3. which sections can be reordered or hidden;
4. the preview, approval and publishing roles;
5. the selected visual direction and its component library.

The client's current requested first step is to prepare three sample
templates/design concepts: two aligned closely with the LF20 design philosophy
and corporate presentation, and one independent premium direction based on our
creative judgment. Use those concepts to select the design direction before
building the complete website.

The existing Blog/Insights pipeline should remain the reference implementation. The website-content system extends it with additional content types and page templates instead of creating a separate delivery architecture.
