import { Redis } from "@upstash/redis";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { applyWeeklyAmajdaResetToUser } from "@/lib/amajda";
import { parseLeaderToolsData, type LeaderToolsData } from "@/lib/leader-tools";
import { migrateUsers } from "@/lib/migrate";
import { DEFAULT_RAID_DEFINITIONS, type RaidDefinition } from "@/lib/raids";
import type { User } from "@/lib/types";

const REDIS_KEY = "daengmang:raid-data";
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "raid-data.json");

export interface StoredData {
  users: User[];
  /** KST 기준 마지막 주간 리셋 기준키 (YYYY-MM-DD) */
  weeklyResetKey?: string;
  /**
   * 커스텀 레이드 정의 목록.
   * 설정되면 DEFAULT_RAID_DEFINITIONS 전체를 대체한다.
   * undefined = 기본값 사용.
   */
  customRaids?: RaidDefinition[];
}

function hasRedisConfig(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

function getRedis(): Redis {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

function parseCustomRaids(raw: unknown): RaidDefinition[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const raids: RaidDefinition[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (typeof r.id !== "string" || typeof r.group !== "string") continue;
    raids.push({
      id: r.id,
      group: r.group,
      difficulty: typeof r.difficulty === "string" ? r.difficulty : "",
      label: typeof r.label === "string" ? r.label : r.id,
      requiredLevel: typeof r.requiredLevel === "number" ? r.requiredLevel : 0,
      boundGold: typeof r.boundGold === "number" ? r.boundGold : 0,
      normalGold: typeof r.normalGold === "number" ? r.normalGold : 0,
      bonusCost: typeof r.bonusCost === "number" ? r.bonusCost : 0,
      soloRaid: r.soloRaid === true,
    });
  }
  return raids.length > 0 ? normalizeBelgardinLabels(raids) : undefined;
}

function normalizeBelgardinLabels(raids: RaidDefinition[]): RaidDefinition[] {
  return raids.map((raid) => {
    if (!raid.id.toLowerCase().includes("belgardin") || raid.label !== "벨가르딘") {
      return raid;
    }
    const difficulty = raid.id.endsWith("-hard")
      ? "하드"
      : raid.id.endsWith("-normal")
        ? "노말"
        : "";
    return difficulty
      ? { ...raid, difficulty, label: `벨가르딘 · ${difficulty}` }
      : raid;
  });
}

/**
 * v1 주간 리셋 버그로 customRaids가 누락된 저장본을 화면에서 복구한다.
 * 레이드 보상 등 원래 입력값은 유실되어 알 수 없지만, 이미 캐릭터에 배정된
 * 레이드는 다시 선택·클리어할 수 있어야 한다.
 */
function recoverAssignedCustomRaids(users: User[]): RaidDefinition[] | undefined {
  const defaultIds = new Set(DEFAULT_RAID_DEFINITIONS.map((raid) => raid.id));
  const recoveredIds = new Set<string>();

  for (const user of users) {
    for (const character of user.characters) {
      for (const raidId of character.assignedRaids) {
        if (!defaultIds.has(raidId)) recoveredIds.add(raidId);
      }
    }
  }

  if (recoveredIds.size === 0) return undefined;

  return [
    ...DEFAULT_RAID_DEFINITIONS,
    ...[...recoveredIds].map((id) => {
      const isBelgardin = id.toLowerCase().includes("belgardin");
      const difficulty = id.endsWith("-hard")
        ? "하드"
        : id.endsWith("-normal")
          ? "노말"
          : "";
      return {
        id,
        group: isBelgardin ? "벨가르딘" : "복구된 레이드",
        difficulty: isBelgardin ? difficulty : "",
        label: isBelgardin
          ? difficulty
            ? `벨가르딘 · ${difficulty}`
            : "벨가르딘"
          : id,
        requiredLevel: 0,
        boundGold: 0,
        normalGold: 0,
        bonusCost: 0,
      };
    }),
  ];
}

function parseStoredData(raw: unknown): StoredData {
  if (!raw || typeof raw !== "object") {
    return { users: [] };
  }
  const record = raw as Record<string, unknown>;
  const users = migrateUsers(record.users);
  const customRaids = parseCustomRaids(record.customRaids);
  return {
    users,
    weeklyResetKey:
      typeof record.weeklyResetKey === "string" ? record.weeklyResetKey : undefined,
    customRaids: customRaids ?? recoverAssignedCustomRaids(users),
  };
}

function hasRecoveredCustomRaids(raw: unknown, data: StoredData): boolean {
  if (!raw || typeof raw !== "object" || !data.customRaids) return false;
  return !parseCustomRaids((raw as Record<string, unknown>).customRaids);
}

/** 현재 저장된 레이드 정의 반환 (customRaids 우선, 없으면 기본값) */
export function getEffectiveRaids(data: StoredData): RaidDefinition[] {
  return data.customRaids ?? DEFAULT_RAID_DEFINITIONS;
}

function toKstPseudoDate(now: Date): Date {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

function toResetKeyInKst(now: Date): string {
  const kstNow = toKstPseudoDate(now);
  const day = kstNow.getUTCDay(); // 0:Sun ~ 6:Sat
  const hour = kstNow.getUTCHours();

  let diffDays = (day - 3 + 7) % 7; // Wednesday=3
  const beforeResetTime = day === 3 && hour < 10;
  if (beforeResetTime) diffDays = 7;

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

  const year = resetPoint.getUTCFullYear();
  const month = String(resetPoint.getUTCMonth() + 1).padStart(2, "0");
  const date = String(resetPoint.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function applyWeeklyRaidReset(users: User[]): User[] {
  return users.map((user) => {
    const withAmajda = applyWeeklyAmajdaResetToUser(user);
    return {
      ...withAmajda,
      characters: withAmajda.characters.map((character) => ({
        ...character,
        clearedRaids: [],
      })),
    };
  });
}

function applyWeeklyReset(data: StoredData): { normalized: StoredData; changed: boolean } {
  const currentKey = toResetKeyInKst(new Date());
  if (!data.weeklyResetKey) {
    return {
      normalized: { ...data, weeklyResetKey: currentKey },
      changed: true,
    };
  }
  if (data.weeklyResetKey === currentKey) {
    return { normalized: data, changed: false };
  }
  return {
    normalized: {
      users: applyWeeklyRaidReset(data.users),
      weeklyResetKey: currentKey,
      // 레이드 정의는 주간 숙제 상태가 아닌 공유 설정이다. 이 필드를
      // 빠뜨리면 주간 리셋 저장 시 커스텀 레이드 전체가 사라진다.
      customRaids: data.customRaids,
    },
    changed: true,
  };
}

async function loadFromFile(): Promise<StoredData> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return parseStoredData(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    const empty: StoredData = { users: [] };
    await writeFile(DATA_FILE, JSON.stringify(empty, null, 2), "utf8");
    return empty;
  }
}

async function saveToFile(data: StoredData): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function loadStoredData(): Promise<StoredData> {
  if (hasRedisConfig()) {
    const redis = getRedis();
    const raw = await redis.get<StoredData>(REDIS_KEY);
    if (!raw) {
      const initial: StoredData = {
        users: [],
        weeklyResetKey: toResetKeyInKst(new Date()),
      };
      await redis.set(REDIS_KEY, initial);
      return initial;
    }
    const parsed = parseStoredData(raw);
    const recoveredCustomRaids = hasRecoveredCustomRaids(raw, parsed);
    const { normalized, changed } = applyWeeklyReset(parsed);
    if (changed || recoveredCustomRaids) {
      await redis.set(REDIS_KEY, normalized);
    }
    return normalized;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "배포 환경에서는 UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN 환경 변수가 필요합니다.",
    );
  }

  const parsed = await loadFromFile();
  const recoveredCustomRaids = hasRecoveredCustomRaids(
    JSON.parse(await readFile(DATA_FILE, "utf8")) as Record<string, unknown>,
    parsed,
  );
  const { normalized, changed } = applyWeeklyReset(parsed);
  if (changed || recoveredCustomRaids) {
    await saveToFile(normalized);
  }
  return normalized;
}

export async function saveStoredData(data: StoredData): Promise<void> {
  if (hasRedisConfig()) {
    const redis = getRedis();
    await redis.set(REDIS_KEY, data);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "배포 환경에서는 UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN 환경 변수가 필요합니다.",
    );
  }

  await saveToFile(data);
}

/** 로컬 JSON → Redis 일회성 업로드용 */
export async function importStoredData(data: StoredData): Promise<void> {
  if (!hasRedisConfig()) {
    throw new Error("Redis 환경 변수가 설정되어 있지 않습니다.");
  }
  const normalized = parseStoredData(data);
  const withResetKey = normalized.weeklyResetKey
    ? normalized
    : { ...normalized, weeklyResetKey: toResetKeyInKst(new Date()) };
  const redis = getRedis();
  await redis.set(REDIS_KEY, withResetKey);
}

// ─── 공대장 도구 ─────────────────────────────────────────────────────────────
// 레이드 데이터와 키를 나눠 둔다. 같은 묶음에 넣으면 주간 리셋 저장 때
// 필드를 빠뜨려 통째로 날아가는 사고(customRaids)가 다시 날 수 있다.

const LEADER_TOOLS_REDIS_KEY = "daengmang:leader-tools";
const LEADER_TOOLS_FILE = path.join(DATA_DIR, "leader-tools.json");

export async function loadLeaderTools(): Promise<LeaderToolsData> {
  if (hasRedisConfig()) {
    const raw = await getRedis().get<LeaderToolsData>(LEADER_TOOLS_REDIS_KEY);
    return parseLeaderToolsData(raw);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "배포 환경에서는 UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN 환경 변수가 필요합니다.",
    );
  }

  try {
    const raw = await readFile(LEADER_TOOLS_FILE, "utf8");
    return parseLeaderToolsData(JSON.parse(raw));
  } catch {
    return parseLeaderToolsData(null);
  }
}

export async function saveLeaderTools(data: LeaderToolsData): Promise<void> {
  if (hasRedisConfig()) {
    await getRedis().set(LEADER_TOOLS_REDIS_KEY, data);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "배포 환경에서는 UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN 환경 변수가 필요합니다.",
    );
  }

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(LEADER_TOOLS_FILE, JSON.stringify(data, null, 2), "utf8");
}
