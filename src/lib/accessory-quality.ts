/**
 * 악세서리 힘/민/지 품질 판독 (고대 기준).
 * 원본: 사용자 제공 엑셀 — 부위·연마 단계별 힘/민/지 최소~최대 표에서
 *   품질 = (내 수치 − 최소) ÷ (최대 − 최소)
 * 엑셀은 범위 밖 값을 0% 또는 100% 초과로 그대로 보여줬는데, 대개 부위·연마 단계를
 * 잘못 고른 경우라 여기서는 "범위 밖"으로 따로 알린다.
 * 유물 표는 아직 없다 — 받으면 등급 축을 추가한다.
 */

export type AccessoryPart = "necklace" | "earring" | "ring";

export const ACCESSORY_PARTS: { id: AccessoryPart; label: string }[] = [
  { id: "necklace", label: "목걸이" },
  { id: "earring", label: "귀걸이" },
  { id: "ring", label: "반지" },
];

/** 연마 단계 0~3 */
export const POLISH_STAGES = [0, 1, 2, 3] as const;
export type PolishStage = (typeof POLISH_STAGES)[number];

/** [최소, 최대] — 인덱스가 연마 단계 */
const MAIN_STAT_RANGE: Record<AccessoryPart, [number, number][]> = {
  ring: [
    [9156, 11091],
    [9414, 11349],
    [9930, 11865],
    [10962, 12897],
  ],
  earring: [
    [9861, 11944],
    [10139, 12222],
    [10695, 12778],
    [11806, 13889],
  ],
  necklace: [
    [12678, 15357],
    [13035, 15714],
    [13749, 16428],
    [15178, 17857],
  ],
};

export type QualityResult =
  | { status: "ok"; quality: number; min: number; max: number }
  | { status: "below" | "above"; min: number; max: number };

/**
 * 품질 구간별 색 (globals.css의 --quality-* 변수). 구간을 바꾸려면 여기만 만진다.
 * 위에서부터 처음 걸리는 구간을 쓴다.
 */
const QUALITY_TIERS: { min: number; color: string }[] = [
  { min: 90, color: "var(--quality-purple)" },
  { min: 70, color: "var(--quality-blue)" },
  { min: 40, color: "var(--quality-green)" },
  { min: 0, color: "var(--quality-yellow)" },
];

export function qualityColor(quality: number): string {
  return (QUALITY_TIERS.find((tier) => quality >= tier.min) ?? QUALITY_TIERS.at(-1)!).color;
}

export function getMainStatRange(part: AccessoryPart, stage: PolishStage) {
  const [min, max] = MAIN_STAT_RANGE[part][stage];
  return { min, max };
}

/** 품질(0~100, 정수 내림). 내림인 이유: 99.6%를 100으로 보여주면 최대치로 오해한다 */
export function calcAccessoryQuality(
  part: AccessoryPart,
  stage: PolishStage,
  mainStat: number,
): QualityResult {
  const { min, max } = getMainStatRange(part, stage);
  if (mainStat < min) return { status: "below", min, max };
  if (mainStat > max) return { status: "above", min, max };
  return {
    status: "ok",
    quality: Math.floor(((mainStat - min) / (max - min)) * 100),
    min,
    max,
  };
}
