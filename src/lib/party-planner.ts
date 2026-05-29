import { getRaid, RAID_DEFINITIONS, type RaidId } from "./raids";
import { buildRoster, type RosterEntry } from "./roster";
import type { CharacterRole, User } from "./types";

export interface PartyMember {
  characterId: string;
  characterName: string;
  userNickname: string;
  role: CharacterRole;
  takesGold: boolean;
}

export interface Party {
  index: number;
  dealers: [PartyMember, PartyMember, PartyMember];
  support: PartyMember;
  allTakeGold: boolean;
}

export interface RaidPartyPlan {
  raidId: RaidId;
  raidLabel: string;
  parties: Party[];
  leftover: PartyMember[];
  unavailableReason?: string;
}

export interface PartyPlanResult {
  raids: RaidPartyPlan[];
  unassignedCharacters: PartyMember[];
  summary: {
    totalParties: number;
    totalCharacters: number;
  };
}

function toMember(entry: RosterEntry, raidId: RaidId): PartyMember {
  return {
    characterId: entry.character.id,
    characterName: entry.character.name,
    userNickname: entry.userNickname,
    role: entry.character.role,
    takesGold: !entry.character.noGoldRaids.includes(raidId),
  };
}

function sortPool(entries: RosterEntry[], raidId: RaidId): RosterEntry[] {
  return [...entries].sort((a, b) => {
    const aGold = !a.character.noGoldRaids.includes(raidId);
    const bGold = !b.character.noGoldRaids.includes(raidId);
    if (aGold !== bGold) return aGold ? -1 : 1;
    return a.character.name.localeCompare(b.character.name, "ko");
  });
}

function formParties(
  raidId: RaidId,
  pool: RosterEntry[],
): Pick<RaidPartyPlan, "parties" | "leftover" | "unavailableReason"> {
  const dealers = sortPool(
    pool.filter((e) => e.character.role === "dealer"),
    raidId,
  );
  const supports = sortPool(
    pool.filter((e) => e.character.role === "support"),
    raidId,
  );

  const maxParties = Math.min(Math.floor(dealers.length / 3), supports.length);

  if (maxParties === 0) {
    const leftover = [...dealers, ...supports].map((e) => toMember(e, raidId));
    let unavailableReason: string | undefined;
    if (pool.length === 0) {
      unavailableReason = undefined;
    } else if (supports.length === 0) {
      unavailableReason = "서폿 1명 이상 필요 (딜3+서폿1)";
    } else if (dealers.length < 3) {
      unavailableReason = "딜러 3명 이상 필요 (딜3+서폿1)";
    }
    return { parties: [], leftover, unavailableReason };
  }

  const parties: Party[] = [];
  let dealerIdx = 0;
  let supportIdx = 0;

  for (let i = 0; i < maxParties; i++) {
    const partyDealers = dealers
      .slice(dealerIdx, dealerIdx + 3)
      .map((e) => toMember(e, raidId)) as [PartyMember, PartyMember, PartyMember];
    const support = toMember(supports[supportIdx], raidId);
    dealerIdx += 3;
    supportIdx += 1;

    parties.push({
      index: i + 1,
      dealers: partyDealers,
      support,
      allTakeGold:
        partyDealers.every((d) => d.takesGold) && support.takesGold,
    });
  }

  const leftover = [
    ...dealers.slice(dealerIdx),
    ...supports.slice(supportIdx),
  ].map((e) => toMember(e, raidId));

  return { parties, leftover };
}

function raidPriority(raidId: RaidId, roster: RosterEntry[]): number {
  const eligible = roster.filter((e) =>
    e.character.assignedRaids.includes(raidId),
  );
  const goldCount = eligible.filter(
    (e) => !e.character.noGoldRaids.includes(raidId),
  ).length;
  const idx = RAID_DEFINITIONS.findIndex((r) => r.id === raidId);
  return goldCount * 100 - idx;
}

/** 캐릭터 중복 없이 레이드별 딜3+서폿1 파티를 최대한 구성 */
export function planParties(users: User[]): PartyPlanResult {
  const roster = buildRoster(users);
  const usedIds = new Set<string>();

  const raidIds = RAID_DEFINITIONS.map((r) => r.id)
    .filter((raidId) =>
      roster.some((e) => e.character.assignedRaids.includes(raidId)),
    )
    .sort((a, b) => raidPriority(b, roster) - raidPriority(a, roster));

  const raids: RaidPartyPlan[] = [];

  for (const raidId of raidIds) {
    const available = roster.filter(
      (e) =>
        e.character.assignedRaids.includes(raidId) &&
        !usedIds.has(e.character.id),
    );

    const { parties, leftover, unavailableReason } = formParties(
      raidId,
      available,
    );

    for (const party of parties) {
      for (const m of [...party.dealers, party.support]) {
        usedIds.add(m.characterId);
      }
    }

    raids.push({
      raidId,
      raidLabel: getRaid(raidId).label,
      parties,
      leftover,
      unavailableReason,
    });
  }

  const unassignedCharacters = roster
    .filter((e) => !usedIds.has(e.character.id))
    .map((e) => ({
      characterId: e.character.id,
      characterName: e.character.name,
      userNickname: e.userNickname,
      role: e.character.role,
      takesGold: false,
    }));

  const totalParties = raids.reduce((n, r) => n + r.parties.length, 0);

  return {
    raids,
    unassignedCharacters,
    summary: {
      totalParties,
      totalCharacters: roster.length,
    },
  };
}
