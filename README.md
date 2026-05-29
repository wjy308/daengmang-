# Daengmang (댕망)

Next.js App Router + TypeScript + Tailwind CSS 스타터 프로젝트입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

## Vercel 배포 (Upstash Redis 필수)

배포 환경에서는 `data/raid-data.json` 대신 **Upstash Redis**에 저장됩니다.

### 1. Upstash Redis

1. [console.upstash.com](https://console.upstash.com)에서 Redis DB 생성
2. **REST API** 탭에서 URL / Token 복사

### 2. GitHub 푸시 → Vercel 자동 배포

```bash
# 최초 1회
gh auth login
gh repo create daengmang --public --source=. --remote=origin --push

# Vercel 연동 (최초 1회)
npx vercel login
npx vercel link
npx vercel git connect
```

이후 `git push` 할 때마다 Vercel이 자동으로 재배포합니다.

### 3. Vercel 환경 변수

Vercel Dashboard → Project → **Settings → Environment Variables**:

| 변수 | 값 |
|------|-----|
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST Token |

### 4. 기존 로컬 데이터 올리기

`.env.local`에 Upstash 변수 설정 후:

```bash
npm run import-data
```

---

## Vercel 배포 (대시보드)

1. GitHub에 푸시
2. [vercel.com/new](https://vercel.com/new) → 저장소 Import
3. Environment Variables에 Upstash 2개 추가
4. Deploy

## Vercel CLI (수동)

```bash
npx vercel login
npx vercel --prod
```

프로덕션 URL이 발급됩니다.

## 스크립트

| 명령어 | 설명 |
| ------ | ---- |
| `npm run dev` | 개발 서버 (Turbopack) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint |
| `npm run import-data` | 로컬 JSON → Redis 업로드 |
