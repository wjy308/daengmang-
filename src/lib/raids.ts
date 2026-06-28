export type RaidId =
  | "serca-hard"
  | "serca-normal"
  | "end-hard"
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
  soloRaid?: boolean;
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
    boundGold: 16000,
    normalGold: 16000,
    bonusCost: 10240,
  },
  {
    id: "end-hard",
    group: "종막",
    difficulty: "하드",
    label: "종막 · 하드",
    requiredLevel: 1720,
    boundGold: 0,
    normalGold: 48000,
    bonusCost: 15360,
  },
  {
    id: "end-normal",
    group: "종막",
    difficulty: "노말",
    label: "종막 · 노말",
    requiredLevel: 1710,
    boundGold: 16000,
    normalGold: 16000,
    bonusCost: 10240,
    soloRaid: true,
  },
  {
    id: "act4-hard",
    group: "4막",
    difficulty: "하드",
    label: "4막 · 하드",
    requiredLevel: 1720,
    boundGold: 0,
    normalGold: 38000,
    bonusCost: 12160,
  },
  {
    id: "act4-normal",
    group: "4막",
    difficulty: "노말",
    label: "4막 · 노말",
    requiredLevel: 1700,
    boundGold: 13500,
    normalGold: 13500,
    bonusCost: 8640,
    soloRaid: true,
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
