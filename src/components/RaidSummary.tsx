"use client";

import type {
  PartyOverviewData,
  RaidOverviewMember,
} from "@/lib/party-overview";
import RoleBadge from "@/components/ui/RoleBadge";

function MemberRow({ member }: { member: RaidOverviewMember }) {
  return (
    <li className="flex items-start gap-2 rounded-md bg-card/60 px-2 py-1.5">
      <RoleBadge role={member.role} />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-xs font-semibold text-foreground">
          {member.userNickname}
        </p>
        <p className="truncate text-[11px] text-muted">{member.characterName}</p>
      </div>
    </li>
  );
}

function SuggestedPartyBlock({ members }: { members: RaidOverviewMember[] }) {
  const dealers = members.filter((m) => m.role === "dealer");
  const support = members.find((m) => m.role === "support");

  return (
    <div
      className="rounded-md border px-2.5 py-2"
      style={{
        borderColor: "var(--accent)",
        background: "var(--chip-gold-bg)",
      }}
    >
      <p className="text-[10px] font-semibold text-accent-soft">잔여로 한 파티 더</p>
      <ul className="mt-1.5 space-y-1">
        {dealers.map((m) => (
          <MemberRow key={`${m.userNickname}-${m.characterName}`} member={m} />
        ))}
        {support && <MemberRow member={support} />}
      </ul>
    </div>
  );
}

export default function RaidSummary({ data }: { data: PartyOverviewData }) {
  if (data.raids.length === 0) {
    return <p className="text-xs text-muted">배정된 레이드가 없어요.</p>;
  }

  const active = data.raids.filter((r) => !r.clearedOnly);
  const cleared = data.raids.filter((r) => r.clearedOnly);

  return (
    <div className="space-y-3" aria-label="세줄 요약">
      {active.map((raid) => (
        <article
          key={raid.raidId}
          className="rounded-lg border border-border bg-surface-muted p-2.5"
        >
          <div className="flex items-baseline justify-between gap-2 border-b border-border pb-2">
            <h4 className="text-xs font-semibold">{raid.raidLabel}</h4>
            {raid.fullPartyCount > 0 ? (
              <span className="shrink-0 text-xs font-bold text-accent">
                {raid.fullPartyCount}파티
              </span>
            ) : (
              <span className="shrink-0 text-[10px] text-muted">0파티</span>
            )}
          </div>

          <div className="mt-2 space-y-2">
            {raid.leftover.length > 0 && (
              <div>
                <p className="mb-1 text-[10px] font-semibold text-muted">남은 캐릭</p>
                <ul className="space-y-1 rounded-md border border-dashed border-dashed-border bg-card/40 p-1">
                  {raid.leftover.map((m) => (
                    <MemberRow
                      key={`${m.userNickname}-${m.characterName}-${m.role}`}
                      member={m}
                    />
                  ))}
                </ul>
              </div>
            )}

            {raid.suggestedParty && (
              <SuggestedPartyBlock members={raid.suggestedParty} />
            )}

            {raid.soloMembers.length > 0 && (
              <div>
                <p className="mb-1 text-[10px] font-semibold text-muted">공팟 필요</p>
                <ul className="space-y-0.5 rounded-md border px-2 py-1.5"
                  style={{
                    borderColor: "var(--danger-border)",
                    background: "var(--danger-surface)",
                  }}
                >
                  {raid.soloMembers.map((m) => (
                    <MemberRow
                      key={`solo-${m.userNickname}-${m.characterName}`}
                      member={m}
                    />
                  ))}
                </ul>
              </div>
            )}

            {raid.leftover.length === 0 && raid.fullPartyCount > 0 && (
              <p className="text-[11px] text-muted">잔여 없음</p>
            )}
          </div>
        </article>
      ))}

      {cleared.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
            클리어 완료
          </p>
          <ul className="flex flex-wrap gap-1">
            {cleared.map((item) => (
              <li
                key={item.raidId}
                className="rounded-md border px-2 py-0.5 text-[10px]"
                style={{
                  borderColor: "var(--success-border)",
                  background: "var(--success-surface)",
                  color: "var(--success-text)",
                }}
              >
                {item.raidLabel}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.totals.length > 0 && (
        <div
          className="rounded-lg border border-accent/30 px-3 py-2.5"
          style={{ background: "var(--chip-gold-bg)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-accent-soft">
            총 완성 파티
          </p>
          <ul className="mt-2 space-y-1">
            {data.totals.map((t) => (
              <li
                key={t.raidLabel}
                className="flex items-baseline justify-between gap-2 text-xs"
              >
                <span className="font-medium">{t.raidLabel}</span>
                <span className="shrink-0 font-bold text-accent">
                  - {t.fullPartyCount}개
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-accent/20 pt-2 text-right text-xs font-bold text-accent">
            합계 {data.grandTotalParties}파티
          </p>
        </div>
      )}
    </div>
  );
}
