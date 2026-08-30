# GeneDrift public frontend

Next.js 16 public reading experience backed only by the Catalyst public API.

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SITE_URL` to the frontend origin.
3. Run `npm install` and `npm run dev`.

The Development API is the default only to simplify local testing. Set
`GENEDRIFT_PUBLIC_API_BASE_URL` explicitly in every deployed environment.

## Current routes

- `/` — latest stories and featured article
- `/insights` — search, category/tag filtering, and pagination
- `/insights/[slug]` — article detail or a retraction notice
- `/robots.txt` and `/sitemap.xml` — generated discovery metadata

## Release checks

- `npm run typecheck`
- `npm run build`
- Verify published, missing, and retracted slugs against the target API.
- Confirm the production site URL and Catalyst `PUBLIC_SITE_BASE_URL` agree.
- Retract the test articles before launch.

Article detail requests intentionally bypass the frontend data cache so a
retraction is reflected immediately. List data revalidates every 15 seconds;
the Catalyst API remains the source of truth and applies its own ETag/cache
policy.
