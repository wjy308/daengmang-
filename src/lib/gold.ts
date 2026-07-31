import { getRaid, RAID_DEFINITIONS, type RaidId } from "./raids";
import type { GoldOverrides } from "./gold-overrides";
import type { Character, GoldPriority, User } from "./types";

/** 캐릭터 1명이 주간 골드를 받을 수 있는 레이드 수 */
export const MAX_GOLD_RAIDS_PER_CHARACTER = 3;

export interface GoldBreakdown {
  bound: number;
  normal: number;
  total: number;
}

export interface GoldProgress {
  current: GoldBreakdown;
  max: GoldBreakdown;
}

function applyBonusCost(
  bound: number,
  normal: number,
  bonusCost: number,
): { bound: number; normal: number } {
  let nextBound = bound;
  let nextNormal = normal;
  let remainingCost = bonusCost;

  const boundDeduct = Math.min(nextBound, remainingCost);
  nextBound -= boundDeduct;
  remainingCost -= boundDeduct;

  if (remainingCost > 0) {
    const normalDeduct = Math.min(nextNormal, remainingCost);
    nextNormal -= normalDeduct;
  }

  return { bound: nextBound, normal: nextNormal };
}

export function getRaidGoldBreakdown(
  raidId: RaidId,
  withBonus: boolean,
  overrides?: GoldOverrides,
): GoldBreakdown {
  const raid = getRaid(raidId);
  const ov = overrides?.[raidId];
  const baseBound = ov?.boundGold ?? raid.boundGold;
  const baseNormal = ov?.normalGold ?? raid.normalGold;
  const bonusCost = ov?.bonusCost ?? raid.bonusCost;

  if (!withBonus) {
    return {
      bound: baseBound,
      normal: baseNormal,
      total: baseBound + baseNormal,
    };
  }

  const afterBonus = applyBonusCost(baseBound, baseNormal, bonusCost);
  return {
    bound: afterBonus.bound,
    normal: afterBonus.normal,
    total: afterBonus.bound + afterBonus.normal,
  };
}

export function getCharacterWeeklyGold(
  character: Character,
  overrides?: GoldOverrides,
): GoldBreakdown {
  let bound = 0;
  let normal = 0;

  for (const raidId of character.clearedRaids) {
    if (character.noGoldRaids.includes(raidId)) continue;
    const withBonus = character.bonusRaids.includes(raidId);
    const raidGold = getRaidGoldBreakdown(raidId, withBonus, overrides);
    bound += raidGold.bound;
    normal += raidGold.normal;
  }

  return { bound, normal, total: bound + normal };
}

export function getUserWeeklyGold(
  user: User,
  overrides?: GoldOverrides,
): GoldBreakdown {
  return user.characters.reduce<GoldBreakdown>(
    (acc, character) => {
      if (!character.goldIncluded) return acc;
      const next = getCharacterWeeklyGold(character, overrides);
      return {
        bound: acc.bound + next.bound,
        normal: acc.normal + next.normal,
        total: acc.total + next.total,
      };
    },
    { bound: 0, normal: 0, total: 0 },
  );
}

function sumBreakdown(a: GoldBreakdown, b: GoldBreakdown): GoldBreakdown {
  return {
    bound: a.bound + b.bound,
    normal: a.normal + b.normal,
    total: a.total + b.total,
  };
}

function getCharacterMaxWeeklyGold(
  character: Character,
  overrides?: GoldOverrides,
): GoldBreakdown {
  return character.assignedRaids.reduce<GoldBreakdown>(
    (acc, raidId) => {
      if (character.noGoldRaids.includes(raidId)) return acc;
      const withBonus = character.bonusRaids.includes(raidId);
      const next = getRaidGoldBreakdown(raidId, withBonus, overrides);
      return sumBreakdown(acc, next);
    },
    { bound: 0, normal: 0, total: 0 },
  );
}

export function getCharacterGoldProgress(
  character: Character,
  overrides?: GoldOverrides,
): GoldProgress {
  return {
    current: getCharacterWeeklyGold(character, overrides),
    max: getCharacterMaxWeeklyGold(character, overrides),
  };
}

export function getUserGoldProgress(
  user: User,
  overrides?: GoldOverrides,
): GoldProgress {
  return user.characters.reduce<GoldProgress>(
    (acc, character) => {
      if (!character.goldIncluded) return acc;
      const next = getCharacterGoldProgress(character, overrides);
      return {
        current: sumBreakdown(acc.current, next.current),
        max: sumBreakdown(acc.max, next.max),
      };
    },
    {
      current: { bound: 0, normal: 0, total: 0 },
      max: { bound: 0, normal: 0, total: 0 },
    },
  );
}

export function formatGold(value: number): string {
  return `${value.toLocaleString("ko-KR")}G`;
}

export interface RaidGoldOption {
  raidId: RaidId;
  label: string;
  bound: number;
  normal: number;
  total: number;
}

export interface GoldOptimizationInfo {
  byTotal: RaidGoldOption[];
  byNormal: RaidGoldOption[];
  totalSum: number;
  normalSum: number;
}

export function getGoldOptimizationInfo(
  character: Character,
  overrides?: GoldOverrides,
): GoldOptimizationInfo {
  // noGoldRaids를 무시하고 배정된 모든 레이드를 계산 대상으로 삼음
  // (현재 무골 설정에 관계없이 "어떤 3개에서 받을지" 최적화를 보여주는 것이 목적)
  const options: RaidGoldOption[] = character.assignedRaids.map((raidId) => {
    const withBonus = character.bonusRaids.includes(raidId);
    const bd = getRaidGoldBreakdown(raidId, withBonus, overrides);
    return {
      raidId,
      label: getRaid(raidId).label,
      bound: bd.bound,
      normal: bd.normal,
      total: bd.total,
    };
  });

  const byTotal = [...options]
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const byNormal = [...options]
    .filter((r) => r.normal > 0)
    .sort((a, b) => b.normal - a.normal)
    .slice(0, 3);

  return {
    byTotal,
    byNormal,
    totalSum: byTotal.reduce((n, r) => n + r.total, 0),
    normalSum: byNormal.reduce((n, r) => n + r.normal, 0),
  };
}

function buildRaidGoldOptions(
  character: Character,
  overrides?: GoldOverrides,
): RaidGoldOption[] {
  return character.assignedRaids.map((raidId) => {
    const withBonus = character.bonusRaids.includes(raidId);
    const bd = getRaidGoldBreakdown(raidId, withBonus, overrides);
    return {
      raidId,
      label: getRaid(raidId).label,
      bound: bd.bound,
      normal: bd.normal,
      total: bd.total,
    };
  });
}

/** 골드 수급 레이드를 고를 때 쓰는 유저 설정 묶음 */
export interface GoldPlan {
  priority: GoldPriority;
  /** 골드가 같을 때 먼저 고를 레이드 (앞에 있을수록 우선) */
  tiePreference: RaidId[];
}

export function userGoldPlan(user: User): GoldPlan {
  return {
    priority: user.goldPriority,
    tiePreference: user.goldTiePreference,
  };
}

/** 유통 골드 우선이어도 3칸을 비워둘 이유는 없으므로, 부족분은 총 골드로 채운다 */
function compareByPlan(plan: GoldPlan) {
  return (a: RaidGoldOption, b: RaidGoldOption): number => {
    if (plan.priority === "normal" && a.normal !== b.normal) {
      return b.normal - a.normal;
    }
    if (a.total !== b.total) return b.total - a.total;

    // 골드가 같으면 유저가 정한 선호 순서 → 그것도 없으면 가나다순
    const ai = plan.tiePreference.indexOf(a.raidId);
    const bi = plan.tiePreference.indexOf(b.raidId);
    if (ai !== bi) {
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
    return a.label.localeCompare(b.label, "ko");
  };
}

/** 정렬 기준이 완전히 같으면(= 어느 쪽을 골라도 무방) 같은 키 */
function tieKey(option: RaidGoldOption, priority: GoldPriority): string {
  return priority === "normal"
    ? `${option.normal}/${option.total}`
    : `${option.total}`;
}

/**
 * 유저 설정(골드 획득량 / 유통 골드) 기준으로 이 캐릭이 골드를 받아야 할 레이드 3개.
 *
 * 현재 무골 설정(noGoldRaids)은 무시한다 — "어디서 받아야 하는가"를 알려주는 것이
 * 목적이므로, 잘못 걸어둔 무골도 추천에 드러나야 한다.
 * 골드 합산에서 제외된 캐릭은 애초에 골드를 못 받으므로 빈 배열.
 */
export function getRecommendedGoldRaids(
  character: Character,
  plan: GoldPlan,
  overrides?: GoldOverrides,
): RaidGoldOption[] {
  if (!character.goldIncluded) return [];

  return buildRaidGoldOptions(character, overrides)
    .sort(compareByPlan(plan))
    .slice(0, MAX_GOLD_RAIDS_PER_CHARACTER);
}

export function getRecommendedGoldRaidIds(
  character: Character,
  plan: GoldPlan,
  overrides?: GoldOverrides,
): Set<RaidId> {
  return new Set(
    getRecommendedGoldRaids(character, plan, overrides).map((r) => r.raidId),
  );
}

/**
 * 골드가 완전히 같아서 3순위 자리를 가나다순으로 임의 결정한 레이드 묶음.
 * (예: 종막·노말과 세르카·노말은 16000/16000으로 동일)
 *
 * 추천 안쪽·바깥쪽에 걸쳐 있는 묶음만 반환한다 — 전부 추천에 들었다면 고를 게 없다.
 */
export function getGoldTieGroups(
  character: Character,
  plan: GoldPlan,
  overrides?: GoldOverrides,
): RaidGoldOption[][] {
  if (!character.goldIncluded) return [];

  const sorted = buildRaidGoldOptions(character, overrides).sort(
    compareByPlan(plan),
  );
  const pickedIds = new Set(
    sorted.slice(0, MAX_GOLD_RAIDS_PER_CHARACTER).map((o) => o.raidId),
  );

  const groups = new Map<string, RaidGoldOption[]>();
  for (const option of sorted) {
    const key = tieKey(option, plan.priority);
    const group = groups.get(key);
    if (group) group.push(option);
    else groups.set(key, [option]);
  }

  return [...groups.values()].filter(
    (group) =>
      group.length > 1 &&
      group.some((o) => pickedIds.has(o.raidId)) &&
      group.some((o) => !pickedIds.has(o.raidId)),
  );
}

/**
 * 골드 기준에 맞춰 무골 표시를 다시 계산한다.
 * 배정(assignedRaids)은 건드리지 않고, 추천 3개 밖의 레이드만 무골로 표시.
 * 골드 합산 제외 캐릭은 애초에 골드를 못 받으므로 기존 설정을 그대로 둔다.
 */
export function syncCharacterNoGoldRaids(
  character: Character,
  plan: GoldPlan,
  overrides?: GoldOverrides,
): RaidId[] {
  if (!character.goldIncluded) return character.noGoldRaids;

  const recommended = getRecommendedGoldRaidIds(character, plan, overrides);
  return character.assignedRaids.filter((raidId) => !recommended.has(raidId));
}

/**
 * 골드가 완전히 같은 레이드 묶음 (레이드 표 전체 기준, 캐릭터와 무관).
 * 지금은 세르카·노말과 종막·노말이 16000/16000으로 같다.
 * 설정 화면에서 "어느 쪽을 먼저 갈지" 고르게 하는 데 쓴다.
 */
export function getEqualGoldRaidGroups(
  overrides?: GoldOverrides,
): RaidGoldOption[][] {
  const groups = new Map<string, RaidGoldOption[]>();

  for (const raid of RAID_DEFINITIONS) {
    const bd = getRaidGoldBreakdown(raid.id, false, overrides);
    const key = `${bd.bound}/${bd.normal}`;
    const option: RaidGoldOption = {
      raidId: raid.id,
      label: raid.label,
      bound: bd.bound,
      normal: bd.normal,
      total: bd.total,
    };
    const group = groups.get(key);
    if (group) group.push(option);
    else groups.set(key, [option]);
  }

  return [...groups.values()].filter((group) => group.length > 1);
}

/** 동률 묶음에서 현재 설정상 먼저 선택되는 레이드 */
export function getTieWinner(
  group: RaidGoldOption[],
  plan: GoldPlan,
): RaidId | undefined {
  return [...group].sort(compareByPlan(plan))[0]?.raidId;
}

/** 동률 묶음 안에서 chosen을 1순위로 올린 선호 목록 */
export function withPreferredRaid(
  tiePreference: RaidId[],
  group: RaidGoldOption[],
  chosen: RaidId,
): RaidId[] {
  const groupIds = group.map((o) => o.raidId);
  const others = groupIds.filter((id) => id !== chosen);
  return [
    ...tiePreference.filter((id) => !groupIds.includes(id)),
    chosen,
    ...others,
  ];
}
