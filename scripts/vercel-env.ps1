# Continue Vercel env + redeploy from existing .env.local
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (-not (Test-Path ".env.local")) {
  throw ".env.local not found. Run npm run finish-setup first."
}

$url = $null
$token = $null
Get-Content ".env.local" | ForEach-Object {
  if ($_ -match '^UPSTASH_REDIS_REST_URL=(.+)$') { $url = $matches[1].Trim() }
  if ($_ -match '^UPSTASH_REDIS_REST_TOKEN=(.+)$') { $token = $matches[1].Trim() }
}

if (-not $url -or -not $token) {
  throw "UPSTASH vars missing in .env.local"
}

function Invoke-Vercel([string[]]$Args) {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & npx vercel @Args
  $code = $LASTEXITCODE
  $ErrorActionPreference = $prev
  if ($code -ne 0) { throw "vercel failed" }
}

Write-Host "Adding env vars to Vercel..." -ForegroundColor Cyan
Invoke-Vercel @("env", "add", "UPSTASH_REDIS_REST_URL", "production", "--value", $url, "--yes", "--force")
Invoke-Vercel @("env", "add", "UPSTASH_REDIS_REST_TOKEN", "production", "--value", $token, "--yes", "--force", "--no-sensitive")

Write-Host "Redeploying..." -ForegroundColor Cyan
Invoke-Vercel @("--prod", "--yes")

Write-Host "Done! https://daengmang.vercel.app" -ForegroundColor Green
