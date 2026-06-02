"use client";

import { useMemo, useState } from "react";
import { buildPartyOverview } from "@/lib/party-overview";
import { planParties } from "@/lib/party-planner";
import type { User } from "@/lib/types";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel";
import RaidSummary from "@/components/RaidSummary";

export default function PartyPlanner({ users }: { users: User[] }) {
  const [summaryOpen, setSummaryOpen] = useState(true);

  const hasCharacters = users.some((u) => u.characters.length > 0);

  const summaryData = useMemo(() => {
    if (!summaryOpen) return null;
    return buildPartyOverview(planParties(users));
  }, [users, summaryOpen]);

  const summarySubtitle = useMemo(() => {
    if (!summaryData) return undefined;
    return `완성 ${summaryData.grandTotalParties}파티 · 레이드 ${summaryData.totals.length}종`;
  }, [summaryData]);

  const handleWhatNow = () => setSummaryOpen(true);

  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface-muted p-4">
      <div>
        <h3 className="text-sm font-semibold">파티 추천</h3>
        <p className="mt-0.5 text-xs text-muted">
          딜3+서폿1 · 클리어 제외 · 무골 후순위
        </p>
      </div>

      <button
        type="button"
        onClick={handleWhatNow}
        disabled={!hasCharacters}
        className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        그래서 이제 뭐 함?
      </button>

      {!hasCharacters && (
        <p className="text-xs text-muted">캐릭터 등록 후 사용</p>
      )}

      <div id="party-result">
        {summaryData && (
          <CollapsiblePanel
            title="그래서 이제 뭐 함?"
            subtitle={summarySubtitle}
            open={summaryOpen}
            onToggle={() => setSummaryOpen((v) => !v)}
          >
            <RaidSummary data={summaryData} />
          </CollapsiblePanel>
        )}
      </div>
    </section>
  );
}
