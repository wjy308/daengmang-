import {
  type PartyMember,
  type PartyPlanResult,
  type RaidPartyPlan,
} from "@/lib/party-planner";

export interface RaidOverviewMember {
  userNickname: string;
  characterName: string;
  role: PartyMember["role"];
  takesGold: boolean;
}

export interface RaidOverviewItem {
  raidId: RaidPartyPlan["raidId"];
  raidLabel: string;
  fullPartyCount: number;
  fullParties: RaidOverviewMember[][];
  clearedOnly: boolean;
  pubGroups: RaidOverviewMember[][];
}

export interface RaidOverviewTotal {
  raidLabel: string;
  fullPartyCount: number;
}

export interface PartyOverviewData {
  raids: RaidOverviewItem[];
  totals: RaidOverviewTotal[];
  grandTotalParties: number;
}

function toOverviewMember(m: PartyMember): RaidOverviewMember {
  return {
    userNickname: m.userNickname,
    characterName: m.characterName,
    role: m.role,
    takesGold: m.takesGold,
  };
}

/** 잔여 인원을 서폿1+딜러들 조로 묶기 (인원 중복 없이) */
/** 인원 중복 없이 pool을 최대 size씩 묶기 */
function packWithoutDuplicateUsers(
  pool: PartyMember[],
  size: number,
): PartyMember[][] {
  const groups: PartyMember[][] = [];
  const remaining = [...pool];

  while (remaining.length > 0) {
    const group: PartyMember[] = [];
    const userIds = new Set<string>();
    let i = 0;
    while (i < remaining.length && group.length < size) {
      if (!userIds.has(remaining[i].userId)) {
        userIds.add(remaining[i].userId);
        group.push(remaining.splice(i, 1)[0]);
      } else {
        i++;
      }
    }
    if (group.length === 0) {
      // 전부 같은 유저라 더 이상 분리 불가 — 그냥 남은 것 추가
      for (let j = 0; j < remaining.length; j += size) {
        groups.push(remaining.splice(0, size));
      }
      break;
    }
    groups.push(group);
  }

  return groups;
}

function groupPubMembers(leftover: PartyMember[]): PartyMember[][] {
  if (leftover.length === 0) return [];

  const supports = leftover.filter((m) => m.role === "support");
  const dealers = leftover.filter((m) => m.role === "dealer");

  if (supports.length === 0) {
    return packWithoutDuplicateUsers(dealers, 3);
  }

  const groups: PartyMember[][] = supports.map((s) => [s]);
  const remaining = [...dealers];

  let changed = true;
  while (changed && remaining.length > 0) {
    changed = false;
    for (const group of groups) {
      if (group.filter((m) => m.role === "dealer").length >= 3) continue;
      const groupUserIds = new Set(group.map((m) => m.userId));
      const idx = remaining.findIndex((d) => !groupUserIds.has(d.userId));
      if (idx !== -1) {
        group.push(remaining.splice(idx, 1)[0]);
        changed = true;
      }
    }
  }

  // 서폿이 없거나 같은 유저라 못 넣은 딜러는 인원 중복 없이 별도 조로
  for (const g of packWithoutDuplicateUsers(remaining, 3)) {
    groups.push(g);
  }

  return groups.filter((g) => g.length > 0);
}

export function buildPartyOverview(result: PartyPlanResult): PartyOverviewData {
  const raids: RaidOverviewItem[] = result.raids
    .filter(
      (raid) =>
        raid.parties.length > 0 ||
        raid.leftover.length > 0 ||
        raid.unavailableReason === "클리어 완료",
    )
    .map((raid) => {
      if (raid.unavailableReason === "클리어 완료") {
        return {
          raidId: raid.raidId,
          raidLabel: raid.raidLabel,
          fullPartyCount: 0,
          fullParties: [],
          clearedOnly: true,
          pubGroups: [],
        };
      }

      return {
        raidId: raid.raidId,
        raidLabel: raid.raidLabel,
        fullPartyCount: raid.parties.length,
        fullParties: raid.parties.map((party) =>
          [...party.dealers, party.support].map(toOverviewMember),
        ),
        clearedOnly: false,
        pubGroups: groupPubMembers(raid.leftover).map((group) =>
          group.map(toOverviewMember),
        ),
      };
    });

  const totals = raids
    .filter((r) => !r.clearedOnly && r.fullPartyCount > 0)
    .map((r) => ({
      raidLabel: r.raidLabel,
      fullPartyCount: r.fullPartyCount,
    }));

  const grandTotalParties = totals.reduce((n, t) => n + t.fullPartyCount, 0);

  return { raids, totals, grandTotalParties };
}
