import type { RaidId } from "@/lib/raids";
import type { Character, CharacterRole, User } from "@/lib/types";

export function migrateCharacter(raw: Record<string, unknown>): Character {
  const role: CharacterRole = raw.role === "support" ? "support" : "dealer";
  return {
    id: String(raw.id),
    name: String(raw.name),
    role,
    goldIncluded: typeof raw.goldIncluded === "boolean" ? raw.goldIncluded : false,
    assignedRaids: Array.isArray(raw.assignedRaids)
      ? (raw.assignedRaids as RaidId[])
      : [],
    noGoldRaids: Array.isArray(raw.noGoldRaids)
      ? (raw.noGoldRaids as RaidId[])
      : [],
    bonusRaids: Array.isArray(raw.bonusRaids)
      ? (raw.bonusRaids as RaidId[])
      : [],
    clearedRaids: Array.isArray(raw.clearedRaids)
      ? (raw.clearedRaids as RaidId[])
      : [],
  };
}

export function migrateUser(raw: Record<string, unknown>): User {
  const rawCharacters = Array.isArray(raw.characters)
    ? (raw.characters as Record<string, unknown>[])
    : [];
  let includedCount = 0;
  const characters = rawCharacters.map((item) => {
    const character = migrateCharacter(item);
    const hasGoldIncluded = typeof item.goldIncluded === "boolean";

    if (hasGoldIncluded && character.goldIncluded) {
      if (includedCount < 6) {
        includedCount += 1;
        return character;
      }
      return { ...character, goldIncluded: false };
    }

    if (hasGoldIncluded && !character.goldIncluded) {
      return character;
    }

    const include = includedCount < 6; // legacy data without goldIncluded
    if (include) includedCount += 1;
    return { ...character, goldIncluded: include };
  });
  return {
    id: String(raw.id),
    nickname: String(raw.nickname),
    characters,
  };
}

export function migrateUsers(raw: unknown): User[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((u) => migrateUser(u as Record<string, unknown>));
}
