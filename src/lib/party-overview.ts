import {
  analyzeLeftoverParty,
  type PartyMember,
  type PartyPlanResult,
  type RaidPartyPlan,
} from "@/lib/party-planner";

export interface RaidOverviewMember {
  userNickname: string;
  characterName: string;
  role: PartyMember["role"];
}

export interface RaidOverviewItem {
  raidId: RaidPartyPlan["raidId"];
  raidLabel: string;
  fullPartyCount: number;
  fullParties: RaidOverviewMember[][];
  clearedOnly: boolean;
  leftover: RaidOverviewMember[];
  suggestedParties: RaidOverviewMember[][];
  partialParty: RaidOverviewMember[] | null;
  missingDealers: number;
  pubMembers: RaidOverviewMember[];
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
  };
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
          leftover: [],
          suggestedParties: [],
          partialParty: null,
          missingDealers: 0,
          pubMembers: [],
        };
      }

      const leftover = raid.leftover.map(toOverviewMember);
      const analysis = analyzeLeftoverParty(raid.raidId, raid.leftover);

      return {
        raidId: raid.raidId,
        raidLabel: raid.raidLabel,
        fullPartyCount: raid.parties.length,
        fullParties: raid.parties.map((party) =>
          [...party.dealers, party.support].map(toOverviewMember),
        ),
        clearedOnly: false,
        leftover,
        suggestedParties: analysis.suggestedParties.map((party) =>
          party.map(toOverviewMember),
        ),
        partialParty:
          analysis.partialParty?.map(toOverviewMember) ?? null,
        missingDealers: analysis.missingDealers,
        pubMembers: analysis.pubMembers.map(toOverviewMember),
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
