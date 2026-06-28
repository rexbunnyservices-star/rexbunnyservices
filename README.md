# REX Bunny Services

Next-Gen Web Development, Technical SEO, and AI Search Optimization (GEO) agency website.

## Stack

- **Frontend:** Astro + Preact Islands + Tailwind CSS
- **CMS:** PocketBase (self-hosted, SQLite-backed)
- **Automation:** n8n workflows
- **Email:** Listmonk (self-hosted)
- **Scheduling:** Cal.com (self-hosted)
- **Reverse Proxy:** Traefik with Let's Encrypt

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Visit http://localhost:3000
```

## Full Stack with Docker

```bash
# Start all services
docker compose up -d

# Seed PocketBase with initial data
npm run seed

# Services:
# - Website:    http://localhost:3000
# - PocketBase: http://localhost:8090
# - n8n:        http://localhost:5678
# - Listmonk:   http://localhost:9000
# - Cal.com:    http://localhost:3001
```

## Project Structure

```
src/
├── pages/          # Astro pages + API endpoints
├── components/     # Preact islands + Astro components
├── layouts/        # Base layout with global schema
├── lib/            # Utilities (PocketBase, schema, audit)
├── content/        # Blog posts (MDX)
└── assets/         # Images
```

## Deployment

Build for production:

```bash
npm run build
node ./dist/server/entry.mjs
```

Or use the Dockerfile for containerized deployment.

## API Endpoints

- `POST /api/audit` — Start an AI visibility audit
- `GET /api/audit-status?leadId=xxx` — Poll audit results
- `POST /api/audit-callback` — n8n posts results here
- `POST /api/subscribe` — Newsletter signup
