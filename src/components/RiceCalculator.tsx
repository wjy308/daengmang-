"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  calcRiceBidRows,
  formatGold,
  type RaidPartySize,
} from "@/lib/rice-calculator";

const FAB_IMAGE = "/rice-calculator-fab.webp";

function parseGoldInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const value = Number.parseInt(digits, 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export default function RiceCalculator() {
  const [open, setOpen] = useState(false);
  const [partySize, setPartySize] = useState<RaidPartySize>(8);
  const [priceInput, setPriceInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fabPeek, setFabPeek] = useState<{ x: number; y: number } | null>(
    null,
  );
  const panelId = useId();

  const marketPrice = parseGoldInput(priceInput);
  const rows = useMemo(
    () =>
      marketPrice !== null ? calcRiceBidRows(marketPrice, partySize) : [],
    [marketPrice, partySize],
  );

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (!copiedId) return;
    const timer = window.setTimeout(() => setCopiedId(null), 1500);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  const copyBid = async (rowId: string, bid: number) => {
    const text = String(bid);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(rowId);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby="rice-calculator-title"
          className="rice-panel-enter pointer-events-auto fixed top-24 left-6 z-40 w-[min(calc(100vw-3rem),24rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-lg sm:left-8"
          style={{ boxShadow: "0 12px 40px var(--shadow)" }}
        >
          <header className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold tracking-wide text-accent">
                로스트아크 · 레이드 경매
              </p>
              <h2
                id="rice-calculator-title"
                className="text-base font-semibold tracking-tight"
              >
                쌀산기
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                시세 입력 시 입찰 상한·예상 이득 (수수료 5%)
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="쌀산기 닫기"
              className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs text-muted transition hover:border-border-strong hover:text-foreground"
            >
              닫기
            </button>
          </header>

          <div className="space-y-4 px-4 py-4">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted">인원</p>
              <div className="flex gap-2">
                {([4, 8] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPartySize(size)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      partySize === size
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-card text-muted hover:border-border-strong hover:text-foreground"
                    }`}
                  >
                    {size}인
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="rice-market-price"
                className="mb-1.5 block text-xs font-medium text-muted"
              >
                경매장 시세 (골드)
              </label>
              <input
                id="rice-market-price"
                type="text"
                inputMode="numeric"
                placeholder="예: 170599"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-sm tabular-nums outline-none focus:border-border-strong"
              />
            </div>

            {marketPrice !== null && rows.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted text-left text-[11px] text-muted">
                      <th className="px-3 py-2 font-medium" scope="col">
                        구분
                      </th>
                      <th
                        className="px-3 py-2 text-right font-medium"
                        scope="col"
                      >
                        손익
                      </th>
                      <th
                        className="px-3 py-2 text-right font-medium"
                        scope="col"
                      >
                        입찰가
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const copied = copiedId === row.id;
                      return (
                        <tr
                          key={row.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => copyBid(row.id, row.bid)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              copyBid(row.id, row.bid);
                            }
                          }}
                          title="입찰가 복사"
                          aria-label={`${row.label}, 입찰가 ${formatGold(row.bid)} 복사`}
                          className={`cursor-pointer border-b border-border transition last:border-b-0 ${
                            copied
                              ? "bg-success-surface"
                              : "hover:bg-card-hover"
                          }`}
                        >
                          <td className="px-3 py-2.5 text-xs text-foreground">
                            {row.label}
                          </td>
                          <td
                            className={`px-3 py-2.5 text-right tabular-nums text-xs ${
                              row.profit > 0
                                ? "text-success-text"
                                : "text-muted-subtle"
                            }`}
                          >
                            {row.profit > 0
                              ? `+${formatGold(row.profit)}`
                              : "0"}
                          </td>
                          <td
                            className={`px-3 py-2.5 text-right text-xs font-semibold tabular-nums ${
                              copied ? "text-success-text" : "text-foreground"
                            }`}
                          >
                            {copied ? "복사됨" : formatGold(row.bid)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="border-t border-border px-3 py-2 text-[10px] text-muted-subtle">
                  행을 누르면 입찰가가 복사돼요.
                </p>
              </div>
            )}

            {marketPrice === null && priceInput.length > 0 && (
              <p className="text-xs text-muted-subtle">
                올바른 시세를 입력해 주세요.
              </p>
            )}
          </div>
        </div>
      )}

      {fabPeek && (
        <div
          className="rice-fab-peek pointer-events-none fixed z-[60] select-none"
          style={{ left: fabPeek.x + 14, top: fabPeek.y - 10 }}
          aria-hidden
        >
          <span className="whitespace-nowrap rounded-full border border-accent/40 bg-surface px-2.5 py-1 text-[11px] font-bold tracking-tight text-accent shadow-md">
            우끼끼
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseMove={(e) => setFabPeek({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setFabPeek(null)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? "쌀산기 닫기" : "쌀산기 열기"}
        className={`rice-fab fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-lg transition hover:border-border-strong hover:brightness-110 active:scale-95 sm:right-6 sm:bottom-6 sm:size-16 ${
          open ? "ring-2 ring-accent/40" : ""
        } ${fabPeek ? "cursor-none" : ""}`}
        style={{ boxShadow: "0 8px 24px var(--shadow)" }}
      >
        <Image
          src={FAB_IMAGE}
          alt=""
          width={56}
          height={56}
          className="size-full object-contain"
          priority
        />
      </button>
    </>
  );
}
