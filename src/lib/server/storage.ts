import { Redis } from "@upstash/redis";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { applyWeeklyAmajdaResetToUser } from "@/lib/amajda";
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
  return raids.length > 0 ? raids : undefined;
}

function parseStoredData(raw: unknown): StoredData {
  if (!raw || typeof raw !== "object") {
    return { users: [] };
  }
  const record = raw as Record<string, unknown>;
  return {
    users: migrateUsers(record.users),
    weeklyResetKey:
      typeof record.weeklyResetKey === "string" ? record.weeklyResetKey : undefined,
    customRaids: parseCustomRaids(record.customRaids),
  };
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
    const { normalized, changed } = applyWeeklyReset(parsed);
    if (changed) {
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
  const { normalized, changed } = applyWeeklyReset(parsed);
  if (changed) {
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
