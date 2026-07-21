# Technical Implementation Plan — Mum's Gardening Website

This turns the [development plan](website-development-plan.md) into a concrete build sequence. The guiding principle: **get a thin, ugly, working version of the whole site live first**, then thicken it in passes. That way every decision (palette, copy, gallery layout) gets tested against a real deployed page instead of imagined in the abstract — and if the scope shifts (it will), you've only sunk effort into a skeleton, not a finished facade.

**Status: Phases 1–3 below are done** — the repo now has a running Astro + Tailwind skeleton with all four routes (see the summary at the end of this doc for what to expect and what's next).

Confirmed on this machine already: git configured. One prerequisite came up during setup: the current Astro scaffolding tool requires **Node.js 22.12+**, but this machine had v20.0.0. We installed **fnm** (Fast Node Manager) via Homebrew, added its shell hook to `~/.zshrc`, installed Node 22 through it, and pinned this project to Node 22 via a `.node-version` file — the system-wide Node install elsewhere on the machine is untouched. If you open a fresh terminal in this repo, fnm will auto-switch to Node 22.

---

## Tech stack at a glance

| Layer           | Technology                                              | Purpose                                                                                                                 |
| --------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Framework       | **Astro**                                               | Static site generator; ships zero JS by default, only hydrates interactive bits you mark explicitly                     |
| Styling         | **Tailwind CSS**                                        | Utility-class CSS, no separate stylesheet to maintain                                                                   |
| Content         | **Markdown/MDX + Astro Content Collections**            | Type-checked content (bio, portfolio entries) as files in the repo, no CMS/database                                     |
| Language        | **TypeScript** (light touch)                            | Used for content schemas and component props; you can write plain JS in `.astro` frontmatter if you'd rather skip types |
| Interactivity   | **Vanilla JS / small islands**, optional **Motion One** | Mobile nav, lightbox, before/after slider, scroll-reveal — only where truly needed                                      |
| Structured data | **JSON-LD** (plain JSON in a `<script>` tag)            | LocalBusiness schema for local SEO                                                                                      |
| Forms           | **Formspree** (or Resend + Cloudflare Function later)   | Handles form submissions with zero backend code                                                                         |
| Hosting         | **Cloudflare Pages**                                    | Free, auto-deploys on git push, free HTTPS                                                                              |
| Version control | **Git + GitHub**                                        | Already initialised in this repo                                                                                        |

---

## Phase 1 — Project scaffolding

**Goal:** a running Astro site on localhost.

```bash
npm create astro@latest -- --template minimal --typescript strict
```

This scaffolds into the repo root. Note: `create-astro` refuses to scaffold directly into a non-empty directory, and this repo already had planning docs in it — the workaround was scaffolding into a throwaway temp folder, then copying the generated `src/`, `public/`, `astro.config.mjs`, `tsconfig.json`, `package.json`, and `.gitignore` into the repo root (skipping its auto-generated `README.md`/`AGENTS.md` since this repo already had its own docs).

Then add Tailwind as an Astro integration — this wires up the build config automatically:

```bash
npx astro add tailwind
```

Run it locally:

```bash
npm run dev
```

This gives you a hot-reloading dev server, typically at `localhost:4321`.

**File structure you'll end up with:**

```
src/
  pages/        → each file = a route (index.astro → "/")
  layouts/      → shared page shells (nav, footer, <head>)
  components/   → reusable pieces (Hero, GalleryGrid, etc.)
  content/      → Markdown/MDX content collections (added in Phase 3)
  styles/       → any global CSS (minimal with Tailwind)
public/         → static files served as-is (favicon, robots.txt)
astro.config.mjs
tailwind.config.mjs
```

**What `.astro` files look like:** a frontmatter block of JS/TS between `---` fences (for imports and logic), followed by HTML with Tailwind classes and `{expression}` interpolation — similar to JSX but compiles to zero client JS unless you opt in.

---

## Phase 2 — Design tokens & base layout

**Goal:** one shared layout so every page has consistent nav/footer/meta, with placeholder brand colours and fonts you can swap later without touching pages.

Tailwind v4 (what `npx astro add tailwind` installs today) configures theme tokens in CSS rather than a `tailwind.config.mjs` file. In `src/styles/global.css`:

```css
@import 'tailwindcss';

@theme {
  --color-forest: #2f4a3d;
  --color-forest-light: #4a6a58;
  --color-earth: #8a7a63;
  --color-earth-light: #b5a58c;

  --font-display: 'Fraunces', serif; /* placeholder — swap for whatever suits her brand */
  --font-body: 'Inter', sans-serif;
}
```

Each `--color-*`/`--font-*` variable automatically becomes a utility class (`bg-forest`, `text-forest-light`, `font-display`, etc.) — no separate config file to keep in sync. Pull the fonts from Google Fonts via a `<link>` in the layout `<head>`, or self-host later for performance.

Build `src/layouts/BaseLayout.astro`: accepts a `title`/`description` prop, renders `<head>` meta tags, a `<nav>` (Home/Portfolio/About/Contact links), a `<slot />` for page content, and a `<footer>`. Every page wraps itself in this layout.

**Prototype bar:** don't agonise over exact hex codes or font pairing yet — pick something reasonable and move on. This is the easiest thing to change later; the page structure is not.

---

## Phase 3 — Skeleton pages with placeholder content

**Goal:** all four routes exist and link to each other, using placeholder text/images so the whole site can be clicked through end-to-end.

Create `src/pages/index.astro`, `portfolio.astro`, `about.astro`, `contact.astro`, each using `BaseLayout`.

For the portfolio, set up a **Content Collection** so each project is a structured file rather than hardcoded HTML:

`src/content.config.ts` (current Astro versions use this project-root path with an explicit loader, rather than the older `src/content/config.ts` convention):

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    images: z.array(z.string()),
    beforeAfter: z.object({ before: z.string(), after: z.string() }).optional(),
    date: z.coerce.date(),
  }),
});

export const collections = { projects };
```

Then each project is a Markdown file in `src/content/projects/`, e.g. `oak-lane-border.md`, with frontmatter matching that schema and a body for extended notes. At prototype stage, create 2–3 dummy entries with placeholder images (free stock photos, or plain grey boxes) so the gallery loop has something to render. Fetch them in a page with `getCollection('projects')` from `astro:content`.

The `about.astro` page can start with lorem-ipsum-style placeholder bio text — real copy comes in Phase 7.

**Milestone check:** you should be able to click Home → Portfolio → About → Contact and back, on a real (if ugly) page for each.

---

## Phase 4 — Deploy the skeleton immediately

**Goal:** a live URL, even though it looks rough. This is deliberately out of numeric order versus the original plan — deploying early means every subsequent change is validated against the real build/hosting pipeline instead of surprising you at the end.

1. Push the repo to GitHub (if not already remote-tracked).
2. In Cloudflare Pages: "Create a project" → connect the GitHub repo → build command `npm run build`, output directory `dist`.
3. Every push to `main` now auto-deploys.

You (and your mum, if you want early feedback) can now view progress on a real phone at a real URL throughout the rest of the build.

---

## Phase 5 — Core interactive components

**Goal:** the signature pieces that make this feel like a real portfolio site, built to "works" quality first.

- **Hero** — full-bleed image + heading + CTA button. Static, no JS needed.
- **Gallery grid** — CSS grid of thumbnails from the `projects` collection, click to open a lightbox. Simplest path: a small existing web-component lightbox (e.g. `photoswipe` or similar) loaded only on the portfolio page via an Astro island (`client:visible`), so it doesn't cost JS weight anywhere else.
- **Before/after slider** — the single most persuasive element per the original plan. Easiest build: the `img-comparison-slider` web component (a few KB, no framework needed) — drop it in, feed it the `before`/`after` fields from the content collection. Alternative: hand-roll with a range input driving a CSS clip-path, if you'd rather avoid a dependency.
- **Testimonial block** — static component with a placeholder slot/quote until she has real ones.
- **Mobile nav** — a hamburger toggle; a few lines of vanilla JS (`<script>` tag scoped to the component) toggling a Tailwind class is enough, no library needed.

Astro's "islands" model matters here: everything above is static HTML except the lightbox/slider/nav-toggle, which get a `client:*` directive so only _those_ components ship JS to the browser.

---

## Phase 6 — Contact form (functional, not fancy)

**Goal:** a form that actually delivers messages to an inbox.

Simplest path — **Formspree**: sign up free, get an endpoint URL, point a plain HTML `<form action="https://formspree.io/f/xxxx" method="POST">` at it with `name`, `email`, `message` fields. No JS or backend code required. Add:

- A hidden honeypot field (a text input visually hidden via CSS that bots fill in but humans don't — Formspree/your own check can reject submissions where it's non-empty).
- Her phone number and email as plain visible text nearby, for people who'd rather not use a form.

Later upgrade path (not needed for prototype): swap to a Cloudflare Pages Function (a TypeScript file in `functions/`) calling the Resend API, if you want emails sent from your own domain rather than through Formspree's branding.

---

## Phase 7 — Real content pass

**Goal:** replace every placeholder with the real thing.

- Swap placeholder images for her actual photography (once shot/selected), run each through Astro's built-in `<Image />` component (`import { Image } from 'astro:assets'`) so it auto-generates responsive AVIF/WebP variants and enforces explicit `width`/`height` (prevents layout shift).
- Replace lorem-ipsum bio/project text with her real copy, written in her voice.
- Add `loading="lazy"` (Astro's `<Image>` does this by default for non-priority images) for anything below the fold; the hero image should instead be eager-loaded/priority since it's the first thing seen.

---

## Phase 8 — Motion & polish

**Goal:** the "wow factor," applied sparingly.

- Enable Astro's built-in **View Transitions**: import `<ClientRouter />` from `astro:transitions` into `BaseLayout.astro` (inside `<head>`) for smooth cross-page fades — this is the current component name as of Astro 7.
- Add gentle scroll-reveal with **Motion One** (smaller footprint than GSAP for this scale of site): a small JS snippet observing elements entering the viewport and animating opacity/transform. Apply to maybe 3–4 elements per page, not everything — restraint is the actual design choice here.

---

## Phase 9 — SEO & structured data

**Goal:** findable, not just pretty.

- Add a shared `<SEO>`-style partial in the layout emitting per-page `<title>`, meta description, and Open Graph tags (`og:title`, `og:image`, etc.), fed by props each page passes in.
- Add a `LocalBusiness` JSON-LD block (plain JSON inside a `<script type="application/ld+json">` tag) on the About/Contact pages with her business name, service area, phone, and email.
- Add the `@astrojs/sitemap` integration (`npx astro add sitemap`) for an auto-generated sitemap.xml, and a `public/robots.txt`.
- Manual (non-code) steps: register a free Google Business Profile, and submit the sitemap in Google Search Console once live.

---

## Phase 10 — Domain & launch checklist

- Register a domain (Cloudflare Registrar or Namecheap) and point it at the Cloudflare Pages project — HTTPS is automatic.
- Add a custom `src/pages/404.astro`.
- Run Lighthouse in Chrome DevTools against the live URL; fix anything glaring (usually image sizing or contrast).
- Test on a couple of real phones.
- Verify the OG image/preview renders correctly when the URL is shared (e.g. paste it into a WhatsApp/iMessage draft).

---

## Suggested order recap

1. Scaffold Astro + Tailwind (Phase 1–2)
2. Skeleton pages + placeholder content (Phase 3)
3. **Deploy — get a live URL** (Phase 4)
4. Build the interactive components (Phase 5)
5. Wire the contact form (Phase 6)
6. Swap in real photos/copy (Phase 7)
7. Motion polish (Phase 8)
8. SEO + structured data (Phase 9)
9. Domain + launch checklist (Phase 10)

Steps 1–6 are the "prototype" — everything after is refinement that can happen in any order, iteratively, without blocking on each other.

---

## Current status

Phases 1–3 are built and verified (`npm run build` succeeds, all routes return correct status codes, real content from the collection renders):

- Astro + Tailwind v4 scaffolded at the repo root, TypeScript strict mode.
- `src/layouts/BaseLayout.astro` — shared nav/footer/meta, placeholder brand colours (`forest`, `earth`) and fonts (Fraunces/Inter) as CSS `@theme` tokens in `src/styles/global.css`.
- `src/content.config.ts` + `src/content/projects/*.md` — a working content collection with two placeholder entries.
- Four routes: `/` (Home), `/portfolio` (grid pulling from the collection) with `/portfolio/[id]` detail pages, `/about`, `/contact` (Formspree-shaped form, not yet wired to a real endpoint, plus a honeypot field and plain-text phone/email fallback), and a custom `/404`.
- All imagery is `placehold.co` placeholder boxes — swap for real photos in Phase 7.

**Phase 4 is done** — the site is live at [gardening-website.pages.dev](https://gardening-website.pages.dev), auto-deploying from `main` via Cloudflare Pages. All routes verified against the deployed build, including the custom 404.

Two follow-ups landed alongside it:

- `trailingSlash: 'always'` in `astro.config.mjs`, with every internal link updated to match. Cloudflare serves directory-style output and was 308-redirecting each unslashed path; emitting the canonical form removes a round-trip per navigation. Note the knock-on: under this setting `astro preview` answers unslashed unknown paths with its _own_ 404 rather than ours, so `tests/e2e/not-found.spec.ts` requests the slashed form (Cloudflare serves ours either way — verified live).
- **Phase 5 has started**: the before/after slider is built (`src/components/BeforeAfterSlider.astro`), using the `img-comparison-slider` web component, rendering on any project whose frontmatter has a `beforeAfter` block. Its ~11KB of JS is scoped to the component, so it ships only on project detail pages — covered by a test that asserts exactly that.

Still to build: lightbox, mobile nav toggle, testimonial block (rest of Phase 5), Motion One scroll-reveal, View Transitions, real Formspree endpoint (Phase 6 — needs an endpoint URL), JSON-LD/SEO tags, sitemap, real photos and copy.

**Known perf note:** the project detail pages score 0.87 against a 0.9 performance budget (warn-level, non-blocking). The cause is not the slider — total blocking time is 0ms. It is the render-blocking Google Fonts stylesheet (~874ms) and `placehold.co` images serving as the LCP element. Both resolve naturally in Phase 7 when real, locally-optimised images land and the fonts can be self-hosted.

To run it locally: `npm run dev`, then visit `http://localhost:4321`.

---

## Open questions

A few decisions shape the early phases — happy to just pick sensible defaults and adjust later if you'd rather not decide upfront:

1. **Repo layout** — should the Astro project live at the repo root, or in a subfolder (e.g. `site/`) alongside the planning docs?
2. **Photos right now** — do you have any real images to drop in yet, or should I scaffold with stock/placeholder images for the first pass?
3. **Hosting account** — do you already have a Cloudflare (or Netlify/Vercel) account, or should the plan assume you'll set one up when we reach Phase 4?
4. **How hands-on do you want to be** — want me to actually run the scaffolding commands and start building now, or would you rather review this plan first and kick off implementation in a separate pass?
