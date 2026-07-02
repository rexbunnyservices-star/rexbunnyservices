param(
  [string]$N8nUrl = "http://localhost:5678",
  [string]$WorkflowsDir = "$PSScriptRoot/../workflows"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Importing n8n Workflows ===" -ForegroundColor Cyan

# Test n8n API is reachable
try {
  $health = Invoke-RestMethod -Uri "$N8nUrl/healthz" -Method Get -TimeoutSec 5
  Write-Host "n8n is running at $N8nUrl" -ForegroundColor Green
} catch {
  Write-Host "ERROR: n8n not reachable at $N8nUrl. Start Docker containers first." -ForegroundColor Red
  exit 1
}

# Get all workflow JSON files, sorted by number
$workflowFiles = Get-ChildItem -Path $WorkflowsDir -Filter "*.json" | Sort-Object Name

foreach ($file in $workflowFiles) {
  $workflowJson = Get-Content -Path $file.FullName -Raw | ConvertFrom-Json

  $body = @{
    name       = $workflowJson.name
    nodes      = $workflowJson.nodes
    connections = $workflowJson.connections
  } | ConvertTo-Json -Depth 10

  try {
    $response = Invoke-RestMethod `
      -Uri "$N8nUrl/api/v1/workflows" `
      -Method Post `
      -Body $body `
      -ContentType "application/json" `
      -Headers @{ "X-N8N-API-KEY" = "your-api-key-here" }

    Write-Host "  [OK] Imported: $($workflowJson.name) (ID: $($response.id))" -ForegroundColor Green
  } catch {
    Write-Host "  [FAIL] $($workflowJson.name): $_" -ForegroundColor Red
  }
}

Write-Host "`n=== Import complete ===" -ForegroundColor Cyan
Write-Host "Next: Configure credentials (OpenAI, SMTP, Google Places) in n8n UI" -ForegroundColor Yellow
