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
| Service | URL | Credentials |
|---|---|---|
| n8n | `http://localhost:5678` | help@rexbunnyservices.com / Admin12345! |
| PocketBase | `http://localhost:8090/_/` | — |
| Listmonk | `http://localhost:9000` | listmonk / listmonk |
| Titan SMTP | smtp.titan.email:465 | help@rexbunnyservices.online / Charming@786 |
| OpenAI API | — | sk-proj-... (in n8n credentials) |
| **Maileroo (Audit Emails)** | `https://smtp.maileroo.com/api/v2` | **API Key: `bcf73bf9481105aa6ef5aaa1`** (set in `wrangler.toml` as `MAILEROO_API_KEY`) |

## Webhook Endpoints
| Workflow | Endpoint | Method | Status |
|---|---|---|---|
| 01 — Find Leads | `/webhook/find-leads` | POST | ✅ Working |
| 02 — AI Enrich | Daily Schedule Trigger | — | ✅ Auto-runs |
| 03 — Email Outreach | `/webhook/start-outreach` | POST | ✅ Working |
| 04 — Nurture Sequence | Weekly Schedule Trigger | — | ✅ Auto-runs |

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

## New Dashboard API Endpoints (Cloudflare Pages Functions)
- `/api/n8n-leads?collection=prospects&limit=500` — fetches prospects (public read)
- `/api/n8n-leads?collection=leads&limit=500` — fetches leads (needs PB admin auth)
- `/api/n8n-data?resource=workflows-all&limit=50` — fetches n8n workflows
- `/api/n8n-data?resource=executions&limit=100` — fetches n8n executions

### Required Env Vars (must be set in Cloudflare Pages dashboard)
| Variable | Default | Used By |
|---|---|---|
| `PB_URL` | `https://pb.rexbunnyservices.online` | n8n-leads.ts (leads auth) |
| `PB_EMAIL` | `admin@rexbunnyservices.com` | n8n-leads.ts |
| `PB_PASSWORD` | `Admin12345!` | n8n-leads.ts |
| `N8N_URL` | `https://n8n.rexbunnyservices.online` | n8n-data.ts |
| `N8N_EMAIL` | `help@rexbunnyservices.com` | n8n-data.ts |
| `N8N_PASSWORD` | `Admin12345!` | n8n-data.ts |

n8n auth cookie is cached in `FORMS` KV (10min TTL) — function re-logs in automatically if expired.

## Known Fixes (Jul 26)
- n8n admin password hash was corrupted during DB recovery (bcrypt `$` chars mangled by shell). **Fix**: Use Python script (not inline `-c`) to generate bcrypt hash: `import bcrypt; bcrypt.hashpw(b"Admin12345!", bcrypt.gensalt())`
- PB v0.22+ admin auth endpoint: `POST /api/collections/_superusers/auth-with-password` (not `/api/admins/auth-with-password`)

## Free Audit Email Feature
- **Endpoint**: `/api/audit` (Cloudflare Pages Function)
- **Email Service**: Maileroo HTTP API (`https://smtp.maileroo.com/api/v2/emails`)
- **From**: `growth@rexbunnyservices.online` (verified domain in Maileroo)
- **API Key**: `MAILEROO_API_KEY` in `wrangler.toml` (value: `bcf73bf9481105aa6ef5aaa1`)
- **Trigger**: After audit completes, results stored to KV, then HTML email sent via Maileroo
- **To deploy**: Set `MAILEROO_API_KEY` secret in Cloudflare Pages dashboard under Settings > Environment Variables
