"use client";

import { useState } from "react";
import {
  getPartyMembers,
  isPartyCleared,
  planParties,
  type Party,
  type PartyPlanResult,
} from "@/lib/party-planner";
import type { RaidId } from "@/lib/raids";
import type { User } from "@/lib/types";
import RoleBadge from "@/components/ui/RoleBadge";

function MemberPill({
  member,
  roleLabel,
  cleared,
}: {
  member: Party["dealers"][number];
  roleLabel: string;
  cleared?: boolean;
}) {
  return (
    <div
      className="min-w-0 flex-1 rounded-md border px-2 py-1.5 lg:px-1.5 lg:py-1"
      style={
        cleared
          ? {
              borderColor: "var(--success-border)",
              background: "var(--success-surface)",
            }
          : {
              borderColor: "var(--border)",
              background: "var(--card)",
            }
      }
    >
      <p className="text-[10px] text-muted lg:text-[9px]">{roleLabel}</p>
      <p className="truncate text-xs lg:text-[11px]">
        <span className="text-muted">{member.userNickname}</span>
        <span className="text-muted-subtle">/</span>
        {member.characterName}
        {cleared && (
          <span className="ml-0.5" style={{ color: "var(--success-text)" }}>
            ✓
          </span>
        )}
      </p>
      {!member.takesGold && (
        <p className="text-[9px] text-muted-subtle">무골</p>
      )}
    </div>
  );
}

function PartyCard({
  party,
  raidId,
  users,
  onMarkCleared,
  clearing,
}: {
  party: Party;
  raidId: RaidId;
  users: User[];
  onMarkCleared: () => void;
  clearing: boolean;
}) {
  const cleared = isPartyCleared(party, raidId, users);
  const members = getPartyMembers(party);

  const getCleared = (userId: string, characterId: string) =>
    users
      .find((u) => u.id === userId)
      ?.characters.find((c) => c.id === characterId)
      ?.clearedRaids.includes(raidId);

  return (
    <div
      className="rounded-lg border p-3 lg:p-2.5"
      style={
        cleared
          ? {
              borderColor: "var(--success-border)",
              background: "var(--success-surface)",
            }
          : {
              borderColor: "var(--border)",
              background: "var(--card)",
            }
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-accent-soft">
          파티 {party.index}
        </span>
        <span className="text-[10px] text-muted">
          {party.allTakeGold ? "전원 골드" : "일부 무골"}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 lg:flex-row lg:gap-1">
        {party.dealers.map((dealer) => (
          <MemberPill
            key={dealer.characterId}
            member={dealer}
            roleLabel="딜"
            cleared={getCleared(dealer.userId, dealer.characterId)}
          />
        ))}
        <MemberPill
          member={party.support}
          roleLabel="서폿"
          cleared={getCleared(party.support.userId, party.support.characterId)}
        />
      </div>

      <div className="mt-2 border-t border-border pt-2 lg:mt-1.5 lg:pt-1.5">
        {cleared ? (
          <p
            className="text-center text-xs font-medium"
            style={{ color: "var(--success-text)" }}
          >
            클리어 완료
          </p>
        ) : (
          <button
            type="button"
            onClick={onMarkCleared}
            disabled={clearing}
            className="w-full rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 lg:py-1 lg:text-[11px]"
            style={{
              borderColor: "var(--success-border)",
              background: "var(--success-surface)",
              color: "var(--success-text)",
            }}
          >
            {clearing ? "저장 중…" : "클리어 체크"}
          </button>
        )}
        <p className="mt-1 text-center text-[10px] text-muted-subtle lg:mt-0.5">
          {members.map((m) => m.userNickname).join(" · ")}
        </p>
      </div>
    </div>
  );
}

export default function PartyPlanner({
  users,
  onMarkPartyCleared,
}: {
  users: User[];
  onMarkPartyCleared: (
    raidId: RaidId,
    members: { userId: string; characterId: string }[],
  ) => void;
}) {
  const [result, setResult] = useState<PartyPlanResult | null>(null);
  const [clearingKey, setClearingKey] = useState<string | null>(null);

  const handlePlan = () => {
    setResult(planParties(users));
  };

  const handleMarkCleared = async (
    raidId: RaidId,
    party: Party,
    partyKey: string,
  ) => {
    setClearingKey(partyKey);
    try {
      onMarkPartyCleared(
        raidId,
        getPartyMembers(party).map((m) => ({
          userId: m.userId,
          characterId: m.characterId,
        })),
      );
    } finally {
      setClearingKey(null);
    }
  };

  const hasCharacters = users.some((u) => u.characters.length > 0);

  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface-muted p-4 lg:p-3">
      <div>
        <h3 className="text-sm font-semibold lg:text-xs">파티 추천</h3>
        <p className="mt-0.5 text-xs text-muted">
          딜3+서폿1 · 인원 중복 없음 · 클리어 제외 · 무골 후순위
        </p>
      </div>

      <button
        type="button"
        onClick={handlePlan}
        disabled={!hasCharacters}
        className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 lg:py-2.5 lg:text-xs"
      >
        그래서 이제 뭐 함?
      </button>

      {!hasCharacters && (
        <p className="text-xs text-muted">캐릭터 등록 후 사용</p>
      )}

      {result && (
        <div id="party-result" className="space-y-4 border-t border-border pt-3">
          <p className="text-xs text-muted">
            {result.summary.totalParties}파티 · 캐릭{" "}
            {result.summary.totalCharacters}명
          </p>

          {result.raids.every(
            (r) => r.parties.length === 0 && r.leftover.length === 0,
          ) ? (
            <p className="text-xs text-accent-soft">배정된 레이드가 없어요.</p>
          ) : (
            <div className="space-y-4">
              {result.raids.map((raid) => (
                <div key={raid.raidId} className="space-y-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h4 className="text-sm font-medium lg:text-xs">
                      {raid.raidLabel}
                    </h4>
                    {raid.parties.length > 0 && (
                      <span className="text-[10px] text-accent-soft">
                        {raid.parties.length}파티
                      </span>
                    )}
                    {raid.unavailableReason && raid.parties.length === 0 && (
                      <span className="text-[10px] text-accent-soft">
                        {raid.unavailableReason}
                      </span>
                    )}
                  </div>

                  {raid.parties.length > 0 && (
                    <div className="space-y-2">
                      {raid.parties.map((party) => {
                        const partyKey = `${raid.raidId}-${party.index}`;
                        return (
                          <PartyCard
                            key={partyKey}
                            party={party}
                            raidId={raid.raidId}
                            users={users}
                            clearing={clearingKey === partyKey}
                            onMarkCleared={() =>
                              void handleMarkCleared(
                                raid.raidId,
                                party,
                                partyKey,
                              )
                            }
                          />
                        );
                      })}
                    </div>
                  )}

                  {raid.leftover.length > 0 && (
                    <div className="rounded-lg border border-dashed border-dashed-border px-2 py-1.5">
                      <p className="text-[10px] text-muted">잔여</p>
                      <ul className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                        {raid.leftover.map((m) => (
                          <li key={m.characterId} className="text-[11px]">
                            <RoleBadge role={m.role} />
                            <span className="ml-0.5 text-muted">
                              {m.userNickname}/{m.characterName}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.unassignedCharacters.length > 0 && (
            <div className="border-t border-border pt-2">
              <p className="text-[10px] font-semibold text-muted">미배정</p>
              <ul className="mt-1 flex flex-wrap gap-1">
                {result.unassignedCharacters.map((m) => (
                  <li
                    key={m.characterId}
                    className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px]"
                  >
                    {m.userNickname}/{m.characterName}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
