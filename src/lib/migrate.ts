import type { RaidId } from "@/lib/raids";
import type { Character, CharacterRole, User } from "@/lib/types";

export function migrateCharacter(raw: Record<string, unknown>): Character {
  const role: CharacterRole = raw.role === "support" ? "support" : "dealer";
  return {
    id: String(raw.id),
    name: String(raw.name),
    role,
    assignedRaids: Array.isArray(raw.assignedRaids)
      ? (raw.assignedRaids as RaidId[])
      : [],
    noGoldRaids: Array.isArray(raw.noGoldRaids)
      ? (raw.noGoldRaids as RaidId[])
      : [],
    clearedRaids: Array.isArray(raw.clearedRaids)
      ? (raw.clearedRaids as RaidId[])
      : [],
  };
}

export function migrateUser(raw: Record<string, unknown>): User {
  const characters = Array.isArray(raw.characters)
    ? raw.characters.map((c) =>
        migrateCharacter(c as Record<string, unknown>),
      )
    : [];
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
