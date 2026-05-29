import { Redis } from "@upstash/redis";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { migrateUsers } from "@/lib/migrate";
import type { User } from "@/lib/types";

const REDIS_KEY = "daengmang:raid-data";
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "raid-data.json");

export interface StoredData {
  users: User[];
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

function parseStoredData(raw: unknown): StoredData {
  if (!raw || typeof raw !== "object") {
    return { users: [] };
  }
  const record = raw as Record<string, unknown>;
  return { users: migrateUsers(record.users) };
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
      return { users: [] };
    }
    return parseStoredData(raw);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "배포 환경에서는 UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN 환경 변수가 필요합니다.",
    );
  }

  return loadFromFile();
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
  const redis = getRedis();
  await redis.set(REDIS_KEY, normalized);
}
