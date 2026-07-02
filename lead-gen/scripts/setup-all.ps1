param(
  [string]$N8nUrl = "http://localhost:5678",
  [string]$PbUrl = "http://localhost:8090",
  [string]$ListmonkUrl = "http://localhost:9000"
)

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Lead Gen System - Full Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Setup PocketBase
Write-Host ">>> Step 1/3: PocketBase Collections" -ForegroundColor Yellow
& "$ScriptDir/setup-pocketbase.ps1" -PbUrl $PbUrl
Write-Host ""

# Step 2: Setup Listmonk
Write-Host ">>> Step 2/3: Listmonk Lists & Templates" -ForegroundColor Yellow
& "$ScriptDir/setup-listmonk.ps1" -ListmonkUrl $ListmonkUrl
Write-Host ""

# Step 3: Import n8n Workflows
Write-Host ">>> Step 3/3: Import n8n Workflows" -ForegroundColor Yellow
& "$ScriptDir/import-workflows.ps1" -N8nUrl $N8nUrl
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Set credentials in n8n UI: http://localhost:5678" -ForegroundColor White
Write-Host "     - OpenAI API Key (gpt-4o-mini ~$2/mo)" -ForegroundColor White
Write-Host "     - Google Places API Key (free tier: $200/mo credit)" -ForegroundColor White
Write-Host "     - SMTP credentials (Gmail app password or SES)" -ForegroundColor White
Write-Host "  2. Set config in lead-gen/config/niches.json" -ForegroundColor White
Write-Host "  3. Activate workflows in n8n dashboard" -ForegroundColor White
Write-Host "  4. Test: POST to http://localhost:5678/webhook/find-leads" -ForegroundColor White
Write-Host "     Body: { query: 'plumber Austin', activeNiche: 'local_business' }" -ForegroundColor White
Write-Host ""
