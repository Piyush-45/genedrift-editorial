# genedrift-web

Production website. Built from the approved consolidated design.

    npm install
    npm run dev        # http://localhost:3000
    npm run check      # typecheck + lint + build

## How this works

A page is a list of **sections**. Each section type is a folder under
`components/sections/` holding its component, its Zod schema and a fixture.
All schemas compose into a discriminated union in `lib/schema/section.ts`;
`components/sections/registry.tsx` maps type -> component and renders the list.

Adding a section: create the folder, add the schema to the union, add the line
to the registry. Nothing else changes.

`/dev/sections` renders every section from its fixture. Check it after changes.

## Rules

- **No arbitrary Tailwind values.** No `text-[17px]`, no `#5B3FD2`. Everything
  comes from `styles/tokens.css`. If a value is missing, add a token.
- **Animation stays in CSS**, and `prefers-reduced-motion` is handled globally.
- **Server components by default.** `"use client"` only for real interaction.
- **Fixtures before components** — define the shape, then build against it.
- **Fonts are self-hosted.** Archivo (variable) and IBM Plex Mono live in
  `app/fonts/` and load via `next/font/local`. They are not fetched from Google
  at build time or at runtime — no third-party font request from a client's
  page. The files come from the `@fontsource*` devDependencies; to refresh
  them, reinstall and copy the woff2 out of `node_modules` again.

Content currently comes from `lib/content/fixtures.ts`. Swapping to the Catalyst
public API changes one function, `getPage`.

See `claude/genedrift-build-plan.md` in the project docs for the full plan.
