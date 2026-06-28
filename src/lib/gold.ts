import { getRaid, type RaidId } from "./raids";
import type { GoldOverrides } from "./gold-overrides";
import type { Character, User } from "./types";

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
  const eligible = character.assignedRaids.filter(
    (r) => !character.noGoldRaids.includes(r),
  );

  const options: RaidGoldOption[] = eligible.map((raidId) => {
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
