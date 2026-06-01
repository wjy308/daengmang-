"use client";

import { useMemo } from "react";
import { planParties } from "@/lib/party-planner";
import { buildPartyOverview } from "@/lib/party-overview";
import type { User } from "@/lib/types";

export default function RaidOverview({ users }: { users: User[] }) {
  const items = useMemo(() => {
    if (!users.some((u) => u.characters.length > 0)) return [];
    return buildPartyOverview(planParties(users));
  }, [users]);

  if (items.length === 0) return null;

  const complete = items.filter(
    (item) => !item.clearedOnly && item.fullPartyCount > 0,
  );
  const incomplete = items.filter(
    (item) => !item.clearedOnly && item.incompleteLine,
  );
  const cleared = items.filter((item) => item.clearedOnly);

  return (
    <section
      className="rounded-xl border border-accent/40 bg-surface-muted p-4 lg:p-5"
      aria-label="한눈에 보기"
    >
      <div className="mb-3">
        <h2 className="text-base font-semibold tracking-tight lg:text-lg">
          한눈에 보기
        </h2>
        <p className="mt-0.5 text-xs text-muted">
          클리어 제외 · 무골 후순위 · 4인 파티(딜3+서폿1) 기준
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {complete.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              완성 파티
            </p>
            <ul className="flex flex-wrap gap-2">
              {complete.map((item) => (
                <li
                  key={item.raidId}
                  className="rounded-lg border border-border bg-card px-3 py-2"
                >
                  <span className="text-sm font-medium">{item.raidLabel}</span>
                  <span className="ml-2 text-sm font-bold text-accent">
                    {item.fullPartyCount}개
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(incomplete.length > 0 || cleared.length > 0) && (
          <div className="space-y-3">
            {incomplete.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  4인 미완 / 잔여
                </p>
                <ul className="space-y-1.5">
                  {incomplete.map((item) => (
                    <li
                      key={item.raidId}
                      className="rounded-lg border border-dashed border-dashed-border bg-card px-3 py-2 text-sm leading-snug"
                    >
                      {item.incompleteLine}
                      {item.unavailableReason && item.fullPartyCount === 0 && (
                        <span className="mt-1 block text-[11px] text-accent-soft">
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
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  클리어 완료
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {cleared.map((item) => (
                    <li
                      key={item.raidId}
                      className="rounded-md border px-2 py-1 text-xs"
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
        )}
      </div>
    </section>
  );
}
