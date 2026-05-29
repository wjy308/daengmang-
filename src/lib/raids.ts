export type RaidId =
  | "serca-hard"
  | "serca-normal"
  | "end-normal"
  | "act4-hard"
  | "act4-normal"
  | "sacred-3"
  | "sacred-2"
  | "sacred-1";

export interface RaidDefinition {
  id: RaidId;
  group: string;
  difficulty: string;
  label: string;
}

export const RAID_DEFINITIONS: RaidDefinition[] = [
  { id: "serca-hard", group: "세르카", difficulty: "하드", label: "세르카 · 하드" },
  { id: "serca-normal", group: "세르카", difficulty: "노말", label: "세르카 · 노말" },
  { id: "end-normal", group: "종막", difficulty: "노말", label: "종막 · 노말" },
  { id: "act4-hard", group: "4막", difficulty: "하드", label: "4막 · 하드" },
  { id: "act4-normal", group: "4막", difficulty: "노말", label: "4막 · 노말" },
  { id: "sacred-3", group: "성심당", difficulty: "3단계", label: "성심당 · 3단계" },
  { id: "sacred-2", group: "성심당", difficulty: "2단계", label: "성심당 · 2단계" },
  { id: "sacred-1", group: "성심당", difficulty: "1단계", label: "성심당 · 1단계" },
];

export const RAID_GROUPS = ["세르카", "종막", "4막", "성심당"] as const;

export function getRaid(id: RaidId): RaidDefinition {
  const raid = RAID_DEFINITIONS.find((r) => r.id === id);
  if (!raid) throw new Error(`Unknown raid: ${id}`);
  return raid;
}

export function raidsByGroup(group: string): RaidDefinition[] {
  return RAID_DEFINITIONS.filter((r) => r.group === group);
}
