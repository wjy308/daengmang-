/**
 * 로컬 개발용 테스트 데이터 시드.
 *
 *   npm run seed
 *
 * data/raid-data.json을 아래 고정 데이터로 덮어쓴다. 결과가 매번 같아서
 * 데이터가 날아가도 같은 화면으로 복구된다. (Redis 환경변수와 무관하게 로컬 파일만 건드림)
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "raid-data.json");

/** storage.ts의 toResetKeyInKst와 같은 계산 — 수요일 10시(KST) 기준 주간 키 */
function toResetKeyInKst(now = new Date()) {
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const day = kstNow.getUTCDay();
  const hour = kstNow.getUTCHours();

  let diffDays = (day - 3 + 7) % 7;
  if (day === 3 && hour < 10) diffDays = 7;

  const resetPoint = new Date(
    Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate(),
      10,
      0,
      0,
      0,
    ),
  );
  resetPoint.setUTCDate(resetPoint.getUTCDate() - diffDays);

  const y = resetPoint.getUTCFullYear();
  const m = String(resetPoint.getUTCMonth() + 1).padStart(2, "0");
  const d = String(resetPoint.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function char(userIdx, idx, name, role, assigned, opts = {}) {
  return {
    id: `seed-char-${userIdx}-${idx}`,
    name,
    role,
    goldIncluded: opts.goldIncluded ?? true,
    assignedRaids: assigned,
    noGoldRaids: opts.noGold ?? [],
    bonusRaids: opts.bonus ?? [],
    clearedRaids: opts.cleared ?? [],
    amajdaItems: opts.amajdaItems ?? [],
    amajdaChecked: opts.amajdaChecked ?? [],
  };
}

const users = [
  {
    id: "seed-user-1",
    nickname: "댕망이",
    goldPriority: "total",
    goldTiePreference: ["sacred-3", "end-hard"],
    amajdaItems: [
      { id: "seed-am-1-1", label: "주간 에포나", period: "주간", resetWeekly: true },
      { id: "seed-am-1-2", label: "카양겔 낙원", period: "이벤트", resetWeekly: true },
      { id: "seed-am-1-3", label: "생활 에너지 관리", resetWeekly: false },
    ],
    amajdaChecked: ["seed-am-1-1"],
    characters: [
      char(1, 1, "댕망이", "dealer", ["serca-hard", "end-hard", "sacred-3"], {
        cleared: ["serca-hard"],
        bonus: ["serca-hard"],
      }),
      char(1, 2, "댕망폿", "support", ["serca-hard", "end-hard", "sacred-3"], {
        cleared: ["serca-hard"],
      }),
      char(1, 3, "댕망딜2", "dealer", ["end-hard", "act4-hard", "sacred-2"], {
        cleared: ["end-hard"],
      }),
      char(1, 4, "댕망딜3", "dealer", ["act4-hard", "sacred-2", "serca-normal"]),
      char(1, 5, "댕망폿2", "support", ["act4-hard", "sacred-2"], {
        noGold: ["sacred-2"],
      }),
      char(1, 6, "댕망부캐", "dealer", ["act4-normal", "sacred-1", "end-normal"], {
        amajdaItems: [
          { id: "seed-am-1-4", label: "카드 각성", resetWeekly: false },
        ],
      }),
      char(1, 7, "골드밖캐", "dealer", ["sacred-1", "act4-normal"], {
        goldIncluded: false,
      }),
    ],
  },
  {
    id: "seed-user-2",
    nickname: "포션셔틀",
    goldPriority: "normal",
    goldTiePreference: ["serca-hard"],
    amajdaItems: [
      { id: "seed-am-2-1", label: "주간 에포나", period: "주간", resetWeekly: true },
      { id: "seed-am-2-2", label: "길드 출석", period: "주간", resetWeekly: true },
    ],
    amajdaChecked: [],
    characters: [
      char(2, 1, "포션셔틀", "support", ["serca-hard", "end-hard", "sacred-3"], {
        cleared: ["serca-hard", "end-hard"],
        bonus: ["end-hard"],
      }),
      char(2, 2, "물약장인", "dealer", ["serca-hard", "end-hard", "sacred-2"], {
        cleared: ["serca-hard"],
      }),
      char(2, 3, "버프요정", "support", ["act4-hard", "sacred-2", "serca-normal"]),
      char(2, 4, "딜조각", "dealer", ["act4-hard", "sacred-1", "end-normal"], {
        noGold: ["end-normal"],
      }),
      char(2, 5, "숙제봇", "dealer", ["act4-normal", "sacred-1"], {
        cleared: ["sacred-1"],
      }),
    ],
  },
  {
    id: "seed-user-3",
    nickname: "골드요정",
    goldPriority: "total",
    goldTiePreference: [],
    amajdaItems: [
      { id: "seed-am-3-1", label: "주간 에포나", period: "주간", resetWeekly: true },
    ],
    amajdaChecked: ["seed-am-3-1"],
    characters: [
      char(3, 1, "골드요정", "dealer", ["serca-hard", "sacred-3", "end-hard"], {
        cleared: ["sacred-3"],
        bonus: ["sacred-3"],
      }),
      char(3, 2, "요정폿", "support", ["serca-hard", "sacred-3", "act4-hard"]),
      char(3, 3, "요정딜2", "dealer", ["end-hard", "sacred-2", "serca-normal"], {
        cleared: ["serca-normal"],
      }),
      char(3, 4, "요정부캐", "dealer", ["sacred-1", "act4-normal"], {
        noGold: ["act4-normal"],
      }),
    ],
  },
  {
    id: "seed-user-4",
    nickname: "출근각",
    goldPriority: "normal",
    goldTiePreference: ["act4-hard"],
    amajdaItems: [],
    amajdaChecked: [],
    characters: [
      char(4, 1, "출근각", "dealer", ["end-hard", "act4-hard", "sacred-2"], {
        cleared: ["end-hard", "act4-hard", "sacred-2"],
        bonus: ["act4-hard"],
      }),
      char(4, 2, "퇴근각", "support", ["act4-hard", "sacred-2", "serca-normal"], {
        cleared: ["act4-hard"],
      }),
      char(4, 3, "야근각", "dealer", ["sacred-1", "act4-normal", "end-normal"]),
    ],
  },
];

const data = { users, weeklyResetKey: toResetKeyInKst() };

await mkdir(DATA_DIR, { recursive: true });
await writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");

const charCount = users.reduce((n, u) => n + u.characters.length, 0);
console.log(
  `시드 완료: ${DATA_FILE}\n유저 ${users.length}명 · 캐릭 ${charCount}명 · 주간키 ${data.weeklyResetKey}`,
);
