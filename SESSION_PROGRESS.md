# REX Bunny Services — Session Progress

## Site: `rexbunnyservices.online`
## Repo: `https://github.com/rexbunnyservices-star/rexbunnyservices.git`
## Last commit: `140a10f` (SEO Phase 2-4)
## Last updated: July 2, 2026

---

## Completed

### Phase 1 — Critical SEO Bugs Fixed
- robots.txt sitemap URL fixed
- About/Contact title tags keyword-optimized
- Broken portfolio link fixed
- Domain unified to `.online` everywhere

### Phase 2 — Internal Linking (15 files)
- All 7 blog posts have 4 cross-links each
- 3 service pages link to case studies
- 3 case studies link to services + blog
- Navigation updated with Blog & Portfolio

### Phase 3 — Schema & Structured Data (5+ files)
- FAQPage schema on homepage
- Article schema on all blog post templates
- CaseStudy schema on all portfolio templates
- Product/Offer schema on pricing page (3 tiers)
- Dynamic BreadcrumbList in BaseLayout
- Breadcrumbs on all service, blog, portfolio pages

### Phase 4 — Content Expansion
- About page expanded to ~400+ words
- Contact page: NAP block added
- Service page H1s now include primary keywords
- Sitemap includes `<lastmod>` for all URLs
- Email corrected to `.com` across all files

### Phase 5 — Full Repositioning as Marketing Agency (July 2, 2026)
- **New AEO service page** (`/services/aeo`) — Answer Engine Optimization
- **Homepage repositioned** — New hero, tagline, 4-card service grid (SEO/GEO/AEO/Web Dev)
- **About page rewritten** — Marketing agency positioning with all 4 disciplines
- **Pricing restructured** — 4 separate service lines (SEO, GEO, AEO, Web Dev) + bundles with 15-25% discounts
- **Navigation updated** — AEO added, reordered by service priority
- **Footer updated** — AEO added, marketing agency tagline
- **BaseLayout schema** — Updated organization description for marketing agency
- **Service pages** — All 3 repositioned with marketing agency framing
- **Lead Engine page** — Updated to reflect SEO/GEO/AEO audit scope
- **Blog index** — Description updated
- **llms.txt** — Updated with AEO, marketing agency description
- **Sitemap** — Added `/services/aeo`
- **New AEO blog post** — "What is AEO? Answer Engine Optimization Guide for 2026"

### Phase 6 — Backlinks Strategy & Blog Expansion (July 2, 2026)
- **Directory submission copy** (`scripts/directory-submissions.md`) — Ready-to-paste descriptions for AI and SEO directories
- **Linkable asset page** (`/ai-search-statistics`) — 12 stats, 4 analysis sections, methodology — designed to attract natural backlinks
- **Blog expansion** — All 7 existing posts expanded from ~375 words to 800+ words each
  - GEO vs SEO 2026 → 800+ words
  - How to Get Cited in ChatGPT → 800+ words
  - Sub-Second Lighthouse Scores → 800+ words
  - llms.txt Explained → 800+ words
  - Optimize for Perplexity → 800+ words
  - Programmatic Local SEO → 800+ words
  - What is GEO? → 800+ words
- **Sitemap + llms.txt** — Updated with new research page
- **BaseLayout** — Added significant links for AEO and statistics page

### Previously Done
- 8 blog posts (MDX) with internal links (7 expanded, 1 new AEO post)
- 3 case studies (MDX) with cross-links
- Exit-intent popup for GEO checklist
- Case study carousel on homepage
- Latest blog posts section on homepage
- Testimonials + client logos on homepage

---

## Next Steps (continue from here)

1. ✅ **Google Search Console** — Property added, sitemap submitted
2. ✅ **Logos** — Already in place (`public/images/logo.png`, `logo-mark.png`, `og-image.svg`)
3. ✅ **Blog posts expanded** to 800+ words each
4. **Analytics** — Set up tracking (Plausible, GA4, or similar)
5. **Ongoing content** — Publish 2 blog posts/week
6. **Backlinks** — Use `scripts/directory-submissions.md` to submit to AI directories
7. **Monitor GSC** — Check for crawl errors after 48h
8. **AEO case study** — Add to portfolio
9. **Client onboarding flow** — Checkout/payment integration

---

## Key Files
- `astro.config.mjs` — site URL config
- `src/content.config.ts` — blog + portfolio schemas
- `src/pages/sitemap.xml.ts` — dynamic sitemap
- `src/layouts/BaseLayout.astro` — all schema.org markup
- `public/robots.txt` — AI crawler rules
- `netlify.toml` — build config
- `.env.example` — env vars (N8N_WEBHOOK_URL, etc.)
- `src/pages/services/aeo.astro` — new AEO service page
