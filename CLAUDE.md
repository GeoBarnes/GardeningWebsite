# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static brochure site (4 pages: Home, Portfolio, About, Contact) promoting a freelance gardener's services. Astro 7 + Tailwind 4, zero JS by default, no CMS or database — content lives as Markdown in the repo. Currently a **placeholder prototype**: copy, palette, fonts, and images are deliberately stand-ins to be swapped later.

Three planning docs drive the work and are worth reading before large changes:

- [website-development-plan.md](website-development-plan.md) — the brief, stack rationale, and step order
- [technical-implementation-plan.md](technical-implementation-plan.md) — build sequence, phase status
- [testing-plan.md](testing-plan.md) — the 5-layer test pyramid and its conventions

## Commands

```bash
npm run dev                # dev server on :4321
npm run build              # production build to dist/
npm run check              # astro check — TypeScript + Astro diagnostics
npm run lint               # eslint (flat config)
npm run format             # prettier --write .    (format:check for CI parity)

npm test                   # vitest run — unit/component (src/**/*.test.ts)
npm run test:watch
npx vitest run src/content/schema.test.ts       # single unit test file
npx vitest run -t 'renders the page title'      # single test by name

npm run test:e2e           # playwright — builds, previews, runs tests/**
npm run test:a11y          # axe sweep only
npx playwright test tests/e2e/navigation.spec.ts
npm run test:lighthouse    # lhci against ./dist (requires a prior build)

npm run test:all           # the whole blocking CI chain, in CI's order
```

Node 22.12+ is required and pinned in `.node-version`; fnm auto-switches in this repo.

## Architecture

**Layout contract.** Every page wraps its body in [BaseLayout.astro](src/layouts/BaseLayout.astro), passing `title` and optional `description`. The layout owns `<head>`, the nav link list, and the footer — so adding a route means editing the `navLinks` array there, not each page.

**Content collections.** The zod schema for portfolio projects lives in [src/content/schema.ts](src/content/schema.ts), deliberately extracted from [content.config.ts](src/content.config.ts) so it can be unit-tested in isolation while remaining the exact object the build enforces. Markdown files in [src/content/projects/](src/content/projects/) are globbed; their filename becomes the `id` used by the dynamic route [portfolio/[id].astro](src/pages/portfolio/[id].astro). Bad frontmatter fails at `astro build`.

**Design tokens.** Colors and fonts are Tailwind 4 `@theme` tokens in [src/styles/global.css](src/styles/global.css) (`forest`, `earth`, `font-display`, `font-body`) — there is no `tailwind.config.js`. Changing the palette is a single-file edit; never hardcode hex values in components.

## When to run the tests while making changes

Match the layer to what you touched — don't reach for the browser suite on a one-line copy edit, and don't skip it after changing routing.

- **While editing:** keep `npm run test:watch` running for save-on-change unit feedback. The browser layers are too slow for that loop.
- **Changed a component, page, or the schema:** `npm test`. Add `npm run test:e2e` if you touched routing, nav, the contact form, or markup structure.
- **Changed styling, colours, or the `@theme` tokens:** re-run `npm run test:a11y`. Contrast regressions only surface there — this already caught a real WCAG AA failure in the placeholder palette.
- **Added a route:** add it to [tests/fixtures/routes.ts](tests/fixtures/routes.ts) _and_ `navLinks` in BaseLayout, then `npm run test:e2e`. Skipping the fixture silently loses smoke + a11y coverage for that page.
- **Added a component:** co-locate a `*.test.ts` beside it in the same commit.
- **Touched images, fonts, or client-side scripts:** `npm run build && npm run test:lighthouse` — these are the changes that move perf scores.
- **Before committing:** `npm run test:all`. It runs the same steps in the same order as the blocking CI job, so a green run locally means a green run in CI. If `format:check` fails, `npm run format` fixes it.

## Testing conventions

- **Test contracts, not placeholder copy.** Asserting on stand-in text ("Placeholder hero headline") breaks the moment real copy lands. Assert on mechanisms: routes render, nav points at real pages, schema rejects bad data, form fields carry the names Formspree needs, images have alt text.
- **Route fixture is the single source of truth.** [tests/fixtures/routes.ts](tests/fixtures/routes.ts) drives both the smoke and a11y specs. A new page needs one line there and is then automatically smoke-tested and a11y-swept.
- **Unit tests are co-located** as `*.test.ts` beside the component/module; the vitest `include` glob picks them up with no config change. `.astro` components are rendered to strings via the Astro Container API (see [BaseLayout.test.ts](src/layouts/BaseLayout.test.ts)) — node environment, no DOM.
- **E2E runs against the built site** (`astro preview`), never the dev server, because the production output is what deploys.

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs these layers cheapest-first — static analysis, unit, build, E2E+a11y — so failures surface fast. Lighthouse is a separate, advisory job with warn-level budgets that never blocks a merge.
