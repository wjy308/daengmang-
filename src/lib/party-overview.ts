import type { PartyPlanResult, RaidPartyPlan } from "@/lib/party-planner";

export interface RaidOverviewItem {
  raidId: RaidPartyPlan["raidId"];
  raidLabel: string;
  fullPartyCount: number;
  incompleteLine?: string;
  clearedOnly: boolean;
  unavailableReason?: string;
}

function formatMembers(
  members: RaidPartyPlan["leftover"],
): string {
  return members
    .map((m) => `${m.userNickname}(${m.characterName})`)
    .join(", ");
}

export function buildPartyOverview(result: PartyPlanResult): RaidOverviewItem[] {
  return result.raids
    .filter(
      (raid) =>
        raid.parties.length > 0 ||
        raid.leftover.length > 0 ||
        !!raid.unavailableReason,
    )
    .map((raid) => {
      if (raid.unavailableReason === "클리어 완료") {
        return {
          raidId: raid.raidId,
          raidLabel: raid.raidLabel,
          fullPartyCount: 0,
          clearedOnly: true,
        };
      }

      const incompleteLine =
        raid.leftover.length > 0
          ? `${raid.raidLabel} - ${formatMembers(raid.leftover)}`
          : undefined;

      return {
        raidId: raid.raidId,
        raidLabel: raid.raidLabel,
        fullPartyCount: raid.parties.length,
        incompleteLine,
        clearedOnly: false,
        unavailableReason:
          raid.parties.length === 0 ? raid.unavailableReason : undefined,
      };
    });
}
