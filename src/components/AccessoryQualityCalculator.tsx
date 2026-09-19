"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useState } from "react";
import { useDraggablePanel } from "@/hooks/useDraggablePanel";
import {
  ACCESSORY_PARTS,
  POLISH_STAGES,
  calcAccessoryQuality,
  qualityColor,
  type AccessoryPart,
  type PolishStage,
  type QualityResult,
} from "@/lib/accessory-quality";

/**
 * 버튼 이미지 (우하단·헤더 버튼 공용). 비우면 점선 자리표시가 나온다.
 * 원본 게임 아이콘(42px)의 파란 테두리를 잘라내고, Lanczos로 4배(168px) 키워 살짝
 * 선명하게 한 뒤 모서리를 둥글게 깎아 둔 것. 브라우저가 42px를 늘리면 흐려서 미리 키웠다.
 */
export const ACCESSORY_BUTTON_IMAGE: string | null = "/accessory-quality.png";

/** 우하단 버튼에 마우스를 올리면 따라다니는 말풍선 */
const FAB_PEEK_TEXT = "상상상 슈웃";

/** 처음 열 때 위치 — 쌀산기(폭 24rem) 오른쪽이라 둘을 같이 열어도 안 겹친다 */
const PANEL_DEFAULT_POS = { x: 32 + 384 + 16, y: 96 };

function parseStatInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const value = Number.parseInt(digits, 10);
  return Number.isFinite(value) ? value : null;
}

function qualityText(result: QualityResult): string {
  if (result.status === "ok") return `${result.quality}`;
  return result.status === "below" ? "범위 아래" : "범위 위";
}

/** 버튼 안의 그림 — 이미지가 없으면 자리표시 */
export function AccessoryButtonArt({ className = "" }: { className?: string }) {
  if (ACCESSORY_BUTTON_IMAGE) {
    return (
      <Image
        src={ACCESSORY_BUTTON_IMAGE}
        alt=""
        width={56}
        height={56}
        className={`object-contain ${className}`}
      />
    );
  }
  return (
    <span
      className={`flex items-center justify-center rounded-lg border border-dashed border-dashed-border text-[10px] font-semibold text-muted-subtle ${className}`}
    >
      악세
    </span>
  );
}

export default function AccessoryQualityCalculator({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [part, setPart] = useState<AccessoryPart>("earring");
  const [stage, setStage] = useState<PolishStage>(0);
  const [statInput, setStatInput] = useState("");
  const [fabPeek, setFabPeek] = useState<{ x: number; y: number } | null>(null);
  const panelId = useId();
  const { panelProps, handleProps } = useDraggablePanel("accessory", PANEL_DEFAULT_POS, open);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const stat = parseStatInput(statInput);
  const result = stat !== null ? calcAccessoryQuality(part, stage, stat) : null;

  const segment = (active: boolean) =>
    `flex-1 rounded-lg border px-2 py-1.5 text-sm font-medium transition ${
      active
        ? "border-accent bg-accent text-accent-foreground"
        : "border-border bg-card text-muted hover:border-border-strong hover:text-foreground"
    }`;

  return (
    <>
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby="accessory-quality-title"
          {...panelProps}
          className="rice-panel-enter pointer-events-auto fixed z-40 w-[min(calc(100vw-3rem),22rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
          style={{ ...panelProps.style, boxShadow: "0 12px 40px var(--shadow)" }}
        >
          <header
            {...handleProps}
            className={`flex items-start justify-between gap-2 border-b border-border px-4 py-3 ${handleProps.className}`}
          >
            <div>
              <p className="text-[10px] font-semibold tracking-wide text-accent">
                로스트아크 · 고대 악세
              </p>
              <h2 id="accessory-quality-title" className="text-base font-semibold tracking-tight">
                악세 품질
              </h2>
              <p className="mt-0.5 text-xs text-muted">힘/민/지 수치로 품질 판독</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="악세 품질 계산기 닫기"
              className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs text-muted transition hover:border-border-strong hover:text-foreground"
            >
              닫기
            </button>
          </header>

          <div className="space-y-4 px-4 py-4">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted">부위</p>
              <div className="flex gap-1.5">
                {ACCESSORY_PARTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPart(p.id)}
                    aria-pressed={part === p.id}
                    className={segment(part === p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-muted">연마 단계</p>
              <div className="flex gap-1.5">
                {POLISH_STAGES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStage(s)}
                    aria-pressed={stage === s}
                    className={segment(stage === s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="accessory-main-stat" className="mb-1.5 block text-xs font-medium text-muted">
                힘/민/지
              </label>
              <input
                id="accessory-main-stat"
                type="text"
                inputMode="numeric"
                placeholder="예: 11869"
                value={statInput}
                onChange={(e) => setStatInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-sm tabular-nums outline-none focus:border-border-strong"
              />
            </div>

            {result && (
              <div className="rounded-lg border border-border bg-card px-3 py-3 text-center">
                {result.status === "ok" ? (
                  <>
                    <p
                      className="text-3xl font-bold tabular-nums tracking-tight"
                      style={{ color: qualityColor(result.quality) }}
                    >
                      {result.quality}
                      <span className="ml-0.5 text-base font-semibold text-muted">%</span>
                    </p>
                    <div className="mx-auto mt-2 h-1.5 max-w-48 overflow-hidden rounded-full bg-[var(--chip-muted-bg)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${result.quality}%`,
                          background: qualityColor(result.quality),
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-[var(--danger-text)]">
                    {result.status === "below" ? "최소보다 낮아요" : "최대보다 높아요"} — 부위·연마 단계를 확인해 주세요
                  </p>
                )}
                <p className="mt-2 text-[11px] text-muted-subtle tabular-nums">
                  {result.min.toLocaleString()} ~ {result.max.toLocaleString()}
                </p>
              </div>
            )}

            {stat !== null && (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted text-left text-[11px] text-muted">
                      <th className="px-3 py-1.5 font-medium" scope="col">연마</th>
                      <th className="px-3 py-1.5 font-medium" scope="col">범위</th>
                      <th className="px-3 py-1.5 text-right font-medium" scope="col">품질</th>
                    </tr>
                  </thead>
                  <tbody>
                    {POLISH_STAGES.map((s) => {
                      const row = calcAccessoryQuality(part, s, stat);
                      const selected = s === stage;
                      return (
                        <tr
                          key={s}
                          onClick={() => setStage(s)}
                          className={`cursor-pointer border-b border-border transition last:border-b-0 ${
                            selected ? "bg-[var(--chip-muted-bg)]" : "hover:bg-card-hover"
                          }`}
                        >
                          <td className={`px-3 py-1.5 ${selected ? "font-semibold text-foreground" : "text-muted"}`}>
                            {s}연마
                          </td>
                          <td className="px-3 py-1.5 tabular-nums text-muted-subtle">
                            {row.min.toLocaleString()}~{row.max.toLocaleString()}
                          </td>
                          <td
                            className={`px-3 py-1.5 text-right tabular-nums ${
                              row.status === "ok"
                                ? selected
                                  ? "font-bold"
                                  : "font-semibold"
                                : "text-muted-subtle"
                            }`}
                            style={
                              row.status === "ok"
                                ? { color: qualityColor(row.quality) }
                                : undefined
                            }
                          >
                            {qualityText(row)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="border-t border-border px-3 py-1.5 text-[10px] text-muted-subtle">
                  연마 단계를 모르면 범위 안에 드는 줄을 보세요. 줄을 누르면 선택돼요.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/*
        우끼끼(쌀산기)와 같은 마우스 따라다니는 말풍선.
        버튼이 화면 오른쪽 끝이라 커서 오른쪽에 두면 긴 문구가 잘려서 왼쪽에 띄운다.
      */}
      {fabPeek && (
        <div
          className="rice-fab-peek pointer-events-none fixed z-[60] select-none"
          style={{
            // fixed의 right는 스크롤바를 뺀 폭 기준이라 innerWidth 대신 clientWidth
            right: document.documentElement.clientWidth - fabPeek.x + 14,
            top: fabPeek.y - 10,
          }}
          aria-hidden
        >
          <span className="whitespace-nowrap rounded-full border border-accent/40 bg-surface px-2.5 py-1 text-[11px] font-bold tracking-tight text-accent shadow-md">
            {FAB_PEEK_TEXT}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        onMouseMove={(e) => setFabPeek({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setFabPeek(null)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? "악세 품질 계산기 닫기" : "악세 품질 계산기 열기"}
        title="악세 품질"
        // 쌀산기 원숭이 버튼(size-14 / sm:size-16) 바로 위, 같은 크기
        className={`fixed right-4 bottom-[5.25rem] z-40 flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface p-1.5 transition hover:border-border-strong hover:brightness-110 active:scale-95 sm:right-6 sm:bottom-[6.25rem] sm:size-16 ${
          open ? "ring-2 ring-accent/40" : ""
        } ${fabPeek ? "cursor-none" : ""}`}
      >
        <AccessoryButtonArt className="size-full" />
      </button>
    </>
  );
}
