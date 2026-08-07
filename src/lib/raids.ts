/** 레이드 ID — 커스텀 레이드 지원을 위해 string으로 확장 */
export type RaidId = string;

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

export const DEFAULT_RAID_DEFINITIONS: RaidDefinition[] = [
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

/** 하위 호환 — 서버 사이드에서 기본값으로 사용 */
export const RAID_DEFINITIONS = DEFAULT_RAID_DEFINITIONS;

/** 하위 호환 */
export const RAID_GROUPS = ["세르카", "종막", "4막", "성심당"] as const;

/** raids 배열에서 고유한 그룹 목록을 순서대로 반환 */
export function getRaidGroups(raids: RaidDefinition[] = DEFAULT_RAID_DEFINITIONS): string[] {
  const seen = new Set<string>();
  const groups: string[] = [];
  for (const r of raids) {
    if (!seen.has(r.group)) {
      seen.add(r.group);
      groups.push(r.group);
    }
  }
  return groups;
}

/**
 * 레이드 ID로 정의를 찾는다.
 * raids → DEFAULT_RAID_DEFINITIONS 순으로 탐색하며,
 * 어디에도 없으면 빈 더미 정의를 반환 (throw 대신).
 */
export function getRaid(
  id: RaidId,
  raids: RaidDefinition[] = DEFAULT_RAID_DEFINITIONS,
): RaidDefinition {
  return (
    raids.find((r) => r.id === id) ??
    DEFAULT_RAID_DEFINITIONS.find((r) => r.id === id) ?? {
      id,
      group: "기타",
      difficulty: "",
      label: id,
      requiredLevel: 0,
      boundGold: 0,
      normalGold: 0,
      bonusCost: 0,
    }
  );
}

export function raidsByGroup(
  group: string,
  raids: RaidDefinition[] = DEFAULT_RAID_DEFINITIONS,
): RaidDefinition[] {
  return raids.filter((r) => r.group === group);
}
