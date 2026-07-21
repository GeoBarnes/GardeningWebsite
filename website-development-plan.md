# Mum's Gardening Website — Development Plan

What a lovely project. The good news is your brief actually makes the stack simpler than the generic plan — this is a small, image-led brochure site with no logins, no database, and no e-commerce. That means the earlier Astro recommendation holds up even better here, and we can pour the saved effort into the two things that matter most for your mum: making the photography sing and helping local clients actually find her. Here's the revised plan.

## What changes with this brief

The site is essentially four pages — a striking Home, a Portfolio/Gallery of her work, an About page for her profile and gardening style, and Contact. Because you're adding the photos yourself and updates will be infrequent, you don't need a CMS at all; content can live as MDX/Markdown in the repo. The real design challenge is the "wow factor," and for a photo-heavy gardening site that comes almost entirely from three things: great images, fast image delivery, and tasteful motion.

## Revised stack

- **Framework:** Astro (unchanged, and now an even better fit — content-light, image-heavy, superb performance). Its built-in `<Image>` component auto-generates responsive, modern-format (AVIF/WebP) images, which is essential so a gallery of high-res garden photos loads instantly rather than crawling.
- **Styling:** Tailwind CSS, with a deliberately natural palette (deep greens, earthy neutrals) and a confident display font paired with a clean body font. Good type and colour do more for "polished" than any effect.
- **Motion / wow factor:** keep it subtle and purposeful. Astro's built-in View Transitions for smooth page changes, plus a light library like Motion One or GSAP for gentle scroll-reveal and a full-bleed hero image. A before/after image slider is worth building specifically — for gardening work it's the single most persuasive element you can put in a portfolio.
- **Content:** MDX in the repo. No CMS needed now; flagged below when you might want one later.
- **Hosting / forms / analytics:** unchanged — Cloudflare Pages/Netlify/Vercel free tier, Formspree or Resend for the contact form, Cloudflare Web Analytics (free) or Plausible if you want something prettier.

## Step by step

1. **Photography first.** This is the highest-leverage step by far — the site will only ever look as good as its images. If her existing photos are casual phone snaps, consider re-shooting a few key projects in good light, ideally with before/after pairs. No code decision matters as much as this. *Cost: £0 (or a day with a decent phone/camera).*
2. **Scope and design direction.** Sitemap (Home, Portfolio, About, Contact), plus a mood/design direction — pick your palette, fonts, and one or two signature moments (the hero, the before/after slider). Write her profile copy in her own voice; "accomplished amateur turning professional" is a genuinely appealing story, so lean into it. *Cost: £0.*
3. **Project setup.** `npm create astro@latest`, add Tailwind, set up Git. Establish design tokens (colours, type scale, spacing) up front. *Cost: £0.*
4. **Build the pages and signature components.** Reusable hero, gallery grid (with a lightbox for full-size viewing), before/after slider, testimonial block (leave a slot even if she has none yet), and a clear call-to-action to contact her. Prioritise accessibility and a flawless mobile layout — many local clients will find her on a phone. *Cost: £0.*
5. **Optimise the imagery.** Run everything through Astro's `<Image>`, lazy-load below-the-fold photos, and set explicit dimensions to avoid layout shift. This is what keeps a photo-rich site feeling fast and premium. *Cost: £0.*
6. **Contact form.** Formspree free tier (~50 submissions/mo is plenty for a new business) or a Resend-backed serverless function. Include her phone and email as plain text too — some clients just want to call. Add a honeypot or Cloudflare Turnstile for spam. *Cost: £0.*
7. **Local SEO — don't skip this.** A beautiful site she can't be found through won't win clients. Add LocalBusiness JSON-LD structured data (name, service area, contact), per-page meta and Open Graph tags, and a sitemap. Crucially, set up a free Google Business Profile for her — for a local gardener this often drives more enquiries than the website itself, and the two reinforce each other. *Cost: £0.*
8. **Deploy and domain.** Connect the repo to Cloudflare Pages for auto-builds. Register a domain via Cloudflare Registrar (at cost) or Namecheap — something like hernamegardening.co.uk. HTTPS is automatic and free. *Cost: ~£8–12/year, and .co.uk domains are often cheaper.*
9. **Launch checklist.** Test on real phones, run Lighthouse, verify OG previews, submit the sitemap to Google Search Console, and add a custom 404. *Cost: £0.*

## Cost summary

Effectively unchanged — the floor is still just the domain, around £1/mo amortised. Even adding Plausible analytics keeps you near £8/mo, comfortably under your £30 ceiling. For a site this size you should never approach that limit.

## Limitations and alternatives

- The site lives or dies by the photos. No stack choice compensates for weak imagery; conversely, great photos on a simple layout will already impress. Budget your effort accordingly.
- A pretty site isn't a marketing strategy. For a first-client business, discoverability (Google Business Profile, local directories, word of mouth) will likely matter more than the site itself. The website is her credibility anchor — the thing people check after hearing about her — so polish is well spent, but pair it with the free local-listing work.
- No CMS means she can't edit it herself. That's fine while you're maintaining it, but if you'd rather she add new project photos without calling you, wire in a git-based CMS like Decap (free) or Sanity's free tier later. Easy to add to Astro after launch.
- Motion is a double-edged sword. Overdone animation reads as amateur, not premium. Err toward restraint — one confident hero and smooth transitions beat a dozen effects.
- **No-code alternative:** if your time is tight, Framer or Webflow (~£12–16/mo) get a polished, animated result faster and let her edit content herself, at the cost of a monthly subscription and less flexibility. Since you're a comfortable developer, the Astro route is cheaper and more bespoke — but if this competes with a busy job, a paid builder is a reasonable trade.

---

One caveat to carry over: free-tier limits and subscription prices change fairly often, so confirm the live figures for whichever host, form service, and analytics tool you settle on before committing.
