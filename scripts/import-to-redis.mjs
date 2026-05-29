import { readFileSync, existsSync } from "fs";
import { join } from "path";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(join(process.cwd(), ".env.local"));
loadEnvFile(join(process.cwd(), ".env"));

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error(
    "UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN 가 .env.local 에 필요합니다.",
  );
  process.exit(1);
}

const dataPath = join(process.cwd(), "data", "raid-data.json");
if (!existsSync(dataPath)) {
  console.error("data/raid-data.json 파일이 없습니다.");
  process.exit(1);
}

const payload = JSON.parse(readFileSync(dataPath, "utf8"));
const userCount = Array.isArray(payload.users) ? payload.users.length : 0;

const response = await fetch(`${url}/set/daengmang:raid-data`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  const text = await response.text();
  console.error("Redis 업로드 실패:", response.status, text);
  process.exit(1);
}

console.log(`완료: 유저 ${userCount}명 데이터를 Redis에 업로드했습니다.`);
