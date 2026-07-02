# Lead Gen System

Universal, configurable lead generation system for Rex Bunny Services. Find, enrich, AI-personalize outreach, and nurture leads across any niche — swap niches by changing one config file.

## Architecture

```
niches.json ──> n8n workflows ──> PocketBase ──> Astro Dashboard
                                        │
                                   Listmonk (nurture)
```

## Quick Start

### 1. Prerequisites
- Docker Desktop (running)
- OpenAI API key (~$2-5/mo for gpt-4o-mini)

### 2. Start the stack
```bash
cd rex-bunny-services
docker compose up -d n8n pocketbase
```

### 3. Access the tools
| Service      | URL                                    | Credentials                        |
|-------------|----------------------------------------|-------------------------------------|
| n8n         | http://localhost:5678                  | admin@rexbunnyservices.com / Admin12345! |
| PocketBase  | http://localhost:8090/_/               | admin@rexbunnyservices.com / Admin12345! |
| Dashboard   | http://localhost:3000/lead-gen         | (public)                           |

### 4. Activate n8n workflows
Open n8n UI (http://localhost:5678), log in, then open each workflow and click **Activate**:
1. **01 - Find Leads via Google Places** — webhook trigger
2. **02 - AI Enrich & Score Prospects** — daily schedule
3. **03 - Email Outreach & Follow-ups** — webhook trigger (called by #2)
4. **04 - Nurture Sequence via Listmonk** — weekly schedule

### 5. Configure credentials
In n8n UI, go to **Credentials** and add:
- **Google Places API** — get key from Google Cloud Console (Places API enabled)
- **OpenAI API** — your API key with gpt-4o-mini access
- **SMTP** — Gmail app password or AWS SES credentials

### 6. Change niche
Edit `lead-gen/config/niches.json` — change `active_niche` and update search params.

## Workflows

### 01 - Find Leads via Google Places
- **Trigger**: Webhook (POST /webhook/find-leads)
- **Input**: `{ query: "dentist Chicago", activeNiche: "local_business" }`
- **Process**: Google Places API text search → parse → save to PocketBase
- **Output**: Prospects stored with `status: "discovered"`

### 02 - AI Enrich & Score Prospects
- **Trigger**: Daily schedule
- **Process**: Fetch unprocessed prospects → scrape website → AI analysis via OpenAI → score (0-100) → qualify
- **Output**: Enriched prospects with `status: "qualified"` or `"low_priority"`

### 03 - Email Outreach & Follow-ups
- **Trigger**: Webhook (called by Workflow #2 for qualified leads)
- **Process**: Build AI-personalized email → send via SMTP → wait 3 days → check reply → send follow-up (max 3)
- **Output**: Campaign tracking in PocketBase

### 04 - Nurture Sequence via Listmonk
- **Trigger**: Weekly schedule
- **Process**: Fetch Listmonk subscribers → create nurture campaign → send
- **Content**: AI visibility insights, GEO tips, soft CTA

## Config

| Field | Description |
|-------|-------------|
| `active_niche` | Which niche is currently active |
| `niches.{name}.find_leads_via` | Data source (google_maps, apple_podcasts) |
| `niches.{name}.search_params` | Categories, locations, filters |
| `niches.{name}.scoring.weights` | Scoring criteria weights (total: 100) |
| `niches.{name}.outreach` | Email templates, follow-up cadence |
| `credentials` | API keys (OpenAI, Gmail, Google Places) |

## Files

| Path | Purpose |
|------|---------|
| `lead-gen/config/niches.json` | Niche configuration |
| `lead-gen/workflows/*.json` | n8n workflow exports |
| `lead-gen/scripts/setup-all.ps1` | Full setup script |
| `lead-gen/scripts/setup-pocketbase.ps1` | PocketBase collection setup |
| `lead-gen/scripts/setup-listmonk.ps1` | Listmonk list/template setup |
| `lead-gen/scripts/import-workflows.ps1` | n8n workflow import |

## Test

```bash
# Trigger lead finding
curl -X POST http://localhost:5678/webhook/find-leads \
  -H "Content-Type: application/json" \
  -d '{"query":"plumber Austin","activeNiche":"local_business"}'

# Check prospects
curl http://localhost:8090/api/collections/prospects/records
```
