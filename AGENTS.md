# 인수인계서 (AI 에이전트용)

이 저장소에서 작업을 이어받는 AI를 위한 문서입니다. 사람이 읽을 설치·배포 안내는
[README.md](./README.md)에 있습니다. 여기에는 **코드만 봐서는 알기 어려운 배경과 규칙**만
적습니다.

---

## 1. 이 프로젝트가 뭔가

로스트아크 **길드/지인 단위 주간 숙제 관리** 도구입니다. "댕망"은 서비스 이름.
여러 사람이 같은 데이터를 공유해서 보고, 각자 브라우저에서 보기 방식만 다르게 둡니다.

- **레이드 정리** (`/`) — 유저·캐릭터·레이드 배정, 골드 수급 계산, 클리어 체크, 아맞다(할 일) 체크리스트
- **놀이터** (`/playground`) — 숙제와 무관한 놀이 모음. 지금은 "확률 의식" 하나

**가장 중요한 맥락**: 이 앱의 실사용자는 소수(지인 그룹)이고, 요구는 대부분
"실제로 써 보니 불편하다"에서 나옵니다. 정교한 추상화보다 **화면에서 바로 체감되는
개선**이 우선합니다.

---

## 2. 기술 스택 · 구조

Next.js 15 App Router · React 19 · TypeScript · Tailwind CSS v4 · Upstash Redis

```
src/
  app/
    page.tsx            → RaidBoard (레이드 정리)
    playground/page.tsx → Playground (놀이터)
    api/                → 유저·캐릭터 CRUD, 파티 클리어 일괄 처리
    globals.css         → CSS 변수(테마) + 커스텀 애니메이션 전부
  components/           → 화면 단위 컴포넌트 (대부분 "use client")
    ui/                 → 재사용 조각 (RaidChip, RoleBadge, ReorderGrip …)
    playground/         → 놀이 시스템 컴포넌트
  hooks/                → 스토어·드래그·localStorage 훅
  lib/                  → 순수 로직 (골드 계산, 파티 편성, 레이드 정의)
    server/             → 서버 전용 저장소 접근
data/raid-data.json     → 로컬 개발용 저장소 (git 무시)
```

### 데이터 저장

`src/lib/server/storage.ts` 한 곳에서 갈립니다.

- `UPSTASH_REDIS_REST_URL` / `_TOKEN`이 있으면 → **Redis** (배포 환경)
- 없으면 → **`data/raid-data.json`** (로컬). 프로덕션에서 환경변수가 없으면 의도적으로 throw

로딩할 때 **주간 리셋**을 함께 처리합니다. 수요일 10시(KST) 기준 `weeklyResetKey`가
바뀌면 모든 캐릭의 `clearedRaids`와 주간 아맞다 체크를 비웁니다. 이 키 계산을 복제하는
코드가 `scripts/seed-test-data.mjs`에도 있으니 **로직을 바꾸면 양쪽을 같이** 고쳐야 합니다.

### 서버 데이터 vs 브라우저 설정

이 구분이 이 프로젝트의 핵심 규칙입니다.

| 종류 | 저장 위치 | 예시 |
|---|---|---|
| 공유 데이터 | Redis / JSON | 유저, 캐릭터, 레이드 배정, 클리어 여부, 골드 기준, 아맞다 |
| 개인 보기 설정 | localStorage | 대시보드 접힘, 가로/카드 배치, **유저 표시 순서**, 제외 캐릭 펼침, 테마, 골드표 보정 |

> **유저 "표시 순서"는 브라우저 설정이고, 캐릭터 순서는 서버 데이터입니다.**
> 헷갈리기 쉬우니 순서 관련 작업을 할 때 반드시 확인하세요.

localStorage 키는 `daengmang-` 접두사를 씁니다. 현재 쓰이는 키:

| 키 | 내용 |
|---|---|
| `daengmang-theme` | 다크/라이트 |
| `daengmang-selected-user` | 관리 화면에서 선택한 유저 |
| `daengmang-dashboard-open` | 대시보드 본문 접힘 |
| `daengmang-dashboard-side-open` | 우측 파티 추천 접힘 |
| `daengmang-dashboard-row-layout` | 가로 정렬 여부 |
| `daengmang-dashboard-user-order` | 유저 표시 순서 (id 배열) |
| `daengmang-char-expanded:<캐릭터id>` | 골드 합산 제외 캐릭 펼침 |
| `daengmang-gold-overrides` | 골드표 사용자 보정값 |

새 보기 설정을 추가할 때는 훅을 새로 만들지 말고 아래를 재사용하세요.

- `usePersistedFlag(key, fallback)` → `[value, toggle]`
- `usePersistedOrder(key, ids)` → `[orderedIds, setOrder]`

두 훅 모두 **서버 렌더와 첫 렌더는 기본값**을 쓰고 마운트 직후 저장값을 반영합니다.
하이드레이션 불일치를 피하기 위한 의도된 설계이니 `useState` 초기값에서 직접
`localStorage`를 읽지 마세요.

---

## 3. 도메인 규칙 (골드 계산)

`src/lib/gold.ts`가 중심입니다. 레이드 정의(보상·요구 레벨)는 `src/lib/raids.ts`.

- 캐릭터는 **주 3개 레이드까지** 골드를 받습니다 → `getRecommendedGoldRaidIds`
- 계정당 **골드 합산 캐릭터는 최대 6명** (`goldIncluded`) — `raid-store.ts`에서 강제
- 유저별 **골드 기준**(`goldPriority`)
  - `total`: 귀속 포함 총 골드가 큰 순
  - `normal`: 거래 가능한 유통 골드가 큰 순
- 골드가 같은 레이드는 `goldTiePreference` 순서로 우선순위를 정합니다
- `noGoldRaids`는 "가긴 가는데 골드는 안 받는" 레이드입니다. 골드 계산에서 빠지되
  숙제 목록에는 남습니다
- 골드표는 사용자가 값을 덮어쓸 수 있고(`gold-overrides.ts`, localStorage),
  계산 함수 대부분이 `goldOverrides`를 마지막 인자로 받습니다. **새 계산을 추가할 때
  이 인자를 빠뜨리지 마세요** — 보정값이 적용되지 않는 버그가 조용히 생깁니다

---

## 4. UI 규칙 (합의된 것들)

실제 피드백을 거치며 정착한 규칙입니다. 되돌리기 전에 이유를 보세요.

### 색

- 테마 색은 전부 `globals.css`의 CSS 변수. **하드코딩 hex 금지**
- 주황(`--accent`)은 "골드/중요" 신호인데 **화면에 이미 많습니다.** 새로 강조를 넣을 때
  주황 면적을 늘리지 말고 다음 순서로 고르세요:
  1. 글자색·굵기 (가장 조용함)
  2. 아이콘/마커 (★ 같은 것)
  3. 테두리 (여기부터 눈에 띄게 셉니다)
  4. 배경 (거의 쓰지 말 것)
- 직접 클리어 체크의 골드 대상 캐릭은 **이름 글자색 + ★**로만 구분합니다.
  배경 강조는 "너무 눈부시다"고 걷어냈고, 테두리도 시안 비교 후 탈락했습니다
- 클리어(초록) 상태 위에 골드(주황) 테두리를 덧씌우지 않습니다 — 상태가 가려집니다

### 애니메이션

- 키프레임은 전부 `globals.css`에 모읍니다
- **모든 애니메이션에 `prefers-reduced-motion: reduce` 대응을 넣습니다**

### 마스코트

`public/`의 캐릭터 이미지는 재미 요소로 곳곳에 붙어 있습니다.

| 파일 | 대사 | 쓰이는 곳 |
|---|---|---|
| `more.png` | 더 줘!! | 골드 기준 스위치 hover, 확률 의식이 길어질 때 |
| `letsGo.png` | 가즈아 | 클리어 체크 버튼 커서, 확률 의식 성공 |
| `run.png` | 도망 | 클리어 **취소** 모드 커서 |
| `play.png` | 까까룽 | 놀이터 탭·헤더 |
| `rice-calculator-fab.webp` | — | 쌀산기 FAB |

### 커스텀 커서 (중요)

CSS `cursor: url(...)`은 **쓰지 마세요.** 브라우저가 커서를 갱신할 때마다 기본 화살표로
잠깐 되돌아가며 깜빡입니다. 이미 겪고 갈아엎었습니다.

대신 `ui/MascotCursor.tsx` 방식을 씁니다.

- 대상 요소에 `cursor-none`
- 마스코트는 `position: fixed` DOM 요소
- 위치는 **리렌더 없이 ref로 transform만 직접 갱신** (mousemove 리스너)
- 이미지는 `globals.css`에 data URI로 인라인 (`.mascot-cursor-*`) — 네트워크·캐시 개입 차단

---

## 5. 작업 방식

### 검증

```bash
npx tsc --noEmit          # 항상
npx next lint --file <경로>  # 건드린 파일
npm run build             # 구조를 바꿨을 때
```

> **알려진 함정**: `npm run build`가 "Collecting page data" 단계에서 간헐적으로
> 실패합니다(매번 다른 모듈 이름). 코드 문제가 아니라 turbopack 이슈이니
> `rm -rf .next && npm run build`로 재실행하면 통과합니다. 기존 lint 경고
> (`RaidBoard.tsx`의 `toCancel`, `useAmajdaIntervalNotify`의 deps)도 이미 있던 것입니다.

### 테스트 데이터

`data/raid-data.json`이 비면 화면이 텅 빕니다.

```bash
npm run seed   # 유저 4명 · 캐릭 19명, 고정 데이터
```

골드 기준 `total`/`normal`, 클리어·더보기·무골·합산 제외 캐릭이 섞여 있어 대부분의
UI 상태를 한 번에 볼 수 있습니다.

### 커밋 · 배포

- 커밋 메시지는 **한국어**, `Feat:` / `Fix:` / `Refactor:` / `Chore:` 접두사
- **GitHub 푸시로 자동 배포되지 않습니다.** 반드시 CLI로:

```bash
git push origin main
vercel --prod --yes
```

프로덕션: https://daengmang.vercel.app , https://nangaga.vercel.app

### 사용자와 일하는 방식

- 디자인 취향 문제는 혼자 정하지 말고 **시안을 실제 화면에 여러 개 깔아서 고르게** 하면
  훨씬 빨리 끝납니다 (한 번 이렇게 진행해서 "이름 글자색" 안이 채택됐습니다)
- 수치 조정(간격, 위치, 크기)은 여러 번 왕복합니다. 한 번에 크게 바꾸지 말고
  **조정 지점을 상수로 빼두고** 어디를 만지면 되는지 알려주세요

---

## 6. 놀이터 확장하기

`src/app/playground/page.tsx` → `components/Playground.tsx` → 놀이 컴포넌트들.

새 놀이를 추가하려면:

1. 계산 로직은 `src/lib/playground/<이름>.ts`에 **순수 함수**로 (난수 굴림 포함)
2. UI는 `src/components/playground/<이름>.tsx`
3. `Playground.tsx`의 `<main>`에 섹션으로 추가

현재 있는 것: **확률 의식** (`ProbabilityRitual`) — 성공 확률을 받아 매 틱 베르누이
시행을 굴리고, 성공하는 순간 "지금 눌러!!"를 띄웁니다. 기하분포라 2%면 평균 50틱입니다.
당연히 게임 서버 난수와는 무관하고, 그 점을 UI에 문구로 밝혀 두었습니다.
