# Show & Tell Notes — building this site with an AI agent

Speaker notes for a short work talk on using AI outside of work. Not a deck — the
plan is to show the live site and parts of this codebase while talking. Companion
to the three planning docs: [development plan](website-development-plan.md),
[technical implementation plan](technical-implementation-plan.md),
[testing plan](testing-plan.md).

---

## 1. The framing

My mum is turning an amateur gardening hobby into a freelance business and needed
a website. I used it as an excuse to find out what it is actually like to build
something end-to-end with an AI agent as the primary author — not autocomplete,
but plan → build → test → CI → deploy.

Two things to say up front, because they set expectations honestly:

- It is a **small** site — four pages. The interesting part is not the complexity,
  it is the process.
- It is **still a prototype in places**. Real photos and the real business name
  are in; her bio copy and two of the three portfolio projects are placeholders.
  It is deliberately blocked from Google until launch.

## 2. Numbers worth quoting

|                               |                                                     |
| ----------------------------- | --------------------------------------------------- |
| Commits                       | 35, across 10 pull requests                         |
| Commits co-authored by Claude | 21 of the 25 non-merge commits                      |
| Source                        | ~1,560 lines (`src/`)                               |
| Tests                         | ~810 lines — 20 unit + 164 browser tests, all green |
| Calendar time                 | ~9 days of evenings (20–29 July 2026)               |
| Hosting cost                  | ~£1/month amortised — just the domain               |

## 3. The stack, and why each piece

Put the stack table near the top of
[technical-implementation-plan.md](technical-implementation-plan.md) on screen.

**Languages:** TypeScript (strict), HTML, CSS, a little vanilla JavaScript,
Markdown, YAML.

- **[Astro](astro.config.mjs) 7** — static site generator. The key property: it
  ships **zero JavaScript by default**. Every page is pre-rendered HTML and JS
  appears only where you explicitly opt in. For a photo-heavy brochure site that
  is exactly right.
- **Tailwind CSS 4** — utility classes, no separate stylesheet to maintain. Worth
  showing that Tailwind 4 has **no `tailwind.config.js`**: the design tokens are
  CSS variables in an `@theme` block in [src/styles/global.css](src/styles/global.css).
  Changing the whole palette is a one-file edit.
- **Astro content collections + Zod** — each portfolio project is a Markdown file
  in [src/content/projects/](src/content/projects/) validated against the schema
  in [src/content/schema.ts](src/content/schema.ts). No CMS, no database. Bad
  frontmatter fails the _build_, not at runtime.
- **Vanilla JS islands** — mobile nav, image lightbox, before/after slider. No
  React, no framework.
- **Formspree** for the contact form, **Cloudflare Pages** for hosting (auto-deploys
  on push to `main`, free HTTPS), **JSON-LD** structured data for local SEO.
- **Node 22.12** pinned in [.node-version](.node-version), so my machine and CI
  cannot drift apart.

### The testing stack — worth dwelling on

Show the five-layer pyramid table in [testing-plan.md](testing-plan.md).

1. **Static** — `astro check` (types), ESLint, Prettier
2. **Unit / component** — Vitest, using Astro's Container API to render an
   `.astro` component to an HTML string in memory
   ([BaseLayout.test.ts](src/layouts/BaseLayout.test.ts))
3. **Build** — `astro build` must succeed
4. **End-to-end** — Playwright against the _built_ site, never the dev server,
   because the built output is what deploys
5. **Accessibility and performance** — axe-core sweeps every page, Lighthouse CI
   budgets

[.github/workflows/ci.yml](.github/workflows/ci.yml) runs these **cheapest-first**,
so a formatting slip fails in seconds rather than after a two-minute browser run.
Lighthouse is a separate advisory job that never blocks a merge.

Two decisions in the suite to point at as the good engineering:

- **[tests/fixtures/routes.ts](tests/fixtures/routes.ts) is a single source of
  truth.** Adding a page means adding _one line_ there, and it is then
  automatically smoke-tested and accessibility-swept. The suite scales without
  boilerplate.
- **Test contracts, not copy.** Nothing asserts "the hero says X" — placeholder
  copy changes constantly. It asserts mechanisms: routes return 200, the contact
  form exposes the exact field names Formspree needs, images have alt text, the
  schema rejects malformed data.

Every spec runs at **two viewports** (desktop Chromium and a Pixel 7), because
most of her clients will find her on a phone.

## 4. The workflow

Probably the most transferable part for colleagues.

**Plan first, in prose, before any code.** Three planning docs are checked into
the repo and drive everything — the brief and stack rationale, ten numbered build
phases with a running status log, and the test plan.

**The guiding principle, quotable from the plan:** _"get a thin, ugly, working
version of the whole site live first, then thicken it in passes."_ Deploy was
**Phase 4 of 10**, deliberately out of order, so every later decision was
validated against real hosting instead of surprising me at the end.

**One branch and one PR per phase.** `git log --oneline` reads like the plan:
`geobarnes/phase5-slider`, `geobarnes/mobile-nav`, `geobarnes/lightbox-testimonials`,
`geobarnes/contact-form`, `geobarnes/motion`, `geobarnes/seo-and-contact-redirect`,
`geobarnes/perf-fonts-and-images`. CI runs on every PR.

**Full CI chain locally before committing.** `npm run test:all` runs the same
steps in the same order as CI, so green locally means green in CI.

## 5. How I actually used AI

### The agent is the author; I am the reviewer and the taste

I am not typing the code. I set direction, review diffs, catch what looks wrong,
and make the judgement calls. The planning docs were written in conversation with
the model first — arguing about stack, cost and trade-offs — and only then did any
code get written.

### `CLAUDE.md` is the interesting artefact — show this file

[CLAUDE.md](CLAUDE.md) is persistent project memory the agent reads at the start
of every session. It is not documentation for humans, though it works as that. It
is **hard-won context that would otherwise be re-learned and re-broken every
session.** Lines worth reading aloud:

- _"Trailing slashes are mandatory on internal links"_ — and why (Cloudflare
  308-redirects otherwise).
- _"View transitions change how every script must be written"_ — a whole paragraph
  on why a listener bound to an element silently dies when the page body is
  swapped, and what to do instead.
- _"Deleting a content file needs the cache cleared"_ — a genuinely obscure gotcha
  that cost time once and now costs zero.
- _"The testimonials collection is empty on purpose… Do not substitute placeholder
  quotes: a fabricated testimonial is a lie about a real business."_

That last one is a nice moment: **an AI-authored instruction to the AI not to
invent social proof.** [Testimonials.astro](src/components/Testimonials.astro)
renders _nothing at all_ — no heading, no empty container — until a real
testimonial file exists, because an empty "What clients say" section reads as a
gap in the business rather than in the content.

### The commit messages are the real documentation

Show a full message from `git log`. The best one is `05da5bf`, "Replace PhotoSwipe
lightbox with a minimal dependency-free one": it explains the Safari symptom, why
the fix is a replacement rather than a patch, what was kept, what was dropped (a
~59KB dependency), and how it was verified. That is a level of commit hygiene I
would honestly not sustain by hand.

### Three moments where the process visibly worked

**a) The accessibility layer caught a real bug on day one.** Axe found muted body
text in the placeholder palette at a 4.19:1 contrast ratio, under the 4.5:1 WCAG
AA floor. Fixed properly, which improved the actual site, not just the test.

**b) The plan got overruled — twice — on dependency grounds.**

- The plan said use Motion One for scroll reveal. The implementation reasoned that
  if you pick Motion One over GSAP on footprint grounds, the same logic one step
  further lands on _no library at all_, since the effect is a fade and a 1rem rise
  — two CSS declarations.
- PhotoSwipe went in for the lightbox, then kept desyncing from Astro's view
  transitions. Rather than keep patching it, it was replaced with a small
  hand-rolled overlay delegated to `document`
  ([ProjectGallery.astro](src/components/ProjectGallery.astro)). Net: a dependency
  deleted, and a whole class of bug made impossible.

**c) Costs get stated honestly rather than hidden.** From the plan: _"every page
now downloads ~15.7KB (~6KB gzipped) of ClientRouter where before the only
always-present JS was a few hundred inlined bytes… the 'zero JS by default' claim
is now 'one small bundle by default'. Worth revisiting if the wow factor turns out
not to earn it."_ This is the behaviour I most wanted from an AI collaborator —
recording the price of a decision instead of declaring victory.

### Where AI is _not_ useful — the branch I am currently on

Show `git log main..HEAD`. Four commits, all touching one CSS variable:

```
Warm the page background from white to a soft off-white
Use sage rather than cream for the warm background
Use warm stone for the background, and lighten the teaser band
Settle on cream for the warm background
```

Cream → sage → stone → back to cream. That is not the model failing; that is
**taste being my job**. The model can execute a palette change in seconds, which
makes iterating cheap — but it cannot tell me which one looks right.

### The polish pass — the evening before the talk

The last piece of work is a good closing example of the workflow, because it
was the biggest single change and took one evening. I asked for a menu of
improvements rather than a change, picked from it, and then let the agent run
the whole plan against the test suite.

What landed: an editorial hero with a slow drift, a photo strip and a featured
project on the home page, service cards with hand-drawn icons and a staggered
reveal, a sticky frosted header with active-link state, a three-column footer,
portfolio cards whose cover photo **morphs into the project page** using the
view transitions that were already there, a case-study layout with prev/next
links, two-column About and Contact pages, a real favicon and share image, and
a fix to the thank-you page, which still had a fake phone number hardcoded in
it — exactly the drift the "business details have one home" rule in CLAUDE.md
exists to prevent.

Things worth saying out loud about it:

- **The a11y sweep did its job again.** The first run failed on every page:
  the new muted-text tints (`text-forest/70`) were at 3.9:1, under the 4.5:1
  floor. One search-and-replace later, green. Nobody eyeballs that.
- **Two test edits, both scoping rather than weakening.** The lightbox spec
  had asserted thumbnails link to an `https://` URL — true only while the
  images were remote placeholders. It now asserts the link ends in an image
  extension. The contact spec's "shows an email link" locator became
  ambiguous once the footer also had one, so it is scoped to `<main>`.
- **Costs, stated, and measured.** Lighthouse (throttled phone) on the home
  page: `main` scored 88 with a 3.8 s largest paint; the first cut of this
  branch scored 75 with 5.7 s. Bisecting variants of the built output found
  the two causes — the 80 KB italic font file for one word in the headline,
  and the photo strip's thumbnails loading alongside the hero. Fixes: the
  italic is now a 20 KB lowercase-only subset generated with fontTools, and
  the thumbnails are smaller and lower quality. Final: 80, with a 4.8 s
  largest paint. The remaining second is the photo strip, kept on purpose —
  it is the best thing on the page — and the budget is warn-level, not
  blocking. Worth saying to the room: the score went _down_ on this branch
  and I am showing it anyway.
- **The About bio is a draft**, written to be true of any gardener turning
  professional and marked as such in the source. No years of experience,
  qualifications or client counts appear anywhere, because none have been
  given to me.

## 6. What to have on screen, in order

1. **The live site** — <https://gardening-website.pages.dev>. Resize to phone
   width for the hamburger nav, click a gallery photo for the lightbox, open a
   project with a before/after slider.
2. **[CLAUDE.md](CLAUDE.md)** — the persistent-memory idea is the thing most
   colleagues will not have seen.
3. **`git log`** — the phase-per-PR rhythm, and one full commit message.
4. **[tests/fixtures/routes.ts](tests/fixtures/routes.ts)** and
   [.github/workflows/ci.yml](.github/workflows/ci.yml) — the one-line-per-page
   scaling trick and the cheapest-first pipeline.
5. **[src/styles/global.css](src/styles/global.css)** — the `@theme` block, a
   whole palette in eight lines.
6. Optional: run `npm test` live — 20 unit tests in about a second, green. The
   full chain (`npm run test:all`) adds 164 browser tests and takes a couple of
   minutes, so only run that one if the room has patience.

## 7. Caveats to raise before someone else does

- This is a **small, low-risk, greenfield** project with no auth, no database, no
  legacy code and no other contributors — the easiest possible case for an agent.
  I would not claim it generalises straight to a large existing codebase.
- **The test suite is what makes it work.** Without it I would be reviewing diffs
  on trust. The tests are what let me accept a change I did not write.
- Still placeholder: her bio copy, two of the three portfolio projects, the
  social-share image. [`SITE_INDEXABLE`](src/config.ts) is `false`, so every page
  is `noindex` until it is real — with a test that fails loudly as the reminder.
- **I still reviewed everything.** The value was not "AI wrote it while I watched".
  It was that the boring 80% — test scaffolding, CI config, meta tags, commit
  messages — stopped being a reason to skip doing it properly.

## 8. The line to land on

> The thing that surprised me is not that AI can write the code. It is that it
> removed the excuse for skipping the parts I would normally skip on a personal
> project — the tests, the CI, the accessibility sweep, the written-down
> reasoning. This is a four-page website for my mum, and it has a five-layer test
> pyramid and a CI pipeline. A year ago it would have had neither.

---

## Pre-talk checklist

- [ ] `npm run test:all` green
- [ ] <https://gardening-website.pages.dev> still serving (last verified July 2026)
- [ ] Terminal font size bumped; editor on a light theme if the room projector is weak
- [ ] Phone-width browser window ready for the mobile nav demo
