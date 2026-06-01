# GitHub CLI login helper (PATH refresh + browser open)
$ErrorActionPreference = "Stop"

$env:Path = "C:\Program Files\Git\bin;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;" + $env:Path

$GhExe = "C:\Program Files\GitHub CLI\gh.exe"
if (-not (Test-Path $GhExe)) {
  $GhExe = "$env:LOCALAPPDATA\Programs\GitHub CLI\gh.exe"
}
if (-not (Test-Path $GhExe)) {
  throw "gh not found. Install GitHub CLI first."
}

Write-Host "Opening https://github.com/login/device" -ForegroundColor Yellow
Start-Process "https://github.com/login/device" | Out-Null
Start-Sleep -Seconds 1

& $GhExe auth login -h github.com -p https --clipboard

Write-Host ""
Write-Host "Done. Verify with:" -ForegroundColor Green
Write-Host '& "C:\Program Files\GitHub CLI\gh.exe" auth status'
