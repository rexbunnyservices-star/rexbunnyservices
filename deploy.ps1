param([switch]$SkipBuild)

$ErrorActionPreference = "Stop"

$projectDir = "C:\Users\anass\rex-bunny-services"
$account = "b59e38ec6e735d414dd1cef8c4739ebd"
$project = "rex-bunny-services"

Set-Location $projectDir

Write-Host "=== Step 1: Wrangler deploy ===" -ForegroundColor Cyan
# Requires $env:CLOUDFLARE_API_TOKEN to be set before running
$output = npx wrangler pages deploy dist --branch master 2>&1
Write-Host $output

# Extract deployment short_id
if ($output -match 'https://([a-f0-9]+)\.') {
    $shortId = $matches[1]
    Write-Host "Deployed to short_id: $shortId" -ForegroundColor Green
} else {
    Write-Host "WARNING: Could not extract deployment ID from output" -ForegroundColor Yellow
}

Write-Host "=== Step 2: Set env vars via API ===" -ForegroundColor Cyan
python "$projectDir\fix_env.py" 2>&1

Write-Host "=== Step 3: Verify ===" -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Test debug endpoint
$debugUrl = "https://$shortId.rex-bunny-services.pages.dev/api/debug"
try {
    $resp = Invoke-WebRequest -Uri $debugUrl -TimeoutSec 30 -UseBasicParsing
    $body = $resp.Content | ConvertFrom-Json
    Write-Host "Debug: pass_length=$($body.pass_length)" -ForegroundColor Green
} catch {
    Write-Host "Debug check failed: $_" -ForegroundColor Yellow
}

Write-Host "=== Done ===" -ForegroundColor Cyan
Write-Host "Preview: https://$shortId.rex-bunny-services.pages.dev"
Write-Host "Production: https://rexbunnyservices.online"
