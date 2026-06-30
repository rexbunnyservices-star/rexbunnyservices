# REX Bunny Services — Session Progress

## Site: `rexbunnyservices.online`
## Repo: `https://github.com/rexbunnyservices-star/rexbunnyservices.git`
## Last commit: `140a10f` (SEO Phase 2-4)
## Last updated: July 1, 2026

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

### Also Done
- 7 blog posts (MDX) with internal links
- 3 case studies (MDX) with cross-links
- Exit-intent popup for GEO checklist
- Case study carousel on homepage
- Latest blog posts section on homepage
- Testimonials + client logos on homepage

---

## Next Steps (continue from here)

1. **Google Search Console** — Add property, verify, submit sitemap, request indexing for key pages
2. **Save logo images** to `public/images/` (logo-mark.png, logo.png)
3. **Expand blog posts** to 800+ words each (currently ~375)
4. **Ongoing content** — Publish 2 blog posts/week
5. **Backlinks** — Submit to AI directories, build backlinks
6. **Monitor** — Check Google Search Console for crawl errors after 48h

---

## Key Files
- `astro.config.mjs` — site URL config
- `src/content.config.ts` — blog + portfolio schemas
- `src/pages/sitemap.xml.ts` — dynamic sitemap
- `src/layouts/BaseLayout.astro` — all schema.org markup
- `public/robots.txt` — AI crawler rules
- `netlify.toml` — build config
- `.env.example` — env vars (N8N_WEBHOOK_URL, etc.)
