# GeneDrift Website and Publishing Platform

This repository contains the production implementation of GeneDrift's editorial
publishing platform and, in a later phase, the complete public website.

The first delivery is the end-to-end Insights product:

- Zoho Creator editorial application and editor widget
- Zoho Catalyst publishing and delivery backend
- Next.js public blog hosted on Vercel
- Immutable published content and media in Catalyst Stratus

Project decisions and progress are maintained under `docs/`.

Start with `docs/HANDOFF.md`, then `docs/STATUS.md`, when resuming in another
task. Together they record the live environment, proven behavior, current
boundary, next test, and the deeper files to read.

The implemented Catalyst service and deployment schema are under `catalyst/`.
Creator-to-Catalyst installation is documented in
`creator/CATALYST_PUBLISHING_SETUP.md`. The first public Next.js frontend is
implemented under `frontend/` and passes its local production build and browser
smoke checks; hosting and launch verification remain pending.

The operator-ready installation order is in
`docs/CREATOR_CATALYST_INTEGRATION_CHECKLIST.md`.
The beginner-friendly Vercel setup, environment wiring, and migration to
client-owned accounts is in
`docs/VERCEL_HOSTING_AND_CLIENT_MIGRATION_GUIDE.md`.

Synthetic catalog and public-read test tools are under `tools/`. They can
generate and serve a deterministic 1,800-article fixture locally and provide a
staged k6 suite without carrying Creator or Catalyst credentials.
