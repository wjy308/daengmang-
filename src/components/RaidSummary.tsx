"use client";

import type { ReactNode } from "react";
import type {
  PartyOverviewData,
  RaidOverviewMember,
} from "@/lib/party-overview";
import RoleBadge from "@/components/ui/RoleBadge";

function MemberRow({ member }: { member: RaidOverviewMember }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2">
      <RoleBadge role={member.role} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-foreground">
          {member.userNickname}
        </p>
        <p className="truncate text-[11px] text-muted">{member.characterName}</p>
      </div>
    </li>
  );
}

function memberKey(m: RaidOverviewMember) {
  return `${m.userNickname}-${m.characterName}-${m.role}`;
}

function assignedMemberKeys(raid: {
  suggestedParties: RaidOverviewMember[][];
  partialParty: RaidOverviewMember[] | null;
  pubMembers: RaidOverviewMember[];
}): Set<string> {
  const hide = new Set<string>();
  for (const party of raid.suggestedParties) {
    for (const m of party) hide.add(memberKey(m));
  }
  for (const m of raid.partialParty ?? []) hide.add(memberKey(m));
  for (const m of raid.pubMembers) hide.add(memberKey(m));
  return hide;
}

function leftoverForDisplay(
  raid: {
    leftover: RaidOverviewMember[];
    suggestedParties: RaidOverviewMember[][];
    partialParty: RaidOverviewMember[] | null;
    pubMembers: RaidOverviewMember[];
  },
): RaidOverviewMember[] {
  const hide = assignedMemberKeys(raid);
  return raid.leftover.filter((m) => !hide.has(memberKey(m)));
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
      {children}
    </p>
  );
}

function PartyBlock({
  members,
  title,
  hint,
}: {
  members: RaidOverviewMember[];
  title: string;
  hint?: string;
}) {
  const dealers = members.filter((m) => m.role === "dealer");
  const support = members.find((m) => m.role === "support");

  return (
    <div
      className="rounded-xl border-2 px-3 py-3"
      style={{
        borderColor: "var(--accent)",
        background: "var(--chip-gold-bg)",
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-accent-soft">{title}</p>
        {hint && (
          <span className="text-xs font-medium text-accent">{hint}</span>
        )}
      </div>
      <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {dealers.map((m) => (
          <MemberRow key={`${m.userNickname}-${m.characterName}`} member={m} />
        ))}
        {support && <MemberRow member={support} />}
      </ul>
    </div>
  );
}

function FullPartySection({ parties }: { parties: RaidOverviewMember[][] }) {
  return (
    <div>
      <SectionLabel>구성된 파티</SectionLabel>
      <div className="space-y-1.5">
        {parties.map((party, index) => (
          <div
            key={`full-party-${index}`}
            className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2"
          >
            <span className="mr-1 text-[11px] font-semibold text-accent-soft">
              {index + 1}파티
            </span>
            {party.map((member) => (
              <span
                key={`${index}-${memberKey(member)}`}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[11px]"
              >
                <RoleBadge role={member.role} />
                <span className="max-w-28 truncate">
                  {member.userNickname}/{member.characterName}
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RaidSummary({ data }: { data: PartyOverviewData }) {
  if (data.raids.length === 0) {
    return <p className="text-sm text-muted">배정된 레이드가 없어요.</p>;
  }

  const active = data.raids.filter((r) => !r.clearedOnly);
  const cleared = data.raids.filter((r) => r.clearedOnly);

  return (
    <div className="space-y-4" aria-label="그래서 이제 뭐 함?">
      {active.map((raid) => {
        const displayLeftover = leftoverForDisplay(raid);
        const hasPartyBlocks =
          raid.suggestedParties.length > 0 || raid.partialParty !== null;

        return (
          <article
            key={raid.raidId}
            className="rounded-xl border border-border bg-surface-muted p-4"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <h4 className="text-base font-bold text-foreground">
                {raid.raidLabel}
              </h4>
              {raid.fullPartyCount > 0 ? (
                <span className="shrink-0 rounded-lg bg-accent/15 px-2.5 py-1 text-sm font-bold text-accent">
                  {raid.fullPartyCount}파티
                </span>
              ) : (
                <span className="shrink-0 text-sm text-muted">0파티</span>
              )}
            </div>

            <div className="mt-3 space-y-3">
              {raid.fullParties.length > 0 && (
                <FullPartySection parties={raid.fullParties} />
              )}

              {raid.suggestedParties.map((party, index) => (
                <PartyBlock
                  key={`suggested-${index}`}
                  members={party}
                  title={
                    raid.suggestedParties.length > 1
                      ? `잔여로 한 파티 더 ${index + 1}`
                      : "잔여로 한 파티 더"
                  }
                />
              ))}

              {raid.partialParty && (
                <PartyBlock
                  members={raid.partialParty}
                  title="잔여로 한 파티 더"
                />
              )}

              {raid.pubMembers.length > 0 && (
                <div>
                  <SectionLabel>공팟 필요</SectionLabel>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {raid.pubMembers.map((m) => (
                      <MemberRow
                        key={`pub-${m.userNickname}-${m.characterName}`}
                        member={m}
                      />
                    ))}
                  </ul>
                </div>
              )}

              {displayLeftover.length > 0 && (
                <div>
                  <SectionLabel>남은 캐릭</SectionLabel>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {displayLeftover.map((m) => (
                      <MemberRow key={memberKey(m)} member={m} />
                    ))}
                  </ul>
                </div>
              )}

              {displayLeftover.length === 0 &&
                !hasPartyBlocks &&
                raid.pubMembers.length === 0 &&
                raid.fullPartyCount > 0 && (
                  <p className="text-sm text-muted">잔여 없음</p>
                )}
            </div>
          </article>
        );
      })}

      {cleared.length > 0 && (
        <div className="rounded-xl border border-border bg-surface-muted p-4">
          <SectionLabel>클리어 완료</SectionLabel>
          <ul className="flex flex-wrap gap-2">
            {cleared.map((item) => (
              <li
                key={item.raidId}
                className="rounded-lg border px-3 py-1.5 text-sm font-medium"
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
          className="rounded-xl border-2 border-accent/30 px-4 py-4"
          style={{ background: "var(--chip-gold-bg)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-soft">
            총 완성 파티
          </p>
          <ul className="mt-3 space-y-2">
            {data.totals.map((t) => (
              <li
                key={t.raidLabel}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="font-semibold text-foreground">
                  {t.raidLabel}
                </span>
                <span className="shrink-0 text-base font-bold text-accent">
                  {t.fullPartyCount}개
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-accent/20 pt-3 text-right text-base font-bold text-accent">
            합계 {data.grandTotalParties}파티
          </p>
        </div>
      )}
    </div>
  );
}
