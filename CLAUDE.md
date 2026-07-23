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

**The testimonials collection is empty on purpose.** She has no client testimonials yet. [Testimonials.astro](src/components/Testimonials.astro) renders _nothing at all_ — no heading, no empty container — while [src/content/testimonials/](src/content/testimonials/) has no entries, because an empty "What clients say" section reads as a gap in the business rather than in the content. Adding the first Markdown file makes the section appear with no code change. Do not substitute placeholder quotes: a fabricated testimonial is a lie about a real business.

**Deleting a content file needs the cache cleared.** Astro's content layer caches entries in `node_modules/.astro/data-store.json`, and a plain `astro build` keeps serving a deleted Markdown entry from it. If a removed project or testimonial still renders, `rm -rf node_modules/.astro .astro` and rebuild. CI is unaffected — it always starts from a clean `npm ci`.

**Trailing slashes are mandatory on internal links.** `astro.config.mjs` sets `trailingSlash: 'always'` to match how Cloudflare Pages serves directory output. Every internal `href` must end in `/` (`/about/`, not `/about`), including the paths in [tests/fixtures/routes.ts](tests/fixtures/routes.ts). An unslashed link still works but costs a 308 redirect.

**Client-side JS is per-component.** A `<script>` in an `.astro` component is bundled and shipped only on pages that render it — that is how the zero-JS-by-default promise survives adding interactivity. [BeforeAfterSlider.astro](src/components/BeforeAfterSlider.astro) is the reference example, and [before-after-slider.spec.ts](tests/e2e/before-after-slider.spec.ts) asserts its bundle does _not_ leak onto the home page. Keep that assertion pattern for future islands.

**View transitions change how every script must be written.** [BaseLayout.astro](src/layouts/BaseLayout.astro) renders `<ClientRouter />`, so navigation swaps the `<body>` instead of reloading the document. Two consequences, and both are silent failures rather than errors: a listener bound directly to an element is discarded with the old DOM, and a module-scope `const el = document.getElementById(...)` goes on pointing at a detached node. So either delegate to `document` and look elements up at call time (the mobile nav script _and_ the [ProjectGallery.astro](src/components/ProjectGallery.astro) lightbox), or re-initialise on `astro:page-load` with a guard and tear down on `astro:before-swap`. Delegation is strongly preferred — the lightbox was originally PhotoSwipe rebuilt per page, and its lifecycle kept desyncing from the swapped DOM (a first click that did nothing, an overlay opening below the fold after navigating back); replacing it with a dependency-free overlay delegated to `document` made those whole classes of bug impossible. Anything stateful needs a matching `astro:before-swap` cleanup or it leaks across navigations. [motion.spec.ts](tests/e2e/motion.spec.ts) covers both patterns — a page-two regression is invisible to any test that only ever loads a page directly.

**Scroll reveal must never be able to hide content permanently.** The hidden starting state in [global.css](src/styles/global.css) is gated on a `.js` class that an inline `<head>` script adds before first paint. With JS disabled or broken, `[data-reveal]` elements are simply visible — the enhancement can fail, but it cannot blank the page. Gating in the head rather than from the reveal script is what avoids a flash of content. Reduced motion is honoured in both CSS and JS. Add reveals sparingly (3–4 per page) and never to an above-the-fold or LCP element.

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
- **Every spec runs at two viewports** — the `chromium` and `mobile` Playwright projects. Width-dependent specs guard themselves with the `isMobile` fixture (`test.skip(isMobile, '…')`) rather than asserting something vacuous at the wrong size; see [mobile-nav.spec.ts](tests/e2e/mobile-nav.spec.ts) and [navigation.spec.ts](tests/e2e/navigation.spec.ts).
- **Axe sweeps run under `page.emulateMedia({ reducedMotion: 'reduce' })`.** Not to dodge failures: mid-transition, a fading element's text is genuinely blended toward the background and axe reports a contrast violation that lasts 600ms and describes nothing a user reads. Reduced motion pins elements to their settled state — which is the state being asserted about — with no animation to race. If an axe contrast failure appears with an odd blended-looking hex like `#92a099`, suspect an in-flight animation before suspecting the palette.
- **Sweep interactive states with axe, not just page loads.** The route-driven a11y spec only ever sees a page in its initial state. Anything that opens, expands, or toggles needs its own `AxeBuilder` assertion in the open state — the mobile nav does this.

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs these layers cheapest-first — static analysis, unit, build, E2E+a11y — so failures surface fast. Lighthouse is a separate, advisory job with warn-level budgets that never blocks a merge.
