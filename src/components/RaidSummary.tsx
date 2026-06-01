"use client";

import type { RaidOverviewItem } from "@/lib/party-overview";

export default function RaidSummary({ items }: { items: RaidOverviewItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-muted">배정된 레이드가 없어요.</p>
    );
  }

  const complete = items.filter(
    (item) => !item.clearedOnly && item.fullPartyCount > 0,
  );
  const incomplete = items.filter(
    (item) => !item.clearedOnly && item.incompleteLine,
  );
  const cleared = items.filter((item) => item.clearedOnly);

  return (
    <div className="space-y-3" aria-label="세줄 요약">
      {complete.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
            완성 파티
          </p>
          <ul className="space-y-1">
            {complete.map((item) => (
              <li
                key={item.raidId}
                className="flex items-baseline justify-between gap-2 rounded-md border border-border bg-surface-muted px-2.5 py-1.5"
              >
                <span className="text-xs font-medium">{item.raidLabel}</span>
                <span className="shrink-0 text-xs font-bold text-accent">
                  {item.fullPartyCount}개
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {incomplete.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
            4인 미완 / 잔여
          </p>
          <ul className="space-y-1">
            {incomplete.map((item) => (
              <li
                key={item.raidId}
                className="rounded-md border border-dashed border-dashed-border bg-surface-muted px-2.5 py-1.5 text-[11px] leading-snug"
              >
                {item.incompleteLine}
                {item.unavailableReason && item.fullPartyCount === 0 && (
                  <span className="mt-1 block text-[10px] text-accent-soft">
                    {item.unavailableReason}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

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
    </div>
  );
}
