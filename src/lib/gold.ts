import { getRaid, type RaidId } from "./raids";
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
): GoldBreakdown {
  const raid = getRaid(raidId);
  const baseBound = raid.boundGold;
  const baseNormal = raid.normalGold;

  if (!withBonus) {
    return {
      bound: baseBound,
      normal: baseNormal,
      total: baseBound + baseNormal,
    };
  }

  const afterBonus = applyBonusCost(baseBound, baseNormal, raid.bonusCost);
  return {
    bound: afterBonus.bound,
    normal: afterBonus.normal,
    total: afterBonus.bound + afterBonus.normal,
  };
}

export function getCharacterWeeklyGold(character: Character): GoldBreakdown {
  let bound = 0;
  let normal = 0;

  for (const raidId of character.clearedRaids) {
    if (character.noGoldRaids.includes(raidId)) {
      continue;
    }
    const withBonus = character.bonusRaids.includes(raidId);
    const raidGold = getRaidGoldBreakdown(raidId, withBonus);
    bound += raidGold.bound;
    normal += raidGold.normal;
  }

  return {
    bound,
    normal,
    total: bound + normal,
  };
}

export function getUserWeeklyGold(user: User): GoldBreakdown {
  return user.characters.reduce<GoldBreakdown>(
    (acc, character) => {
      if (!character.goldIncluded) return acc;
      const next = getCharacterWeeklyGold(character);
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

function getCharacterMaxWeeklyGold(character: Character): GoldBreakdown {
  return character.assignedRaids.reduce<GoldBreakdown>((acc, raidId) => {
    if (character.noGoldRaids.includes(raidId)) return acc;
    const withBonus = character.bonusRaids.includes(raidId);
    const next = getRaidGoldBreakdown(raidId, withBonus);
    return sumBreakdown(acc, next);
  }, { bound: 0, normal: 0, total: 0 });
}

export function getCharacterGoldProgress(character: Character): GoldProgress {
  return {
    current: getCharacterWeeklyGold(character),
    max: getCharacterMaxWeeklyGold(character),
  };
}

export function getUserGoldProgress(user: User): GoldProgress {
  return user.characters.reduce<GoldProgress>(
    (acc, character) => {
      if (!character.goldIncluded) return acc;
      const next = getCharacterGoldProgress(character);
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
