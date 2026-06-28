# REX Bunny Services — Windows Setup Script
Write-Host "🚀 Setting up REX Bunny Services..." -ForegroundColor Cyan

# 1. Check Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
  Write-Host "❌ Node.js is required. Install from https://nodejs.org" -ForegroundColor Red
  exit 1
}
Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green

# 2. Check Docker
$dockerVersion = docker --version 2>$null
if (-not $dockerVersion) {
  Write-Host "⚠️  Docker not found. Install Docker Desktop from https://docker.com" -ForegroundColor Yellow
  Write-Host "   The Astro frontend will still run locally." -ForegroundColor Yellow
}

# 3. Install npm dependencies
Write-Host "📦 Installing npm dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ npm install failed" -ForegroundColor Red
  exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# 4. Copy .env
if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "✅ .env created from .env.example (update with your values)" -ForegroundColor Green
}

# 5. Create required directories
$dirs = @("pb_data", "n8n_data", "listmonk_data", "listmonk_db", "calcom_db")
foreach ($dir in $dirs) {
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update .env with your credentials"
Write-Host "  2. Run: npm run dev        (start Astro dev server)"
Write-Host "  3. Run: docker compose up  (start full stack)"
Write-Host "  4. Run: npm run seed       (populate PocketBase)"
Write-Host ""
Write-Host "📖 Open http://localhost:3000 to see your site" -ForegroundColor Cyan
