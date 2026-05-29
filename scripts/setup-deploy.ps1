# 댕망 Vercel + GitHub 자동 배포 설정 (최초 1회)
# PowerShell에서: .\scripts\setup-deploy.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$env:Path = "C:\Program Files\Git\bin;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;" + $env:Path

function Require-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "$name 이(가) 설치되어 있지 않습니다."
  }
}

Require-Command git
Require-Command gh
Require-Command npm

Write-Host "`n=== 1/5 GitHub 로그인 확인 ===" -ForegroundColor Cyan
$ghStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "GitHub 로그인이 필요합니다. 브라우저에서 인증을 완료해 주세요." -ForegroundColor Yellow
  gh auth login -h github.com -p https -w
}

Write-Host "`n=== 2/5 GitHub 저장소 생성 및 push ===" -ForegroundColor Cyan
$remote = git remote get-url origin 2>$null
if (-not $remote) {
  $repoName = Read-Host "GitHub 저장소 이름 (기본: daengmang)"
  if ([string]::IsNullOrWhiteSpace($repoName)) { $repoName = "daengmang" }

  $visibility = Read-Host "공개 저장소? (Y/n, 기본 Y)"
  if ($visibility -eq "n" -or $visibility -eq "N") {
    gh repo create $repoName --private --source=. --remote=origin --push
  } else {
    gh repo create $repoName --public --source=. --remote=origin --push
  }
} else {
  Write-Host "origin 이미 연결됨: $remote"
  git push -u origin main
}

Write-Host "`n=== 3/5 Vercel 로그인 ===" -ForegroundColor Cyan
Write-Host "브라우저에서 Vercel 로그인을 완료해 주세요." -ForegroundColor Yellow
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
