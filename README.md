# Daengmang (댕망)

Next.js App Router + TypeScript + Tailwind CSS 스타터 프로젝트입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

## Vercel 배포

### 방법 1: GitHub 연동 (권장)

1. 이 저장소를 GitHub에 푸시합니다.
2. [Vercel Dashboard](https://vercel.com/new) → **Import Project**
3. 저장소 선택 후 기본 설정으로 **Deploy**

### 방법 2: Vercel CLI

```bash
npx vercel
```

최초 실행 시 브라우저에서 Vercel 로그인이 필요합니다.

```bash
npx vercel --prod
```

프로덕션 URL이 발급됩니다.

## 스크립트

| 명령어        | 설명              |
| ------------- | ----------------- |
| `npm run dev` | 개발 서버 (Turbopack) |
| `npm run build` | 프로덕션 빌드   |
| `npm run start` | 프로덕션 서버     |
| `npm run lint` | ESLint           |
