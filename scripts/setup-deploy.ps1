# 댕망 Vercel + GitHub 자동 배포 설정 (최초 1회)
# PowerShell에서: .\scripts\setup-deploy.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$env:Path = "C:\Program Files\Git\bin;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;" + $env:Path

function Resolve-Tool([string]$Name, [string[]]$Candidates) {
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  foreach ($path in $Candidates) {
    if (Test-Path $path) { return $path }
  }

  throw "$Name not found. Restart terminal or reinstall $Name."
}

$GitExe = Resolve-Tool "git" @(
  "C:\Program Files\Git\bin\git.exe",
  "C:\Program Files (x86)\Git\bin\git.exe"
)
$GhExe = Resolve-Tool "gh" @(
  "C:\Program Files\GitHub CLI\gh.exe",
  "$env:LOCALAPPDATA\Programs\GitHub CLI\gh.exe"
)

function Require-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    if ($name -eq "npm") {
      throw "npm is not installed."
    }
  }
}

Require-Command npm

function Test-GhAuth {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $GhExe auth status *> $null
  $ok = ($LASTEXITCODE -eq 0)
  $ErrorActionPreference = $prev
  return $ok
}

function Open-Url([string]$Url) {
  Write-Host "Opening: $Url" -ForegroundColor DarkGray
  try {
    Start-Process $Url | Out-Null
  } catch {
    cmd.exe /c start "" $Url | Out-Null
  }
}

function Invoke-GhLogin {
  Write-Host ""
  Write-Host "GitHub login page will open." -ForegroundColor Yellow
  Write-Host "If the browser does not open, go to: https://github.com/login/device" -ForegroundColor Yellow
  Write-Host "The one-time code is copied to your clipboard. Paste it on that page." -ForegroundColor Yellow
  Write-Host ""

  Open-Url "https://github.com/login/device"
  Start-Sleep -Seconds 1

  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $GhExe auth login -h github.com -p https --clipboard
  $ErrorActionPreference = $prev

  if ($LASTEXITCODE -ne 0) {
    throw "GitHub login failed. Try manually: gh auth login -h github.com -p https --clipboard"
  }
}

Write-Host "`n=== 1/5 GitHub login ===" -ForegroundColor Cyan
if (-not (Test-GhAuth)) {
  Invoke-GhLogin
  if (-not (Test-GhAuth)) {
    throw "GitHub login failed. Run: gh auth login -h github.com -p https --clipboard"
  }
}

Write-Host "`n=== 2/5 GitHub repo create and push ===" -ForegroundColor Cyan
$prev = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$remote = & $GitExe remote get-url origin 2>$null
$ErrorActionPreference = $prev
if (-not $remote) {
  $repoName = Read-Host "GitHub 저장소 이름 (기본: daengmang)"
  if ([string]::IsNullOrWhiteSpace($repoName)) { $repoName = "daengmang" }

  $visibility = Read-Host "공개 저장소? (Y/n, 기본 Y)"
  if ($visibility -eq "n" -or $visibility -eq "N") {
    & $GhExe repo create $repoName --private --source=. --remote=origin --push
  } else {
    & $GhExe repo create $repoName --public --source=. --remote=origin --push
  }
} else {
  Write-Host "origin already linked: $remote"
  & $GitExe push -u origin main
}

Write-Host "`n=== 3/5 Vercel login ===" -ForegroundColor Cyan
Write-Host "Complete Vercel login in your browser." -ForegroundColor Yellow
Open-Url "https://vercel.com/login"
Start-Sleep -Seconds 1
npx vercel login

Write-Host "`n=== 4/5 Vercel 프로젝트 연결 + Git 자동 배포 ===" -ForegroundColor Cyan
if (-not (Test-Path ".vercel\project.json")) {
  npx vercel link --yes
}
npx vercel git connect --yes

Write-Host "`n=== 5/5 프로덕션 배포 ===" -ForegroundColor Cyan
npx vercel --prod --yes

Write-Host "`n완료!" -ForegroundColor Green
Write-Host @"

다음 단계 (필수):
1. Vercel Dashboard → Project → Settings → Environment Variables
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN
2. .env.local 에 Upstash 변수 설정 후: npm run import-data
3. Vercel에서 Redeploy (환경 변수 적용)

이후 git push 할 때마다 자동 재배포됩니다.
"@ -ForegroundColor White
