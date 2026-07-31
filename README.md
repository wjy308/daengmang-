# 댕망 (daengmang)

로스트아크 **주간 숙제 관리** 도구. 유저·캐릭터별 레이드 배정과 골드 수급을 한 화면에서
정리하고, 클리어 체크를 지인들끼리 공유합니다.

프로덕션: [daengmang.vercel.app](https://daengmang.vercel.app) ·
[nangaga.vercel.app](https://nangaga.vercel.app)

> 코드를 이어서 작업할 때는 **[AGENTS.md](./AGENTS.md)** 를 먼저 읽으세요.
> 구조·도메인 규칙·UI 합의 사항이 정리돼 있습니다.

---

## 화면

### 레이드 정리 (`/`)

- **대시보드** — 유저 카드에 캐릭터별 레이드·골드 진행도. 카드형/가로형 배치 전환,
  드래그로 유저·캐릭터·레이드 순서 변경
- **파티 추천** — 딜3+서폿1 기준 자동 편성 (우측, 접기 가능)
- **직접 클리어 체크** — 공팟·2인팟 등 자유 조합으로 클리어 일괄 체크·취소
- **아맞다** — 유저·캐릭 단위 커스텀 체크리스트 (주간 리셋 선택 가능)
- **관리** — 유저·캐릭터 추가/삭제, 레이드 배정, 골드 기준 설정
- **쌀산기** — 우하단 FAB, 경매 입찰가 계산

### 놀이터 (`/playground`)

숙제와 무관한 놀이 모음.

- **확률 의식** — 성공 확률을 넣고 `시도`를 누르면 대신 굴려주다가, 뚫리는 순간
  "지금 눌러!!"를 띄웁니다. (게임 서버 난수와는 무관한 순수 연출입니다)

---

## 로컬 실행

```bash
npm install
npm run seed   # 테스트 데이터 (data/raid-data.json)
npm run dev
```

[http://localhost:3000](http://localhost:3000)

로컬에서는 `data/raid-data.json` 파일에 저장됩니다. 이 파일은 git에 올라가지 않고,
비어 있으면 화면이 텅 비므로 `npm run seed`로 언제든 되살릴 수 있습니다.

---

## 데이터 저장

| 환경 | 저장소 |
|---|---|
| 로컬 | `data/raid-data.json` |
| 배포 | Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) |

배포 환경에서 환경 변수가 없으면 에러를 냅니다. 보기 설정(테마, 배치, 유저 표시 순서
등)은 서버가 아니라 **각자 브라우저의 localStorage**에 저장됩니다.

**주간 리셋**: 수요일 10시(KST)를 넘겨 처음 접속하면 모든 캐릭의 클리어 기록과
주간 아맞다 체크가 자동으로 비워집니다.

---

## 배포

GitHub 푸시만으로는 배포되지 않습니다. **CLI로 직접** 올려야 합니다.

```bash
git push origin main
vercel --prod --yes
```

최초 설정이 필요하면:

```bash
npx vercel login
npx vercel link
```

Vercel Dashboard → Settings → Environment Variables 에 아래 2개를 등록합니다.

| 변수 | 값 |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST Token |

로컬 JSON을 Redis로 한 번에 올리려면 `.env.local`에 위 변수를 넣고:

```bash
npm run import-data
```

---

## 스크립트

| 명령어 | 설명 |
| ------ | ---- |
| `npm run dev` | 개발 서버 (Turbopack) |
| `npm run seed` | 로컬 테스트 데이터 생성 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint |
| `npm run import-data` | 로컬 JSON → Redis 업로드 |

---

## 기술 스택

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Upstash Redis · Vercel
