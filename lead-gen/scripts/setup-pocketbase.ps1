param(
  [string]$PbUrl = "http://localhost:8090",
  [string]$AdminEmail = "admin@rexbunnyservices.com",
  [string]$AdminPassword = "changeme123"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Setting up PocketBase Collections for Lead Gen ===" -ForegroundColor Cyan

# 1. Wait for PocketBase to be ready
Write-Host "Waiting for PocketBase..." -NoNewline
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    $null = Invoke-RestMethod -Uri "$PbUrl/api/health" -Method Get -TimeoutSec 2
    $ready = $true
    Write-Host " OK" -ForegroundColor Green
    break
  } catch {
    Start-Sleep -Seconds 1
    Write-Host "." -NoNewline
  }
}
if (-not $ready) { Write-Host "`nERROR: PocketBase not reachable at $PbUrl" -ForegroundColor Red; exit 1 }

# 2. Admin auth - try to create admin first, then auth
try {
  $adminBody = @{ email = $AdminEmail; password = $AdminPassword; passwordConfirm = $AdminPassword } | ConvertTo-Json
  $null = Invoke-RestMethod -Uri "$PbUrl/api/admins" -Method Post -Body $adminBody -ContentType "application/json" -ErrorAction SilentlyContinue
  Write-Host "  Admin account created" -ForegroundColor Green
} catch { Write-Host "  Admin may already exist: $_" }

try {
  $authResp = Invoke-RestMethod -Uri "$PbUrl/api/admins/auth-with-password" -Method Post -Body (@{ identity = $AdminEmail; password = $AdminPassword } | ConvertTo-Json) -ContentType "application/json"
  $token = $authResp.token
  $headers = @{ Authorization = "Bearer $token" }
  Write-Host "  Authenticated as admin" -ForegroundColor Green
} catch { Write-Host "ERROR: Auth failed: $_"; exit 1 }

# 3. Create prospects collection
$prospectsSchema = @{
  name = "prospects"
  type = "base"
  schema = @(
    @{ name = "name"; type = "text"; required = $true; options = @{} }
    @{ name = "email"; type = "email"; required = $false }
    @{ name = "phoneNumber"; type = "text"; required = $false }
    @{ name = "website"; type = "url"; required = $false }
    @{ name = "address"; type = "text"; required = $false }
    @{ name = "placeId"; type = "text"; required = $false }
    @{ name = "rating"; type = "number"; required = $false }
    @{ name = "totalRatings"; type = "number"; required = $false }
    @{ name = "businessType"; type = "text"; required = $false }
    @{ name = "lat"; type = "number"; required = $false }
    @{ name = "lng"; type = "number"; required = $false }
    @{ name = "searchQuery"; type = "text"; required = $false }
    @{ name = "niche"; type = "text"; required = $true; options = @{ max = 100 } }
    @{ name = "source"; type = "text"; required = $false }
    @{ name = "status"; type = "select"; required = $true; options = @{ values = @("discovered", "qualified", "low_priority", "contacted", "replied", "booked", "unsubscribed") } }
    @{ name = "aiScore"; type = "number"; required = $false }
    @{ name = "siteIssues"; type = "text"; required = $false }
    @{ name = "hasAiVisibility"; type = "bool"; required = $false }
    @{ name = "painPoints"; type = "text"; required = $false; options = @{ max = 1000 } }
    @{ name = "valueProposition"; type = "text"; required = $false; options = @{ max = 500 } }
    @{ name = "personalizedEmail"; type = "text"; required = $false; options = @{ max = 2000 } }
    @{ name = "emailSubject"; type = "text"; required = $false; options = @{ max = 200 } }
    @{ name = "campaignStatus"; type = "text"; required = $false }
    @{ name = "followUpCount"; type = "number"; required = $false }
    @{ name = "lastContactedAt"; type = "text"; required = $false }
    @{ name = "enrichedAt"; type = "text"; required = $false }
    @{ name = "notes"; type = "text"; required = $false; options = @{ max = 5000 } }
  )
  indexes = @("CREATE INDEX idx_prospects_status ON prospects (status)", "CREATE INDEX idx_prospects_niche ON prospects (niche)")
  listRule = ""
  viewRule = ""
  createRule = ""
  updateRule = ""
  deleteRule = ""
} | ConvertTo-Json -Depth 10

try {
  $existing = Invoke-RestMethod -Uri "$PbUrl/api/collections/prospects" -Method Get -Headers $headers -ErrorAction SilentlyContinue
  if ($existing) { Write-Host "  Collection 'prospects' already exists, skipping" -ForegroundColor Yellow }
  else { throw "not found" }
} catch {
  $resp = Invoke-RestMethod -Uri "$PbUrl/api/collections" -Method Post -Body $prospectsSchema -ContentType "application/json" -Headers $headers
  Write-Host "  Created collection: prospects (ID: $($resp.id))" -ForegroundColor Green
}

Write-Host "`n=== PocketBase setup complete ===" -ForegroundColor Cyan
Write-Host "Next: Update the API rules in PocketBase admin UI as needed" -ForegroundColor Yellow
