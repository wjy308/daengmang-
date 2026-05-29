"use client";

import { useState } from "react";
import { planParties, type Party, type PartyPlanResult } from "@/lib/party-planner";
import type { User } from "@/lib/types";
import RoleBadge from "@/components/ui/RoleBadge";

function MemberLine({ member }: { member: Party["dealers"][number] }) {
  return (
    <span className="text-sm">
      <span className="text-muted">{member.userNickname}</span>
      <span className="text-stone-600"> / </span>
      <span>{member.characterName}</span>
      {!member.takesGold && (
        <span className="ml-1 text-xs text-stone-500">무골</span>
      )}
    </span>
  );
}

function PartyCard({ party }: { party: Party }) {
  return (
    <div className="rounded-lg border border-stone-800 bg-stone-950/80 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-accent-soft">
          파티 {party.index}
        </span>
        <span className="text-[10px] text-muted">
          {party.allTakeGold ? "전원 골드" : "일부 무골"}
        </span>
      </div>
      <ul className="space-y-1.5">
        <li>
          <span className="mr-2 text-xs text-rose-300">딜</span>
          <div className="mt-0.5 space-y-0.5">
            {party.dealers.map((d) => (
              <div key={d.characterId}>
                <MemberLine member={d} />
              </div>
            ))}
          </div>
        </li>
        <li>
          <span className="mr-2 text-xs text-sky-300">서폿</span>
          <MemberLine member={party.support} />
        </li>
      </ul>
    </div>
  );
}

export default function PartyPlanner({ users }: { users: User[] }) {
  const [result, setResult] = useState<PartyPlanResult | null>(null);

  const handlePlan = () => {
    setResult(planParties(users));
    requestAnimationFrame(() => {
      document
        .getElementById("party-result")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const hasCharacters = users.some((u) => u.characters.length > 0);

  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={handlePlan}
        disabled={!hasCharacters}
        className="w-full rounded-xl bg-accent px-4 py-3.5 text-base font-semibold text-stone-950 transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-8"
      >
        그래서 이제 뭐 감?
      </button>

      {!hasCharacters && (
        <p className="text-sm text-muted">
          캐릭터를 등록한 뒤 눌러 주세요. (딜3 + 서폿1 자동 조합)
        </p>
      )}

      {result && (
        <div id="party-result" className="space-y-6 rounded-xl border border-stone-800 bg-stone-900/40 p-5">
          <div>
            <h3 className="font-semibold">파티 추천</h3>
            <p className="mt-1 text-sm text-muted">
              총 {result.summary.totalParties}파티 · 캐릭{" "}
              {result.summary.totalCharacters}명 기준 (캐릭당 주간 1레이드 가정,
              중복 배정 없음)
            </p>
          </div>

          {result.raids.every(
            (r) => r.parties.length === 0 && r.leftover.length === 0,
          ) ? (
            <p className="text-sm text-amber-600/90">
              배정된 레이드가 없어요. 캐릭터마다 레이드를 선택해 주세요.
            </p>
          ) : (
            <div className="space-y-5">
              {result.raids.map((raid) => (
                <div key={raid.raidId} className="space-y-3">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h4 className="font-medium">{raid.raidLabel}</h4>
                    {raid.parties.length > 0 && (
                      <span className="text-xs text-accent-soft">
                        {raid.parties.length}파티 가능
                      </span>
                    )}
                    {raid.unavailableReason && raid.parties.length === 0 && (
                      <span className="text-xs text-amber-600/90">
                        {raid.unavailableReason}
                      </span>
                    )}
                  </div>

                  {raid.parties.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {raid.parties.map((party) => (
                        <PartyCard key={party.index} party={party} />
                      ))}
                    </div>
                  )}

                  {raid.leftover.length > 0 && (
                    <div className="rounded-lg border border-dashed border-stone-700 px-3 py-2">
                      <p className="text-xs text-muted">이 레이드 잔여 인원</p>
                      <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        {raid.leftover.map((m) => (
                          <li key={m.characterId} className="text-sm">
                            <RoleBadge role={m.role} />
                            <span className="ml-1 text-muted">
                              {m.userNickname}
                            </span>
                            /{m.characterName}
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
            <div className="border-t border-stone-800 pt-4">
              <p className="text-xs font-semibold text-muted">
                파티에 안 들어간 캐릭
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {result.unassignedCharacters.map((m) => (
                  <li
                    key={m.characterId}
                    className="rounded-md border border-stone-800 px-2 py-1 text-sm"
                  >
                    <RoleBadge role={m.role} />
                    <span className="ml-1">
                      {m.userNickname}/{m.characterName}
                    </span>
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
