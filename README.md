# GeneDrift Website and Publishing Platform

This repository contains the production implementation of GeneDrift's editorial
publishing platform and, in a later phase, the complete public website.

The first delivery is the end-to-end Insights product:

- Zoho Creator editorial application and editor widget
- Zoho Catalyst publishing and delivery backend
- Next.js public blog hosted on Vercel
- Immutable published content and media in Catalyst Stratus

Project decisions and progress are maintained under `docs/`.

Start with `docs/CURRENT_CHECKPOINT_2026-09-03.md` when resuming in another
task or a fresh chat. Then read `docs/HANDOFF.md` and `docs/STATUS.md` for the
full live environment, proven behavior, current boundary, next tests, and deeper
files to read.

For the website-revamp/design phase, also read
`docs/PHASE_2_WEBSITE_REVAMP_CLIENT_BASELINE.md`. It captures the client-supplied
sitemap, LF20 design philosophy, corporate-presentation alignment, image/visual
asset expectations, and the request for three initial sample templates/design
concepts.

The implemented Catalyst service and deployment schema are under `catalyst/`.
Creator-to-Catalyst installation is documented in
`creator/CATALYST_PUBLISHING_SETUP.md`. The public Next.js frontend is
implemented under `frontend/`, passes local production build checks, and the
current Insights revamp is live on Vercel at `https://genedrift.site/insights`.
The current homepage is a temporary placeholder; curated design references are
available through `https://genedrift.site/designs`.

The operator-ready installation order is in
`docs/CREATOR_CATALYST_INTEGRATION_CHECKLIST.md`.
The beginner-friendly Vercel setup, environment wiring, and migration to
client-owned accounts is in
`docs/VERCEL_HOSTING_AND_CLIENT_MIGRATION_GUIDE.md`.
For moving the current Creator trial into another demo account, read
`docs/CREATOR_ACCOUNT_MIGRATION_RUNBOOK.md`.

Synthetic catalog and public-read test tools are under `tools/`. They can
generate and serve a deterministic 1,800-article fixture locally and provide a
staged k6 suite without carrying Creator or Catalyst credentials.

Latest deployable checkpoint artifacts from 2026-09-03:

- Public frontend live deployment:
  `https://genedrift.site`
  - Vercel project: `genedrift-vercel-preview-0.4`
  - Vercel deployment: `dpl_E3k6DnsSo48ZWLAWMF2m4VEMgvzD`
  - Client testing route: `https://genedrift.site/insights`
  - Design-reference route: `https://genedrift.site/designs`
  - Latest commits: `a55a727` and `cdea0c0`
  - Note: the Vercel project is currently not connected to Git; it was deployed
    directly to the existing project.
- Creator widget: `genedrift-editor-widget-dashboard-ux-v0.4.8.zip`
  (`684e9b57d32688b99b5b25ae56a8039ef899b0b5ca7cdfb145b4541996250020`)
- Catalyst AppSail: `genedrift-catalyst-appsail-dev-v0.4.2.zip`
  (`1834f1924a953c21919d242e79f1d0bdaf847bd3abe35415697dd829afc9c3ff`)
