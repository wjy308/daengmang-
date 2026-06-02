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
  requiredLevel: number;
  boundGold: number;
  normalGold: number;
  bonusCost: number;
}

export const RAID_DEFINITIONS: RaidDefinition[] = [
  {
    id: "serca-hard",
    group: "세르카",
    difficulty: "하드",
    label: "세르카 · 하드",
    requiredLevel: 1730,
    boundGold: 0,
    normalGold: 44000,
    bonusCost: 14080,
  },
  {
    id: "serca-normal",
    group: "세르카",
    difficulty: "노말",
    label: "세르카 · 노말",
    requiredLevel: 1710,
    boundGold: 17500,
    normalGold: 17500,
    bonusCost: 11200,
  },
  {
    id: "end-normal",
    group: "종막",
    difficulty: "노말",
    label: "종막 · 노말",
    requiredLevel: 1710,
    boundGold: 20000,
    normalGold: 20000,
    bonusCost: 12800,
  },
  {
    id: "act4-hard",
    group: "4막",
    difficulty: "하드",
    label: "4막 · 하드",
    requiredLevel: 1720,
    boundGold: 0,
    normalGold: 42000,
    bonusCost: 13440,
  },
  {
    id: "act4-normal",
    group: "4막",
    difficulty: "노말",
    label: "4막 · 노말",
    requiredLevel: 1700,
    boundGold: 16500,
    normalGold: 16500,
    bonusCost: 10500,
  },
  {
    id: "sacred-3",
    group: "성심당",
    difficulty: "3단계",
    label: "성심당 · 3단계",
    requiredLevel: 1750,
    boundGold: 50000,
    normalGold: 0,
    bonusCost: 16000,
  },
  {
    id: "sacred-2",
    group: "성심당",
    difficulty: "2단계",
    label: "성심당 · 2단계",
    requiredLevel: 1720,
    boundGold: 40000,
    normalGold: 0,
    bonusCost: 12800,
  },
  {
    id: "sacred-1",
    group: "성심당",
    difficulty: "1단계",
    label: "성심당 · 1단계",
    requiredLevel: 1700,
    boundGold: 30000,
    normalGold: 0,
    bonusCost: 9600,
  },
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
