# REX Bunny Services — Session Progress

## Site: `rexbunnyservices.online`
## Repo: `https://github.com/rexbunnyservices-star/rexbunnyservices.git`
## Last commit: `534adcb` (Netlify -> Cloudflare Pages migration)
## Hosting: Cloudflare Pages (`https://rex-bunny-services.pages.dev`)
## Backend: Docker stack on local machine (PocketBase, n8n, Listmonk, Cal.com)
## DNS: Cloudflare NS (`jarred.ns.cloudflare.com` / `summer.ns.cloudflare.com`)
## Last updated: July 5, 2026

---

## Completed

### Phase 1-6 — (see previous entries below)

### Phase 7 — Netlify → Cloudflare Pages Migration (July 5, 2026)
- **Static site deployed** to Cloudflare Pages at `https://rex-bunny-services.pages.dev`
- **Custom domains added** — `rexbunnyservices.online` + `www.rexbunnyservices.online` (SSL provisioning)
- **Cloudflare Pages Functions** deployed (audit, audit-status, audit-callback, subscribe)
- **Subscribe rewritten** from Mailchimp to self-hosted Listmonk API
- **Cloudflare Tunnel created** (`3562b277-2a7e-4ab9-9b51-90b7e267ac76`) for backend services
- **Tunnel config** written at `cloudflared/config.yml` (routes pb, n8n, listmonk, cal subdomains → localhost)
- **cloudflared service** added to `docker-compose.yml`
- **DNS CNAME records** added for tunnel subdomains:
  - `pb.rexbunnyservices.online`, `n8n.rexbunnyservices.online`, `listmonk.rexbunnyservices.online`, `cal.rexbunnyservices.online`
- **Env vars set** in Cloudflare Pages (production):
  - `POCKETBASE_URL`, `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_AUTH`, `LISTMONK_URL`, `LISTMONK_USER`, `LISTMONK_PASS`, `LISTMONK_LIST_ID`, `PUBLIC_SITE_URL`
- **Netlify artifacts removed**: `netlify.toml`, `netlify/functions/` (all 4 serverless functions)
- **`wrangler.toml`** fixed — removed invalid `routes` key
- **`.env` / `.env.example`** updated — Mailchimp replaced with Listmonk vars

---

## Next Steps (continue from here)

### Immediate
1. **🔴 Start the tunnel** — `docker compose up -d cloudflared` (makes backend services reachable at subdomains)
2. **🔴 Delete old apex A record** — Cloudflare Dashboard > DNS > delete A record for `rexbunnyservices.online` (points to `75.2.60.5`, blocks Pages from taking over fully)
3. **Verify custom domain** — Wait for SSL provisioning, then check `https://rexbunnyservices.online` serves from Pages
4. **Set real Listmonk password** — Update `LISTMONK_PASS` env var in Pages dashboard from default `changeme`
5. **Fill in N8N_WEBHOOK_URL/AUTH** — Update env vars once n8n tunnel is running

### Backlog (pre-migration)
6. **Analytics** — Set up tracking (Plausible, GA4, or similar)
7. **Ongoing content** — Publish 2 blog posts/week
8. **Backlinks** — Use `scripts/directory-submissions.md` to submit to AI directories
9. **Monitor GSC** — Check for crawl errors after 48h
10. **AEO case study** — Add to portfolio
11. **Client onboarding flow** — Checkout/payment integration

---

## Key Files
- `astro.config.mjs` — site URL config (`site: "https://rexbunnyservices.online"`)
- `src/content.config.ts` — blog + portfolio schemas
- `src/pages/sitemap.xml.ts` — dynamic sitemap
- `src/layouts/BaseLayout.astro` — all schema.org markup
- `public/robots.txt` — AI crawler rules
- `wrangler.toml` — Cloudflare Pages project config
- `cloudflared/config.yml` — Tunnel ingress rules (pb, n8n, listmonk, cal)
- `functions/api/` — Cloudflare Pages Functions (audit, subscribe)
- `.env.example` — env vars template (Listmonk, n8n, PocketBase, Cal.com)
