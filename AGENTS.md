# Rex Bunny Services — Agent Pipeline Setup

## Design System

- **DESIGN.md** at project root — Modern SaaS design tokens (colors, typography, spacing, components, layout patterns)
- AI tools (opencode, Claude Code, Cursor, Copilot) read this file automatically
- Always follow DESIGN.md tokens when creating or modifying UI components

## Stack

- **n8n** (:5678) — workflow automation
- **PocketBase** (:8090) — backend/database
- **Listmonk** (:9000) — email campaigns
- **Cloudflared** — tunnel for external access
- **Astro** (:3000) — website

## Logins

> Passwords are deliberately **not** recorded here. Look them up in the password
> manager or the gitignored `.env`. If you do not have a value, ask - never
> commit one.

| Service         | URL                                                      | Credentials                                       |
| --------------- | -------------------------------------------------------- | ------------------------------------------------- |
| n8n             | `http://localhost:5678`                                  | `help@rexbunnyservices.com` / see password mgr    |
| PocketBase      | `http://localhost:8090/_/`                               | `admin@rexbunnyservices.com` / see `.env`         |
| Listmonk        | `http://localhost:9000`                                  | see `listmonk/config.toml` (untracked)            |
| Titan SMTP/IMAP | smtpout.secureserver.net:465 / imap.secureserver.net:993 | `help@rexbunnyservices.online` / see password mgr |
| OpenAI API      | —                                                        | stored in n8n credentials                         |

## Webhook Endpoints

| Workflow                   | Endpoint                  | Method | Status       |
| -------------------------- | ------------------------- | ------ | ------------ |
| 01 — Find Leads            | `/webhook/find-leads`     | POST   | ✅ Working   |
| 02 — AI Enrich             | Daily Schedule Trigger    | —      | ✅ Auto-runs |
| 03 — Email Outreach        | `/webhook/start-outreach` | POST   | ✅ Working   |
| 04 — Nurture Sequence      | Weekly Schedule Trigger   | —      | ✅ Auto-runs |
| 05 — Social Media Workflow | Schedules (see below)     | —      | ✅ Auto-runs |

## 05 — social media workflow (smm-content-publisher) (Aug 8)

- **Imported** from `social-media-manager/workflows/05-smm-content-publisher.json`, name **"social media workflow"** (id `smm-content-publisher`, versionId `5ae0c6aa-7711-4175-8a37-92dc56d95be6`, ACTIVE).
- **Weekly Plan trigger** — cron `0 0 9 * * 1` (Mon 9:00) → POST `generate_weekly_plan` to smm-service (`http://smm-service:3456/api/webhook/n8n`), then chains to `weekly_report` → Listmonk campaign.
- **Publish trigger** — crons `0 30 9 * * 1-6`, `0 0 12 * * 1-6`, `0 30 17 * * 1-6` (Mon–Sat 09:30/12:00/17:30, no Sundays) → POST `post_due`.
- ⚠️ **scheduleTrigger `interval` gotcha**: `field: "weeks"` requires `triggerAtDay` as an **ARRAY** (`[1]`), not number (crashes `days.join is not a function`). Cron expressions use **6-field with seconds first** (`[Sec] [Min] [Hour] [DOM] [Month] [DOW]`, e.g. `0 30 9 * * 1-6`). typeVersion 1.2.
- ⚠️ httpRequest nodes use **typeVersion 4.2** schema (`sendBody`, `specifyBody:"json"`, `jsonBody` expression, `specifyHeaders:"keypair"`, `headerParameters`) — confirmed working (matches lf01).
- ⚠️ **env changes to smm-service require `docker compose up -d --force-recreate smm-service`** — plain `restart` reuses the old container env (model stayed stale).
- **Content model (Aug 8)**: `OLLAMA_SMM_MODEL=qwen2.5:7b-instruct` (marketing-capable; was `qwen2.5-coder:7b`). Pulled to Docker ollama (ID 845dbda0ea48).
- **UTM CTA (Aug 8)**: ContentEngine `ensureCtaLink()` deterministically appends `https://rexbunnyservices.online/lead-engine?utm_source={platform}&utm_medium=social&utm_campaign={postType}_content` to every post (trims body to fit platform char limit). For attribution in Umami.
- **Scheduler.js saveQueue bug FIXED (Aug 8)**: old `saveQueue()` reloaded queue from disk and discarded in-memory post mutations → generated content was silently lost. Now `saveQueue(updatedPost)` merges the post back by id.
- **Queue state (Aug 8)**: Week of Aug 10 staged — 8 posts `ready` (5 LinkedIn personal/company + 3 Instagram), all with UTM audit links. Next refresh Monday 9:00 via n8n weekly plan.
- **Blocked on Phase 0 tokens** (`.env`): `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_PERSON_ID`, `LINKEDIN_ORGANIZATION_ID`, `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID` — all empty. Manual setup checklist at `social-media-manager/PHASE0-ACCOUNTS.md`.

## Lead capture → PocketBase sync (Aug 8)

- **Fixed lead leak**: audit + contact leads were only stored in Cloudflare KV with 7-day TTL (`expirationTtl: 604800`) and nothing drained them.
- `functions/api/audit.ts` + `functions/api/contact.ts` now ALSO write directly to PocketBase `leads` collection (deduped by email) via `syncLeadToPocketBase()`.
- New `functions/api/kv-leads.ts`: `GET /api/kv-leads?type=audit|contact` lists KV records, `POST /api/kv-leads` with `{keys:[...]}` deletes them. Protected by `x-api-key` (`DASHBOARD_API_KEY` or `9690`).
- `leads` schema: `email, website, name, status, source, score, serviceInterest, auditScore(json), aiVisibility(json)`.
- Both KV and PB write in the same request; PB sync failure is caught + logged (doesn't break the audit response).
- Re-deploy after changing: `npx astro build && npx wrangler pages deploy dist --project-name=rex-bunny-services`.

## lf01unified / lf03 — Email Outreach (Aug 8 — Titan-only)

- **All sending switched to Titan SMTP** (`smtpout.secureserver.net:465`, `help@rexbunnyservices.online`; password in password manager). Maileroo fully retired.
- lf03 workflow id is `lf03emailoutreach`; `lf01unified` (id `lf01unified`) repointed: Build SEO Email `mailProvider: 'titan'`, Split by Type → `Send via Titan SMTP` (currently inactive).
- lf01unified is NOT active yet — reactivate after confirming the Titan path.
- DNS (Cloudflare, zone `f9e0ce14660d7ad27a49878e3ab04a89`): MX `smtp.secureserver.net`(0)+`mailstore1.secureserver.net`(10), SPF `v=spf1 include:secureserver.net -all`, DMARC `p=reject`, DKIM CNAMEs + TXT `T7191768` — all Titan-only, verified via 1.1.1.1/8.8.8.8.

### lf01unified — Scrape Website hardening + honest enrichment gating (Sep 2)

- `Scrape Website` node is hardened **pure JS** (no Python/HTTP-node deps; the n8n sandbox blocks external scripts). Realistic UA rotation + browser-like headers + 3 retries + abort timeout. Pure-JS fetch still hits a ~10-15% hard-WAF ceiling (Cloudflare/PerimeterX etc.) that no header tweak beats — that residual is now **handled, not fought**.
- **Downstream AI nodes now gate on blocked/empty scraps** so we STOP burning Zen/Gemini credits on sites that yielded nothing:
  - `Call Ollama SEO` / `Call Ollama Web-dev` skip the AI call (and its retry/fallback chain) when the scraped body is empty/presented, emitting `{...score:null, recommendation:'skip_enrichment'}` + `scrapeBlocked:true` + `skipped:true` + `skipReason` (`WAF_block`/`empty_body`).
  - `Parse SEO Score` / `Parse Web-dev Score` record **honest `0`** when blocked, and now record **`null` (not `5`/`6`)** when the model returned no usable score, so a failed call can never be saved as a mid-scale rating. `seoScored` / `webDevScored` distinguish "scored 0" (real, bad site) from "not scored".
- **Instrumentation counters** live in n8n Static Data (`$getWorkflowStaticData('global').runCounters`): `sites_fetched` / `sites_blocked` / `emails_found` — increments on every run to measure the real WAF block rate over time.
- **Reference JS** (chain-consistent, canonical, editable before re-patching): `n8n/scrape_website_hardened.js`, `n8n/call_ollama_seo_gated.js`, `n8n/call_ollama_webdev_gated.js`, `n8n/parse_seo_score_gated.js`, `n8n/parse_webdev_score_gated.js`.
- **AI call chain — CANONICAL (disk) vs LIVE differ!** The disk files call **OmniRoute gateway FIRST** (`OMNIROUTE_API_KEY` + `OMNIROUTE_BASE_URL` defaults to `http://host.docker.internal:20128`, model `auto/best-coding`, 2 attempts) → then Zen → then Gemini. **The LIVE nodes never got this** (still Zen-first; `zen.opencode.ai` is NXDOMAIN so live falls straight through to Gemini). Verified Sep 30 2026. Do NOT blindly PUSH the disk files over the live nodes — that would silently migrate scoring to a gateway whose key is not in the n8n container env. Patch surgically, or set `OMNIROUTE_API_KEY` in the container first.
- **Live state (verified Sep 30 2026):** `lf01unified` has 47 nodes and is **`active: False`** (an earlier note claiming `active: True` is stale). Update via `PATCH /rest/workflows/lf01unified` with whole `{"nodes":[...]}` (PATCH 200, PUT 404). ⚠️ The GET response is wrapped in `{"data": {...}}` — `wf["data"]["nodes"]`, not `wf["nodes"]`.
- **Score fabrication fixed (Sep 30 2026):** the old `(seo.seoScore || 5)` / `(wd.webDevScore || 6)` turned a failed model call into a mid-scale score (and swallowed a legitimate `0`). Audit of 1618 prospects: **557 genuinely rated, 324 of them carry `aiScore: 5` + `seoRecommendation: "Manual review needed"`** = confirmed fabricated, plus 13 ambiguous and 8 out-of-range. Report + record ids: `reports/seo_score_audit_2026-09-30.md`. PB data was deliberately left untouched.
- **Node test harness:** `n8n/test_score_nodes.mjs` runs the four score nodes through 26 assertions with a mocked `this.helpers.httpRequest`. `SCORE_NODE_DIR=<dir> node n8n/test_score_nodes.mjs` runs it against code extracted from the live workflow, so you can verify what n8n actually holds rather than what disk holds. Set `ZEN_API_KEY` _and_ `OMNIROUTE_API_KEY` in the mock env so the test is provider-agnostic.
- Type the node bodies exactly as written in the reference files. n8n Code node top-level is implicitly async; `new Function` bodies must be wrapped in `async` for `await`.

## External URLs (via Cloudflare tunnel)

- `https://n8n.rexbunnyservices.online`
- `https://pb.rexbunnyservices.online`
- `https://listmonk.rexbunnyservices.online`
- `https://rexbunnyservices.online`

## DB Credentials (for direct SQLite access)

File: `n8n_data/database.sqlite`

## Webhook Fixes Applied

- `webhookId` must be at **node top level**, NOT inside `parameters`
- `httpMethod` must be `"POST"` (defaults to GET if missing)
- `typeVersion` should be `2`
- After DB edits: restart n8n via `docker compose restart n8n`

## Security Config Applied (docker-compose.yml)

```yaml
environment:
  - N8N_SECURE_COOKIE=true
  - N8N_PROXY_HOPS=1
```

## Cloudflare Headers (still manual — via Dashboard)

- HSTS: `max-age=63072000; includeSubDomains; preload`
- X-Frame-Options: `DENY`
- X-Content-Type-Options: `nosniff`
- Referrer-Policy: `strict-origin-when-cross-origin`
- Permissions-Policy: `geolocation=(), microphone=(), camera=()`
- CSP (n8n only): `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' ...`

## Common Commands

```bash
# Start everything
docker compose up -d

# Restart a service
docker compose restart n8n

# Check logs
docker logs rex-bunny-services-n8n-1 --tail 20

# Update webhook node in DB (via Python)
python -c "
import sqlite3, json
conn = sqlite3.connect(r'n8n_data/database.sqlite')
c = conn.cursor()
c.execute(\"SELECT id, nodes FROM workflow_entity WHERE id = 'WORKFLOW_ID'\")
row = c.fetchone()
nodes = json.loads(row[1])
# modify nodes...
c.execute('UPDATE workflow_entity SET nodes = ? WHERE id = ?', (json.dumps(nodes), row[0]))
conn.commit()
conn.close()
"
```

## Security

### API Endpoints — All protected behind `x-api-key` header check

- `/api/n8n-leads?collection=prospects` — prospects (PocketBase public read)
- `/api/n8n-leads?collection=leads` — website audit leads (PB admin auth)
- `/api/n8n-data?resource=workflows-all` — n8n workflows
- `/api/n8n-data?resource=executions` — n8n executions

The dashboard sends the PIN (`9690`) as `x-api-key` header. Set a stronger `DASHBOARD_API_KEY` env var in Cloudflare Pages dashboard for real security.

### Required Env Vars (set in Cloudflare Pages dashboard, not wrangler.toml)

| Variable            | Default                               | Purpose                                        |
| ------------------- | ------------------------------------- | ---------------------------------------------- |
| `DASHBOARD_API_KEY` | `9690` (falls back to PIN)            | Shared secret for all dashboard API endpoints  |
| `PB_URL`            | `https://pb.rexbunnyservices.online`  | n8n-leads.ts                                   |
| `PB_EMAIL`          | `admin@rexbunnyservices.com`          | n8n-leads.ts                                   |
| `PB_PASSWORD`       | set ✅                                | n8n-leads.ts, marketplace.ts, audit/contact.ts |
| `N8N_URL`           | `https://n8n.rexbunnyservices.online` | n8n-data.ts                                    |
| `N8N_EMAIL`         | `help@rexbunnyservices.com`           | n8n-data.ts                                    |
| `N8N_PASSWORD`      | set ✅                                | n8n-data.ts                                    |

### ✅ No plaintext credential fallbacks remain in tracked files

Resolved 2026-10-04. `PB_PASSWORD` and `N8N_PASSWORD` are both set as
Cloudflare Pages **production environment** secrets, and every
`env.PB_PASSWORD || '<literal>'` fallback in `functions/api/*.ts` is
gone. Verified after the deploying CI run completed: `api/marketplace`,
`api/n8n-leads`, and `api/n8n-data` all return 200 with no fallback in
the bundle.

Two traps worth remembering:

- **A `git revert` that restores one file restores every file in the
  commit.** Restoring the `n8n-data.ts` fallback silently put the four
  PocketBase fallbacks back too, and post-deploy 200s then came from
  the fallback rather than the secret. Verify against the deployed
  build, not the working tree.
- **The earlier "there are no plaintext credentials left" check was
  wrong** because it grepped for literals already known. Scan tracked
  files for secret-_shaped assignments_ (`PASSWORD|SECRET|TOKEN|KEY`
  followed by a value) instead. That is how the unrelated
  `PB_PASSWORD` for the n8n service account was found hardcoded in
  `docker-compose.yml`.

`docker-compose.yml` reads that service-account password from `.env` as
`PB_N8N_SERVICE_PASSWORD`. Changing it requires
`docker compose up -d --force-recreate n8n` — a plain restart keeps the
old container env.

Local Wrangler OAuth is still expired (needs `wrangler login`), so
Pages mutations go through the GitHub Actions token. Password rotation
remains outstanding: these values are still in git history.

n8n auth cookie cached in `FORMS` KV (10min TTL). Never commit secrets to `wrangler.toml`.

## Known Fixes (Jul 26)

- n8n admin password hash was corrupted during DB recovery (bcrypt `$` chars mangled by shell). **Fix**: Use Python script (not inline `-c`) to generate bcrypt hash: `import bcrypt; bcrypt.hashpw(os.environ["N8N_PASSWORD"].encode(), bcrypt.gensalt())`
- PB v0.22+ admin auth endpoint: `POST /api/collections/_superusers/auth-with-password` (not `/api/admins/auth-with-password`)

## Free Audit Email Feature

- **Endpoint**: `/api/audit` (Cloudflare Pages Function)
- **Email Service**: Titan via n8n relay (`audit-email-relay` workflow, id `8oaWxKmO77O2oJpz`) — POST to `https://n8n.rexbunnyservices.online/webhook/audit-email` with `{to, subject, html}`, which sends via Titan SMTP credential.
- **From**: `help@rexbunnyservices.online`
- **Trigger**: After audit completes, results stored to KV, then HTML email sent via Titan relay

## Animations (Jul 29)

- **No custom CSS** — all animations via Tailwind config keyframes + vanilla JS scripts
- **9 keyframe animations** in `tailwind.config.mjs`: fade-up, fade-down, fade-in, scale-in, blur-in, shimmer, float, gradient-shift, glow-border
- **3 script files** in `src/scripts/`:
  - `scrollReveal.ts` — IntersectionObserver adds `animate-*` classes on scroll, number counter (cubic easing), scroll progress bar
  - `interactions.ts` — 3D tilt (`[data-tilt]`), magnetic buttons (`[data-magnetic]`), cursor glow in hero
  - `smoothScroll.ts` — smooth anchor scrolling
- **Attributes**: `data-reveal="fade-up|scale-in|blur-in"`, `data-delay="ms"`, `data-tilt`, `data-magnetic`
- **Imported** in `BaseLayout.astro` via `<script>` tags
- **`opacity-0`** applied alongside `data-reveal` for initial hidden state
- **`prefers-reduced-motion`** respected in all scripts
- **GPU-accelerated** properties only (`transform`, `opacity`)
- Pages animated: `index.astro` (hero, metrics, services, testimonials, logos, case studies, blog, audit, process, FAQ, final CTA), `pilot.astro`, `partners.astro`

## Deployment

- **Build**: `npx astro build`
- **Deploy**: `npx wrangler pages deploy dist --project-name=rex-bunny-services`
- **Production**: at `https://d2ccb4d8.rex-bunny-services.pages.dev` (updates on PR merge)
- **Preview**: each deploy gets unique hash (e.g., `https://3b794e99.rex-bunny-services.pages.dev`)

## Work State (Jul 30 — n8n Auth Recovery)

- `user-management:reset` was run (via `n8n user-management:reset`), wiping the owner user's **email** and **password** to NULL, and deleting all other users.
- **Root cause of 401**: The reset command calls `userRepository.save()` with `{email: null, password: null, ...}`, which runs TypeORM's `preUpsertHook()` and replaces email+password. The command also deletes all non-owner users and reassigns all workflows/credentials to the owner's personal project.
- **Initial fix attempt**: Set email + bcrypt hash via SQLite directly. Tested `bcryptjs.compareSync()` from **inside** the container — **returned `true`**, but REST API /rest/login still returned 401. Likely suspect: `@n8n/typeorm` with `sqlite-pooled` driver cached stale data across the pooled connection, or a downstream middleware check not visible in logs.
- **Successful fix**: Full database cleanup approach:
  1. Deleted all **enqueued executions** (109 records in `execution_entity` where `status='new'`) → these caused crash on restart (`runEnqueuedExecutions` tries `ownershipService.getWorkflowProjectCached()` which returns null when project/user are missing).
  2. Deleted all **users**, **projects**, **project_relations**, **shared_workflows**, **shared_credentials**, **auth_identities**.
  3. Set `userManagement.isInstanceOwnerSetUp` to `false` in settings.
  4. Removed `crash.journal` + WAL/SHM files.
  5. Restarted n8n — `/rest/owner/setup` returned 404 on GET, but responded on **POST**.
  6. First POST returned `"Instance owner shell user not found"` — because the setup handler expects a user row with `global:owner` role to already exist; it only fills in email/password/name, it doesn't create the user from scratch.
  7. Created a minimal "shell user" in DB via SQLite: `{id, firstName='Shell', roleSlug='global:owner'}` with all other fields NULL.
  8. Restarted n8n → retried `POST /rest/owner/setup` with `{email, password, firstName, lastName}` → **200 OK** — user created with bcrypt hash generated internally by n8n's own `passwordUtility.hash()`.
  9. Created **personal project** (`project` + `project_relation` with `project:personalOwner` role) and **shared_workflow** + **shared_credentials** entries for all existing workflows/credentials.
  10. Restarted n8n → **all 8 workflows activated** successfully, login via REST API returns **200 OK** with `role: global:owner`.
- **Key insight**: The `setupOwner` method in `ownership.service.js:170` requires a pre-existing `user` row with `global:owner` role. It does NOT call `createUserWithProject()` — that's only used by the normal signup flow. After `user-management:reset` deletes that row, the setup endpoint can't complete.
- **Login working**: `help@rexbunnyservices.com` (password in password manager — n8n's own `/rest/login` returns 200)
- **n8n_db_credential**: File `n8n_data/database.sqlite`
