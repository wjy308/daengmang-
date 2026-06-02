import { getRaid, RAID_DEFINITIONS, type RaidId } from "./raids";
import { buildRoster, type RosterEntry } from "./roster";
import type { CharacterRole, User } from "./types";

export interface PartyMember {
  userId: string;
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
    userId: entry.userId,
    characterId: entry.character.id,
    characterName: entry.character.name,
    userNickname: entry.userNickname,
    role: entry.character.role,
    takesGold: !entry.character.noGoldRaids.includes(raidId),
  };
}

function isNoGold(entry: RosterEntry, raidId: RaidId): boolean {
  return entry.character.noGoldRaids.includes(raidId);
}

/** 무골 캐릭은 파티 구성 시 가장 나중에 선택 */
function sortPool(entries: RosterEntry[], raidId: RaidId): RosterEntry[] {
  return [...entries].sort((a, b) => {
    const aNoGold = isNoGold(a, raidId);
    const bNoGold = isNoGold(b, raidId);
    if (aNoGold !== bNoGold) return aNoGold ? 1 : -1;
    return a.character.name.localeCompare(b.character.name, "ko");
  });
}

function tryFormParty(
  raidId: RaidId,
  dealerPool: RosterEntry[],
  supportPool: RosterEntry[],
): {
  party: Party;
  usedCharacterIds: Set<string>;
} | null {
  for (let si = 0; si < supportPool.length; si++) {
    const supportEntry = supportPool[si];
    const partyUserIds = new Set([supportEntry.userId]);
    const selectedDealers: RosterEntry[] = [];

    for (const dealerEntry of dealerPool) {
      if (partyUserIds.has(dealerEntry.userId)) continue;
      selectedDealers.push(dealerEntry);
      partyUserIds.add(dealerEntry.userId);
      if (selectedDealers.length === 3) break;
    }

    if (selectedDealers.length < 3) continue;

    const dealers = selectedDealers.map((e) =>
      toMember(e, raidId),
    ) as [PartyMember, PartyMember, PartyMember];
    const support = toMember(supportEntry, raidId);

    return {
      party: {
        index: 0,
        dealers,
        support,
        allTakeGold:
          dealers.every((d) => d.takesGold) && support.takesGold,
      },
      usedCharacterIds: new Set([
        ...selectedDealers.map((e) => e.character.id),
        supportEntry.character.id,
      ]),
    };
  }

  return null;
}

function formParties(
  raidId: RaidId,
  pool: RosterEntry[],
): Pick<RaidPartyPlan, "parties" | "leftover" | "unavailableReason"> {
  let dealerPool = sortPool(
    pool.filter((e) => e.character.role === "dealer"),
    raidId,
  );
  let supportPool = sortPool(
    pool.filter((e) => e.character.role === "support"),
    raidId,
  );

  const parties: Party[] = [];

  while (true) {
    const formed = tryFormParty(raidId, dealerPool, supportPool);
    if (!formed) break;

    formed.party.index = parties.length + 1;
    parties.push(formed.party);

    dealerPool = dealerPool.filter(
      (e) => !formed.usedCharacterIds.has(e.character.id),
    );
    supportPool = supportPool.filter(
      (e) => !formed.usedCharacterIds.has(e.character.id),
    );
  }

  const leftover = [...dealerPool, ...supportPool].map((e) =>
    toMember(e, raidId),
  );

  if (parties.length === 0 && pool.length > 0) {
    let unavailableReason: string | undefined;
    if (supportPool.length === 0) {
      unavailableReason = "서폿 1명 이상 필요 (딜3+서폿1, 인원 중복 불가)";
    } else if (dealerPool.length < 3) {
      unavailableReason = "딜러 3명 이상 필요 (딜3+서폿1, 인원 중복 불가)";
    } else {
      unavailableReason =
        "서로 다른 인원 4명으로 파티를 만들 수 없어요 (같은 인원 2캐릭 불가)";
    }
    return { parties, leftover, unavailableReason };
  }

  return { parties, leftover };
}

/** 캐릭터·인원 중복 없이 레이드별 딜3+서폿1 파티를 최대한 구성 (레이드마다 독립) */
export function planParties(users: User[]): PartyPlanResult {
  const roster = buildRoster(users);

  const raidIds = RAID_DEFINITIONS.map((r) => r.id).filter((raidId) =>
    roster.some((e) => e.character.assignedRaids.includes(raidId)),
  );

  const raids: RaidPartyPlan[] = [];
  const assignedCharacterIds = new Set<string>();

  for (const raidId of raidIds) {
    const assigned = roster.filter((e) =>
      e.character.assignedRaids.includes(raidId),
    );
    const available = assigned.filter(
      (e) => !e.character.clearedRaids.includes(raidId),
    );

    if (available.length === 0 && assigned.length > 0) {
      raids.push({
        raidId,
        raidLabel: getRaid(raidId).label,
        parties: [],
        leftover: [],
        unavailableReason: "클리어 완료",
      });
      continue;
    }

    const { parties, leftover, unavailableReason } = formParties(
      raidId,
      available,
    );

    for (const party of parties) {
      for (const m of [...party.dealers, party.support]) {
        assignedCharacterIds.add(m.characterId);
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
    .filter((e) => !assignedCharacterIds.has(e.character.id))
    .map((e) => ({
      userId: e.userId,
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

export function isPartyCleared(
  party: Party,
  raidId: RaidId,
  users: User[],
): boolean {
  const members = [...party.dealers, party.support];
  return members.every((member) => {
    const user = users.find((u) => u.id === member.userId);
    const character = user?.characters.find(
      (c) => c.id === member.characterId,
    );
    return character?.clearedRaids.includes(raidId) ?? false;
  });
}

export function getPartyMembers(party: Party): PartyMember[] {
  return [...party.dealers, party.support];
}

function entriesFromMembers(
  members: PartyMember[],
  raidId: RaidId,
): RosterEntry[] {
  return members.map((m) => ({
    userId: m.userId,
    userNickname: m.userNickname,
    character: {
      id: m.characterId,
      name: m.characterName,
      role: m.role,
      goldIncluded: true,
      assignedRaids: [raidId],
      noGoldRaids: m.takesGold ? [] : [raidId],
      bonusRaids: [],
      clearedRaids: [],
    },
  }));
}

function isCompleteParty(members: PartyMember[]): boolean {
  const dealers = members.filter((m) => m.role === "dealer");
  const supports = members.filter((m) => m.role === "support");
  if (dealers.length !== 3 || supports.length !== 1) return false;
  return new Set(members.map((m) => m.userId)).size === 4;
}

/** 완성 파티는 못 만들지만, 인원 중복 없이 최대한 묶은 잔여 조합 */
function tryFormBestPartialParty(
  raidId: RaidId,
  dealerPool: RosterEntry[],
  supportPool: RosterEntry[],
): {
  members: PartyMember[];
  usedCharacterIds: Set<string>;
} | null {
  let best: {
    members: PartyMember[];
    usedCharacterIds: Set<string>;
  } | null = null;

  const consider = (members: PartyMember[], usedCharacterIds: Set<string>) => {
    if (members.length < 2) return;
    if (!best || members.length > best.members.length) {
      best = { members, usedCharacterIds };
    }
  };

  for (const supportEntry of supportPool) {
    const partyUserIds = new Set([supportEntry.userId]);
    const selectedDealers: RosterEntry[] = [];

    for (const dealerEntry of dealerPool) {
      if (partyUserIds.has(dealerEntry.userId)) continue;
      selectedDealers.push(dealerEntry);
      partyUserIds.add(dealerEntry.userId);
      if (selectedDealers.length === 3) break;
    }

    const dealers = selectedDealers.map((e) => toMember(e, raidId));
    const support = toMember(supportEntry, raidId);
    consider([...dealers, support], new Set([
      ...selectedDealers.map((e) => e.character.id),
      supportEntry.character.id,
    ]));
  }

  if (supportPool.length === 0) {
    const partyUserIds = new Set<string>();
    const selectedDealers: RosterEntry[] = [];
    for (const dealerEntry of dealerPool) {
      if (partyUserIds.has(dealerEntry.userId)) continue;
      selectedDealers.push(dealerEntry);
      partyUserIds.add(dealerEntry.userId);
      if (selectedDealers.length === 3) break;
    }
    if (selectedDealers.length > 0) {
      consider(
        selectedDealers.map((e) => toMember(e, raidId)),
        new Set(selectedDealers.map((e) => e.character.id)),
      );
    }
  }

  return best;
}

export interface LeftoverPartyAnalysis {
  /** 잔여로 만들 수 있는 완성 파티(딜3+서폿1) */
  suggestedParties: PartyMember[][];
  /** 완성은 안 되지만 인원별 1캐릭씩 묶은 조합 */
  partialParty: PartyMember[] | null;
  /** partialParty에 부족한 딜러 수 */
  missingDealers: number;
  /** 파티에 못 넣어 공팟이 필요한 캐릭 (같은 인원 2캐릭 중 남는 쪽 등) */
  pubMembers: PartyMember[];
}

/** 잔여 인원으로 추가 파티 · 공팟 후보 분류 */
export function analyzeLeftoverParty(
  raidId: RaidId,
  leftover: PartyMember[],
): LeftoverPartyAnalysis {
  if (leftover.length === 0) {
    return {
      suggestedParties: [],
      partialParty: null,
      missingDealers: 0,
      pubMembers: [],
    };
  }

  let remaining = [...leftover];
  const suggestedParties: PartyMember[][] = [];

  while (remaining.length > 0) {
    const entries = entriesFromMembers(remaining, raidId);
    const dealerPool = sortPool(
      entries.filter((e) => e.character.role === "dealer"),
      raidId,
    );
    const supportPool = sortPool(
      entries.filter((e) => e.character.role === "support"),
      raidId,
    );
    const formed = tryFormParty(raidId, dealerPool, supportPool);
    if (!formed) break;

    suggestedParties.push([...formed.party.dealers, formed.party.support]);
    remaining = remaining.filter(
      (m) => !formed.usedCharacterIds.has(m.characterId),
    );
  }

  if (remaining.length === 0) {
    return {
      suggestedParties,
      partialParty: null,
      missingDealers: 0,
      pubMembers: [],
    };
  }

  if (remaining.length === 1) {
    return {
      suggestedParties,
      partialParty: null,
      missingDealers: 0,
      pubMembers: remaining,
    };
  }

  const entries = entriesFromMembers(remaining, raidId);
  const dealerPool = sortPool(
    entries.filter((e) => e.character.role === "dealer"),
    raidId,
  );
  const supportPool = sortPool(
    entries.filter((e) => e.character.role === "support"),
    raidId,
  );
  const partial = tryFormBestPartialParty(raidId, dealerPool, supportPool);

  if (!partial) {
    return {
      suggestedParties,
      partialParty: null,
      missingDealers: 0,
      pubMembers: remaining,
    };
  }

  if (isCompleteParty(partial.members)) {
    suggestedParties.push(partial.members);
    return {
      suggestedParties,
      partialParty: null,
      missingDealers: 0,
      pubMembers: remaining.filter(
        (m) => !partial.usedCharacterIds.has(m.characterId),
      ),
    };
  }

  const dealerCount = partial.members.filter((m) => m.role === "dealer").length;
  const missingDealers = Math.max(0, 3 - dealerCount);
  const pubMembers = remaining.filter(
    (m) => !partial.usedCharacterIds.has(m.characterId),
  );

  return {
    suggestedParties,
    partialParty: partial.members,
    missingDealers,
    pubMembers,
  };
}
