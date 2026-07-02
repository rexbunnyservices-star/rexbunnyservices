param(
  [string]$ListmonkUrl = "http://localhost:9000",
  [string]$Username = "listmonk",
  [string]$Password = "listmonk"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Setting up Listmonk for Lead Nurture ===" -ForegroundColor Cyan

# Wait for Listmonk
Write-Host "Waiting for Listmonk..." -NoNewline
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    $null = Invoke-RestMethod -Uri "$ListmonkUrl/api/health" -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
    $ready = $true
    Write-Host " OK" -ForegroundColor Green
    break
  } catch {
    Start-Sleep -Seconds 1
    Write-Host "." -NoNewline
  }
}
if (-not $ready) { Write-Host "`nERROR: Listmonk not reachable at $ListmonkUrl" -ForegroundColor Red; exit 1 }

# Auth
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$Username`:$Password"))
$headers = @{ Authorization = "Basic $auth" }

# Create default list for prospects
$listBody = @{
  name = "Lead Gen Prospects"
  type = "public"
  tags = @("lead-gen", "cold-outreach")
} | ConvertTo-Json

try {
  $resp = Invoke-RestMethod -Uri "$ListmonkUrl/api/lists" -Method Post -Body $listBody -ContentType "application/json" -Headers $headers -ErrorAction SilentlyContinue
  Write-Host "  Created list: Lead Gen Prospects (ID: $($resp.data?.id))" -ForegroundColor Green
} catch { Write-Host "  List may already exist: $_" }

# Create nurture campaign template
$templateBody = @{
  name = "AI Visibility Nurture"
  body = @"
<html><body>
<h2>AI Visibility Insights</h2>
<p>Hi {{ .Name }},</p>
<p>Here's your weekly dose of AI search (GEO) insights:</p>
<ul>
  <li><strong>Structured data</strong> → +30% visibility in AI overviews</li>
  <li><strong>LLM optimization</strong> → Get indexed by GPT, Claude, Perplexity</li>
  <li><strong>Entity SEO</strong> → Help AI understand your business</li>
</ul>
<p>Book a free AI visibility audit: <a href="https://cal.rexbunnyservices.online">Schedule here</a></p>
<p>Best,<br>Anass<br>rexbunnyservices.com</p>
</body></html>
"@
  type = "html"
} | ConvertTo-Json

try {
  $resp = Invoke-RestMethod -Uri "$ListmonkUrl/api/templates" -Method Post -Body $templateBody -ContentType "application/json" -Headers $headers -ErrorAction SilentlyContinue
  Write-Host "  Created template: AI Visibility Nurture (ID: $($resp.data?.id))" -ForegroundColor Green
} catch { Write-Host "  Template may already exist: $_" }

Write-Host "`n=== Listmonk setup complete ===" -ForegroundColor Cyan
