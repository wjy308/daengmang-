import type { RaidId } from "@/lib/raids";
import type { AmajdaItem, Character, CharacterRole, User } from "@/lib/types";

function migrateAmajdaItems(raw: unknown): AmajdaItem[] {
  if (!Array.isArray(raw)) return [];
  const items: AmajdaItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const label = String(record.label ?? "").trim();
    if (!label) continue;
    const period =
      typeof record.period === "string" && record.period.trim()
        ? record.period.trim()
        : undefined;
    items.push({
      id: String(record.id),
      label,
      period,
    });
  }
  return items;
}

function migrateAmajdaChecked(raw: unknown, itemIds: Set<string>): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((id) => String(id))
    .filter((id) => itemIds.has(id));
}

export function migrateCharacter(raw: Record<string, unknown>): Character {
  const role: CharacterRole = raw.role === "support" ? "support" : "dealer";
  const amajdaItems = migrateAmajdaItems(raw.amajdaItems);
  const amajdaItemIds = new Set(amajdaItems.map((item) => item.id));
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
    amajdaItems,
    amajdaChecked: migrateAmajdaChecked(raw.amajdaChecked, amajdaItemIds),
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
  const amajdaItems = migrateAmajdaItems(raw.amajdaItems);
  const amajdaItemIds = new Set(amajdaItems.map((item) => item.id));
  return {
    id: String(raw.id),
    nickname: String(raw.nickname),
    characters,
    amajdaItems,
    amajdaChecked: migrateAmajdaChecked(raw.amajdaChecked, amajdaItemIds),
  };
}

export function migrateUsers(raw: unknown): User[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((u) => migrateUser(u as Record<string, unknown>));
}
