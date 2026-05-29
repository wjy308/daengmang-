# Upstash + Vercel env + data import (run after creating Redis on Upstash)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$env:Path = "C:\Program Files\Git\bin;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;" + $env:Path

Write-Host ""
Write-Host "=== Upstash setup ===" -ForegroundColor Cyan
Write-Host "1. https://console.upstash.com -> Create Database"
Write-Host "2. Open the DB -> REST API tab -> copy URL and Token"
Write-Host ""

$url = Read-Host "UPSTASH_REDIS_REST_URL"
$token = Read-Host "UPSTASH_REDIS_REST_TOKEN"

if ([string]::IsNullOrWhiteSpace($url) -or [string]::IsNullOrWhiteSpace($token)) {
  throw "URL and Token are required."
}

$envContent = @"
UPSTASH_REDIS_REST_URL=$url
UPSTASH_REDIS_REST_TOKEN=$token
"@

Set-Content -Path ".env.local" -Value $envContent -Encoding utf8
Write-Host "Saved .env.local" -ForegroundColor Green

Write-Host ""
Write-Host "=== Upload local data to Redis ===" -ForegroundColor Cyan
npm run import-data

Write-Host ""
Write-Host "=== Add env vars to Vercel ===" -ForegroundColor Cyan

function Invoke-Vercel([string[]]$Args) {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & npx vercel @Args
  $code = $LASTEXITCODE
  $ErrorActionPreference = $prev
  if ($code -ne 0) { throw "vercel failed: vercel $($Args -join ' ')" }
}

Write-Host "Adding UPSTASH_REDIS_REST_URL ..."
Invoke-Vercel @("env", "add", "UPSTASH_REDIS_REST_URL", "production", "--value", $url, "--yes", "--force")

Write-Host "Adding UPSTASH_REDIS_REST_TOKEN ..."
Invoke-Vercel @("env", "add", "UPSTASH_REDIS_REST_TOKEN", "production", "--value", $token, "--yes", "--force", "--no-sensitive")

Write-Host ""
Write-Host "=== Redeploy production ===" -ForegroundColor Cyan
Invoke-Vercel @("--prod", "--yes")

Write-Host ""
Write-Host "=== GitHub (auto-deploy on push) ===" -ForegroundColor Cyan
$GitExe = "C:\Program Files\Git\bin\git.exe"
$GhExe = "C:\Program Files\GitHub CLI\gh.exe"
$remote = & $GitExe remote get-url origin 2>$null

if (-not $remote) {
  Write-Host "Create repo at: https://github.com/new  name: daengmang  (Public)"
  $confirm = Read-Host "Created daengmang repo on GitHub? (Y/n)"
  if ($confirm -ne "n" -and $confirm -ne "N") {
    & $GitExe remote add origin "https://github.com/wjy308/daengmang.git" 2>$null
    & $GitExe push -u origin main
    npx vercel git connect --yes
  }
} else {
  Write-Host "Git remote already set: $remote"
  npx vercel git connect --yes
}

Write-Host ""
Write-Host "All done!" -ForegroundColor Green
Write-Host "Site: https://daengmang.vercel.app"
Write-Host "Share this URL with friends."
