# Testing & CI Plan — Mum's Gardening Website

Companion to the [technical implementation plan](technical-implementation-plan.md). The goal here is a test suite that (a) is meaningful on today's placeholder prototype, (b) grows without rework as real pages/components land, and (c) runs unattended in CI on every push so periodic updates stay safe.

The guiding rule for an evolving prototype: **test the contracts, not the placeholder copy.** Asserting that the hero says "Placeholder hero headline" is worse than useless — it breaks the moment real copy arrives and trains you to ignore red tests. Instead we test the _mechanisms that must keep working_ regardless of content: every route renders, the nav points at real pages, the content-collection schema rejects bad data, the contact form exposes the field names Formspree needs, images have alt text, the build type-checks. Those hold true from prototype through launch.

---

## The test pyramid for this project

Five layers, fastest and most numerous at the bottom. CI runs them cheapest-first so a typo fails in seconds rather than after a 2-minute browser run.

| Layer                              | Technology                                                                 | What it proves                                                                                                      | Speed       |
| ---------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------- |
| **1. Static analysis**             | `astro check` (TypeScript + Astro diagnostics), ESLint, Prettier `--check` | Code compiles, types line up, style is consistent                                                                   | seconds     |
| **2. Unit / component**            | **Vitest** + Astro **Container API**                                       | Schema validation, individual `.astro` components render correct structure, future utility functions                | seconds     |
| **3. Build**                       | `astro build`                                                              | The real production output compiles; bad content frontmatter fails here too                                         | ~1–2s today |
| **4. End-to-end**                  | **Playwright** against `astro preview` of the built site                   | Routes return 200, nav works, links resolve, form fields exist, 404 works, later: slider/lightbox/mobile-nav behave | ~10–30s     |
| **5. Accessibility & performance** | **@axe-core/playwright** (a11y) + **Lighthouse CI** (perf budgets)         | No accessibility violations; image-heavy pages stay fast — the site's core promise                                  | ~30–60s     |

Why these specifically:

- **Vitest** is Astro's officially supported unit runner — `astro/config` exports `getViteConfig` so tests share the app's exact module resolution and aliases. No parallel config to drift.
- **Container API** (`astro/container`, confirmed available in the installed Astro 7.1.2) renders a single `.astro` component to an HTML string in-memory, so you can assert on structure without a browser. This is how you test `BaseLayout`, `Hero`, the before/after slider, etc. in isolation.
- **Playwright** is the de-facto standard for E2E, runs headless in CI, auto-waits (no flaky sleeps), and can boot the site itself via its `webServer` option. We point it at `astro preview` (the _built_ site) rather than `astro dev`, because the built output is what actually deploys.
- **axe** and **Lighthouse** directly protect the two things the brief calls non-negotiable: accessibility (many clients on phones, screen readers) and fast image delivery.

---

## Directory & naming conventions (the scalability backbone)

The suite has to absorb dozens of future components and pages without becoming a boilerplate swamp. The conventions that make that work:

```
src/
  components/
    Hero.astro
    Hero.test.ts        ← component tests co-located with the component
  lib/
    seo.ts
    seo.test.ts         ← unit tests co-located with the util
tests/
  e2e/
    smoke.spec.ts       ← "every page loads" — data-driven, see below
    navigation.spec.ts
    contact-form.spec.ts
  a11y/
    accessibility.spec.ts
  fixtures/
    routes.ts           ← single source of truth for the route list
vitest.config.ts
playwright.config.ts
lighthouserc.json
```

Two decisions that keep it scalable:

1. **Co-locate unit/component tests** (`Foo.astro` → `Foo.test.ts` beside it). When you add a component you add its test in the same folder; nothing to wire up. Vitest globs `**/*.test.ts` automatically.
2. **Data-drive the E2E smoke tests from one route list.** `tests/fixtures/routes.ts` exports the array of routes; `smoke.spec.ts` loops over it. Adding a page means adding one line to that array (or, later, deriving it from `src/pages/`), and it's automatically smoke-tested for a 200 + no console errors. This is the difference between a suite that scales and one where every new page needs a hand-written test.

**One small refactor enables clean schema testing:** today the Zod schema is defined inline inside `defineCollection` in `src/content.config.ts`. Extracting it to an exported `projectSchema` constant lets a Vitest test validate sample frontmatter against it directly — asserting that good data passes and malformed data (missing `title`, bad `date`, non-array `images`) is rejected. As the content model grows, this becomes the guardrail that catches a badly-written project file before it ever reaches the build.

---

## What each layer tests _today_ (stable contracts only)

- **Static:** `astro check` passes with zero errors; ESLint clean; Prettier formatting consistent.
- **Schema (unit):** `projectSchema` accepts a well-formed project and rejects each of: missing required field, wrong `date` type, `images` not an array, malformed `beforeAfter`.
- **Component (unit, Container API):** `BaseLayout` renders a `<nav>` containing links to `/`, `/portfolio`, `/about`, `/contact`; renders `<title>`, `<meta name="description">`, `<footer>`; puts slotted content in `<main>`.
- **Build:** `astro build` exits 0 and emits the expected route set.
- **E2E (Playwright):**
  - Smoke: each route in the fixture list returns HTTP 200 and logs no browser console errors.
  - Navigation: clicking each nav link lands on the right URL; the portfolio grid links through to a `/portfolio/[id]` detail page.
  - Contact form: the form contains inputs named exactly `name`, `email`, `message` (the Formspree contract), all three are `required`, and the honeypot field is present but visually hidden.
  - 404: an unknown URL renders the custom 404 with a working "back home" link.
- **A11y (axe):** each page passes an axe sweep with zero violations (catches missing alt text, unlabelled inputs, low contrast, heading-order issues).
- **Performance (Lighthouse):** budgets asserted on the built Home and Portfolio pages — e.g. performance ≥ 0.9, accessibility ≥ 0.95, no oversized-image warnings. Kept **non-blocking (warn)** at first so it informs without stalling merges, then tightened once real images are optimised in Phase 7.

Deliberately **not** tested yet: exact copy, colours, or layout pixels — all volatile. Visual-regression snapshots (Playwright can do them) are noted as a _later_ option for once the design is locked; running them now would just generate churn.

---

## npm scripts

```jsonc
{
  "check": "astro check", // types + Astro diagnostics
  "lint": "eslint .",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "test": "vitest run", // unit/component, one-shot (CI)
  "test:watch": "vitest", // local TDD loop
  "test:e2e": "playwright test",
  "test:a11y": "playwright test tests/a11y",
  "test:lighthouse": "lhci autorun",
}
```

`npm test` stays the fast inner-loop command (unit only); the browser layers are separate so local runs stay quick and CI can parallelise them.

---

## Continuous integration (GitHub Actions)

The repo is already on GitHub, so GitHub Actions is the zero-setup choice — free for this scale, no external accounts.

`.github/workflows/ci.yml`, triggered on push and PR to `main`:

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .node-version # reuses the pinned Node 22 — no drift with local
          cache: npm
      - run: npm ci # deterministic install from package-lock
      - run: npm run check # 1. static: types
      - run: npm run lint # 1. static: lint
      - run: npm run format:check # 1. static: formatting
      - run: npm test # 2. unit/component
      - run: npm run build # 3. build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e # 4 + 5. e2e + a11y (Playwright boots `astro preview`)
      - uses: actions/upload-artifact@v4 # keep the HTML report on failure
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
```

Design choices that make CI robust and low-maintenance:

- **`node-version-file: .node-version`** reuses the exact Node the project is pinned to — CI and your machine never diverge on Node version.
- **`npm ci`** installs strictly from `package-lock.json`, so a green build is reproducible.
- **Cheapest-first ordering** with fail-fast: a formatting slip or type error stops the run in seconds before the expensive browser step.
- **Playwright's `webServer` config** builds+previews the site automatically, so CI needs no manual server orchestration.
- **Artifact upload** means a failed E2E run leaves a browsable HTML report (screenshots, traces) to diagnose from.
- **Branch protection** (a one-time GitHub setting, not code): require this workflow to pass before merging to `main`. That's what turns the suite into an actual safety net for periodic updates. Currently advisory — not yet enabled.
- **Lighthouse runs as a separate parallel `lighthouse` job** (see the shipped `.github/workflows/ci.yml`), uploading its reports as an artifact; warn-only so a perf blip never blocks the merge gate.

> The YAML above is the illustrative single-job shape; the file actually committed splits E2E and Lighthouse into two jobs for parallelism — see `.github/workflows/ci.yml`.

Later, when Cloudflare Pages deployment is wired up (Phase 4 of the implementation plan), the same workflow can gain a post-deploy smoke test against the live preview URL — but that's an add-on, not a prerequisite.

---

## Suggested build order

The foundation is worth standing up now even on placeholder content, because it's the harness every future feature plugs into — and it immediately protects against regressions as we build Phases 5–10.

1. **Vitest + Container API**, `vitest.config.ts` via `getViteConfig`, plus the schema-extraction refactor and first component/schema tests. _(foundation)_
2. **Playwright**, `playwright.config.ts` with `webServer` → `astro preview`, the route fixture, and the smoke/navigation/contact/404 specs. _(foundation)_
3. **GitHub Actions workflow** wiring 1–2 into CI. _(foundation — this is the "automatable" payoff)_
4. **axe** accessibility specs. _(high value, cheap to add)_
5. **ESLint + Prettier** config and the `lint`/`format:check` steps. _(robustness)_
6. **Lighthouse CI** budgets. _(add once real images arrive in Phase 7, when the numbers mean something)_
7. **Visual-regression snapshots** — optional, once the design is locked.

Steps 1–3 are the scalable, CI-ready core you asked for; 4–7 layer on without disturbing it.

---

## Current status — implemented

The **entire suite (all seven items above except optional visual-regression) is built and passing locally.** Decisions taken: build everything now; CI advisory-first (workflow runs but doesn't yet block merges — flip on branch protection when ready); Lighthouse budgets set now but loose and warn-only.

What exists in the repo:

| Piece             | Files                                                                                                       | Status      |
| ----------------- | ----------------------------------------------------------------------------------------------------------- | ----------- |
| Vitest config     | `vitest.config.ts`                                                                                          | ✅          |
| Schema unit tests | `src/content/schema.ts` (extracted), `src/content/schema.test.ts`                                           | ✅ 6 tests  |
| Component test    | `src/layouts/BaseLayout.test.ts` (Container API)                                                            | ✅ 4 tests  |
| Playwright config | `playwright.config.ts`                                                                                      | ✅          |
| Route fixture     | `tests/fixtures/routes.ts`                                                                                  | ✅          |
| E2E specs         | `tests/e2e/{smoke,navigation,contact-form,not-found}.spec.ts`                                               | ✅          |
| A11y specs        | `tests/a11y/accessibility.spec.ts` (axe)                                                                    | ✅ 5 pages  |
| ESLint            | `eslint.config.js`                                                                                          | ✅ clean    |
| Prettier          | `.prettierrc.json`, `.prettierignore`                                                                       | ✅ clean    |
| Lighthouse        | `lighthouserc.json` (warn-only, filesystem reports)                                                         | ✅ advisory |
| CI                | `.github/workflows/ci.yml` (two jobs: `test` + advisory `lighthouse`)                                       | ✅          |
| npm scripts       | `check`, `lint`, `format`, `format:check`, `test`, `test:watch`, `test:e2e`, `test:a11y`, `test:lighthouse` | ✅          |

Full local run: `astro check` 0 errors, ESLint clean, Prettier clean, **10 unit + 18 Playwright (E2E + a11y) tests passing**, Lighthouse advisory (one warn on contact-page perf ~0.89, expected with remote placeholder images).

Two implementation notes worth remembering:

- **The a11y layer immediately earned its keep** — axe caught a real WCAG AA contrast failure in the placeholder palette (muted body text at 4.19:1, under the 4.5:1 floor). Fixed by consolidating muted text to `text-forest/80` (5.47:1), which improved the actual site, not just the test.
- **The schema now imports `z` from `zod` directly** rather than the (deprecated) re-export from `astro:content`, so the `z.infer` project type resolves under `astro check`. The build still validates content identically.

### Not yet done (deliberately)

- **Branch protection** — the CI workflow is advisory until you enable "require status checks" on `main` in GitHub's branch settings (a one-time UI toggle, no code). Say the word and I'll write up the exact steps.
- **Visual-regression snapshots** — deferred until the design is locked (step 7).
- **Post-deploy smoke test** against the live Cloudflare preview URL — waits on Phase 4 deployment.
- As new components/pages land (hero, before/after slider, lightbox, mobile-nav), each gets a co-located `*.test.ts` and, for new routes, one line in `tests/fixtures/routes.ts` — the suite was built to absorb them without restructuring.
