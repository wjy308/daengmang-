"use client";

import { useEffect, useState } from "react";
import { RAID_DEFINITIONS, RAID_GROUPS, getRaid, type RaidId } from "@/lib/raids";
import type { GoldOverride, GoldOverrides } from "@/lib/gold-overrides";
import { formatGold } from "@/lib/gold";

function GoldInput({
  value,
  isModified,
  onCommit,
}: {
  value: number;
  isModified: boolean;
  onCommit: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(value));

  useEffect(() => {
    setLocal(String(value));
  }, [value]);

  return (
    <input
      type="number"
      min="0"
      step="100"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const parsed = parseInt(local, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          onCommit(parsed);
        } else {
          setLocal(String(value));
        }
      }}
      className={`w-20 rounded border px-1.5 py-1 text-right text-xs outline-none focus:border-accent ${
        isModified
          ? "border-accent/50 bg-[var(--chip-gold-bg)] text-accent-soft"
          : "border-border bg-input text-foreground"
      }`}
    />
  );
}

function RaidGoldRow({
  raidId,
  overrides,
  onSet,
  onReset,
}: {
  raidId: RaidId;
  overrides: GoldOverrides;
  onSet: (raidId: RaidId, override: GoldOverride) => void;
  onReset: (raidId: RaidId) => void;
}) {
  const def = getRaid(raidId);
  const ov = overrides[raidId];

  const bound = ov?.boundGold ?? def.boundGold;
  const normal = ov?.normalGold ?? def.normalGold;
  const bonus = ov?.bonusCost ?? def.bonusCost;

  const isModifiedBound = ov !== undefined && ov.boundGold !== def.boundGold;
  const isModifiedNormal = ov !== undefined && ov.normalGold !== def.normalGold;
  const isModifiedBonus = ov !== undefined && ov.bonusCost !== def.bonusCost;
  const hasOverride = ov !== undefined;

  const update = (field: keyof GoldOverride, val: number) => {
    onSet(raidId, {
      boundGold: field === "boundGold" ? val : bound,
      normalGold: field === "normalGold" ? val : normal,
      bonusCost: field === "bonusCost" ? val : bonus,
    });
  };

  const basicTotal = bound + normal;
  const bonusTotal = basicTotal - bonus;

  return (
    <tr className="border-t border-border">
      <td className="py-2 pr-3 text-xs font-medium text-foreground whitespace-nowrap">
        {def.difficulty}
        {def.soloRaid && (
          <span className="ml-1 text-[10px] text-muted">(싱글)</span>
        )}
      </td>
      <td className="py-2 pr-2">
        <GoldInput
          value={bound}
          isModified={isModifiedBound}
          onCommit={(v) => update("boundGold", v)}
        />
      </td>
      <td className="py-2 pr-2">
        <GoldInput
          value={normal}
          isModified={isModifiedNormal}
          onCommit={(v) => update("normalGold", v)}
        />
      </td>
      <td className="py-2 pr-3">
        <GoldInput
          value={bonus}
          isModified={isModifiedBonus}
          onCommit={(v) => update("bonusCost", v)}
        />
      </td>
      <td className="py-2 pr-3 text-right text-[11px] text-muted whitespace-nowrap">
        {formatGold(basicTotal)}
        <br />
        <span className="text-accent-soft">{formatGold(bonusTotal)}</span>
      </td>
      <td className="py-2">
        {hasOverride ? (
          <button
            type="button"
            onClick={() => onReset(raidId)}
            className="rounded px-1.5 py-0.5 text-[10px] text-muted transition hover:text-[var(--danger-text)]"
          >
            초기화
          </button>
        ) : (
          <span className="px-1.5 text-[10px] text-muted-subtle">기본값</span>
        )}
      </td>
    </tr>
  );
}

export default function GoldTableModal({
  overrides,
  onSet,
  onReset,
  onResetAll,
  onClose,
}: {
  overrides: GoldOverrides;
  onSet: (raidId: RaidId, override: GoldOverride) => void;
  onReset: (raidId: RaidId) => void;
  onResetAll: () => void;
  onClose: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  const hasAnyOverride = Object.keys(overrides).length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gold-table-title"
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="닫기"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[min(90dvh,44rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
        <header className="shrink-0 border-b border-border px-4 py-3">
          <h2
            id="gold-table-title"
            className="text-base font-semibold tracking-tight"
          >
            클리어 골드표
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">
            수정한 값은 이 기기에 자동 저장돼요 · 귀속/일반/더보기비용 순
          </p>
        </header>

        <div className="daengmang-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-4">
            {RAID_GROUPS.map((group) => {
              const raids = RAID_DEFINITIONS.filter((r) => r.group === group);
              return (
                <section key={group}>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-accent-soft">
                    {group}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="pb-1 pr-3 text-left text-[10px] font-medium text-muted">
                            난이도
                          </th>
                          <th className="pb-1 pr-2 text-right text-[10px] font-medium text-muted">
                            귀속
                          </th>
                          <th className="pb-1 pr-2 text-right text-[10px] font-medium text-muted">
                            일반
                          </th>
                          <th className="pb-1 pr-3 text-right text-[10px] font-medium text-muted">
                            더보기
                          </th>
                          <th className="pb-1 pr-3 text-right text-[10px] font-medium text-muted">
                            합계
                            <br />
                            <span className="text-accent-soft">더보기 후</span>
                          </th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {raids.map((raid) => (
                          <RaidGoldRow
                            key={raid.id}
                            raidId={raid.id}
                            overrides={overrides}
                            onSet={onSet}
                            onReset={onReset}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <footer className="shrink-0 flex gap-2 border-t border-border px-4 py-3">
          {hasAnyOverride && (
            <button
              type="button"
              onClick={onResetAll}
              className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted transition hover:border-[var(--danger-border)] hover:text-[var(--danger-text)]"
            >
              전체 초기화
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-card py-2 text-sm font-semibold text-muted transition hover:border-border-strong hover:text-foreground"
          >
            닫기
          </button>
        </footer>
      </div>
    </div>
  );
}
