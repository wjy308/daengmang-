/**
 * "확률 의식" 놀이의 계산부.
 *
 * 매 틱마다 성공 확률 p의 베르누이 시행을 굴리므로 성공까지 걸리는 시도 횟수는
 * 기하분포를 따른다. UI는 이 결과를 연출만 할 뿐 게임 서버 난수와는 아무 관계가 없다.
 */

/** 입력 가능한 확률 범위 (%) */
export const MIN_PERCENT = 0.01;
export const MAX_PERCENT = 100;

/** 굴리는 속도 (ms) — 느릴수록 애가 탄다 */
export const TICK_PRESETS = [
  { id: "slow", label: "쫄깃", ms: 260 },
  { id: "normal", label: "보통", ms: 120 },
  { id: "fast", label: "속행", ms: 40 },
] as const;

export type TickPresetId = (typeof TICK_PRESETS)[number]["id"];

/** 자주 쓰는 확률 (로아 재련 단계) */
export const PERCENT_PRESETS = [
  { label: "2%", percent: 2 },
  { label: "97돌", percent: 0.1379 },
  { label: "107·99돌", percent: 0.003825 },
] as const;

/** 한 판이 이 정도 시간 안에 끝나도록 틱당 시행 수를 맞춘다 */
const TARGET_RUN_MS = 8000;

/**
 * 틱당 굴릴 시행 수.
 *
 * 0.003825% 같은 확률은 기대 시도가 2만 회를 넘어서 한 틱에 한 번씩 굴리면
 * 수십 분이 걸린다. 확률이 낮을수록 한 틱에 여러 번 굴려 체감 시간을 맞춘다.
 */
export function trialsPerTick(percent: number, tickMs: number): number {
  const ticks = Math.max(1, TARGET_RUN_MS / tickMs);
  return Math.max(1, Math.ceil(expectedAttempts(percent) / ticks));
}

/**
 * 다음 성공이 몇 번째 시행에서 나오는지 (기하분포 역변환 샘플링).
 * 1 이상의 정수를 돌려준다.
 */
export function sampleTrialsToSuccess(percent: number): number {
  const p = clampPercent(percent) / 100;
  if (p >= 1) return 1;
  const u = Math.random();
  // u가 0이면 무한대가 되므로 하한을 둔다
  return Math.max(1, Math.ceil(Math.log(u || Number.MIN_VALUE) / Math.log(1 - p)));
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return MIN_PERCENT;
  return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, value));
}

/** 기대 시도 횟수 1/p */
export function expectedAttempts(percent: number): number {
  return 1 / (clampPercent(percent) / 100);
}

/** n번째 이내에 성공할 확률 = 1 - (1-p)^n */
export function cumulativeChance(percent: number, attempts: number): number {
  const p = clampPercent(percent) / 100;
  if (attempts <= 0) return 0;
  return 1 - Math.pow(1 - p, attempts);
}

export interface RitualVerdict {
  /** 이 횟수 이내로 끝날 확률 (0~1) — 작을수록 운이 좋았다 */
  cumulative: number;
  label: string;
  tone: "great" | "good" | "normal" | "bad";
}

/**
 * 몇 번 만에 뚫었는지를 기대값과 비교해 한 줄 평으로 옮긴다.
 * 기하분포에서 중앙값 부근(누적 50%)이 "평범"이다.
 */
export function judge(percent: number, attempts: number): RitualVerdict {
  const cumulative = cumulativeChance(percent, attempts);

  if (cumulative <= 0.1) {
    return { cumulative, label: "상위 10% 손", tone: "great" };
  }
  if (cumulative <= 0.35) {
    return { cumulative, label: "꽤 잘 뽑았다", tone: "good" };
  }
  if (cumulative <= 0.75) {
    return { cumulative, label: "그럭저럭 평범", tone: "normal" };
  }
  return { cumulative, label: "이 정도면 고생했다", tone: "bad" };
}

export interface RitualRecord {
  id: number;
  percent: number;
  attempts: number;
}

export function averageAttempts(records: RitualRecord[]): number | null {
  if (records.length === 0) return null;
  return records.reduce((n, r) => n + r.attempts, 0) / records.length;
}
