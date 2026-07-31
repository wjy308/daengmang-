"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  MAX_PERCENT,
  MIN_PERCENT,
  PERCENT_PRESETS,
  TICK_PRESETS,
  averageAttempts,
  clampPercent,
  expectedAttempts,
  judge,
  sampleTrialsToSuccess,
  trialsPerTick,
  type RitualRecord,
  type TickPresetId,
} from "@/lib/playground/probability-ritual";

const VERDICT_COLOR: Record<string, string> = {
  great: "var(--accent)",
  good: "var(--success-text)",
  normal: "var(--muted)",
  bad: "var(--danger-text)",
};

/** 기대값의 이 배를 넘기면 마스코트가 깐죽대기 시작한다 */
const NAGGING_RATIO = 1.6;

export default function ProbabilityRitual() {
  const [percentInput, setPercentInput] = useState("2");
  const [tickId, setTickId] = useState<TickPresetId>("normal");
  const [rolling, setRolling] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hitAttempts, setHitAttempts] = useState<number | null>(null);
  const [records, setRecords] = useState<RitualRecord[]>([]);
  const recordId = useRef(0);

  const percent = clampPercent(Number(percentInput));
  const expected = expectedAttempts(percent);
  const tickMs =
    TICK_PRESETS.find((t) => t.id === tickId)?.ms ?? TICK_PRESETS[1].ms;
  const perTick = trialsPerTick(percent, tickMs);

  useEffect(() => {
    if (!rolling) return;

    const timer = setInterval(() => {
      setAttempts((prev) => {
        // 베르누이 시행은 기억이 없어서 매 틱 새로 뽑아도 분포가 같다
        const untilHit = sampleTrialsToSuccess(percent);
        if (untilHit > perTick) return prev + perTick;

        const total = prev + untilHit;
        setRolling(false);
        setHitAttempts(total);
        recordId.current += 1;
        setRecords((old) =>
          [{ id: recordId.current, percent, attempts: total }, ...old].slice(
            0,
            8,
          ),
        );
        return total;
      });
    }, tickMs);

    return () => clearInterval(timer);
  }, [rolling, percent, tickMs, perTick]);

  const start = () => {
    setAttempts(0);
    setHitAttempts(null);
    setRolling(true);
  };

  const stop = () => setRolling(false);

  const reset = () => {
    setRolling(false);
    setAttempts(0);
    setHitAttempts(null);
  };

  const nagging = rolling && attempts > expected * NAGGING_RATIO;
  const verdict = hitAttempts !== null ? judge(percent, hitAttempts) : null;
  const average = averageAttempts(records);

  return (
    <section className="rounded-xl border border-border bg-surface-muted p-4 lg:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold tracking-tight">확률 의식</h3>
          <p className="mt-0.5 text-sm text-muted lg:text-xs">
            대신 굴려 드립니다. 뚫리는 순간 알려줄 테니 그때 누르세요.
          </p>
        </div>
        <p className="text-[10px] text-muted-subtle">
          ※ 여기 난수와 게임 서버 난수는 아무 관계가 없습니다
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-xs text-muted">
          <span className="mb-1 block">성공 확률 (%)</span>
          <input
            type="number"
            value={percentInput}
            min={MIN_PERCENT}
            max={MAX_PERCENT}
            step={0.1}
            disabled={rolling}
            onChange={(e) => setPercentInput(e.target.value)}
            className="w-24 rounded-lg border border-border bg-[var(--input-bg)] px-2.5 py-1.5 text-sm text-foreground outline-none transition focus:border-accent disabled:opacity-50"
          />
        </label>

        <div className="text-xs text-muted">
          <span className="mb-1 block">속도</span>
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5">
            {TICK_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setTickId(preset.id)}
                aria-pressed={tickId === preset.id}
                className={`rounded-md px-2 py-1 text-[11px] transition ${
                  tickId === preset.id
                    ? "bg-[var(--chip-muted-bg)] font-semibold text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <p className="pb-1.5 text-[11px] text-muted-subtle">
          기대 시도 {Math.round(expected).toLocaleString()}회 · 예상 대기{" "}
          {((expected / perTick) * (tickMs / 1000)).toFixed(1)}초
          {perTick > 1 && ` · 틱당 ${perTick.toLocaleString()}회씩`}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-muted-subtle">자주 쓰는 확률</span>
        {PERCENT_PRESETS.map((preset) => {
          const active = percent === preset.percent;
          return (
            <button
              key={preset.label}
              type="button"
              disabled={rolling}
              onClick={() => setPercentInput(String(preset.percent))}
              title={`${preset.percent}%`}
              className={`rounded-md border px-2 py-0.5 text-[11px] transition disabled:opacity-40 ${
                active
                  ? "border-accent/60 bg-[var(--chip-gold-bg)] text-accent-soft"
                  : "border-border bg-card text-muted hover:border-border-strong hover:text-foreground"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-5 text-center">
        {hitAttempts !== null ? (
          <div className="ritual-hit">
            <Image
              src="/letsGo.png"
              alt=""
              width={96}
              height={96}
              className="mx-auto"
            />
            <p className="mt-1 text-2xl font-bold tracking-tight text-accent">
              지금 눌러!!
            </p>
            <p className="mt-1 text-sm text-foreground">
              {hitAttempts.toLocaleString()}번째에 터졌습니다
            </p>
            {verdict && (
              <p
                className="mt-0.5 text-xs font-semibold"
                style={{ color: VERDICT_COLOR[verdict.tone] }}
              >
                {verdict.label} · 이 안에 끝날 확률{" "}
                {(verdict.cumulative * 100).toFixed(0)}%
              </p>
            )}
          </div>
        ) : (
          <>
            {nagging && (
              <Image
                src="/more.png"
                alt=""
                width={72}
                height={72}
                className="mx-auto opacity-90"
              />
            )}
            <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
              {attempts.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted">
              {rolling
                ? nagging
                  ? "기대값은 진작 넘겼습니다… 더 굴립니다"
                  : "굴리는 중…"
                : attempts > 0
                  ? "중단됨"
                  : "시도를 누르면 대신 굴리기 시작합니다"}
            </p>
          </>
        )}

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {rolling ? (
            <button
              type="button"
              onClick={stop}
              className="rounded-xl border border-border bg-surface px-6 py-2.5 text-sm font-semibold text-muted transition hover:border-border-strong hover:text-foreground"
            >
              멈추기
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              className="rounded-xl border border-accent/50 bg-[var(--chip-gold-bg)] px-8 py-2.5 text-sm font-semibold text-accent-soft transition hover:border-accent"
            >
              {hitAttempts !== null ? "다시 도전" : "시도"}
            </button>
          )}
          {!rolling && attempts > 0 && (
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted transition hover:border-border-strong hover:text-foreground"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {records.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] text-muted">
            최근 기록
            {average !== null && (
              <span className="ml-2 text-muted-subtle">
                평균 {average.toFixed(1)}회
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {records.map((record) => (
              <span
                key={record.id}
                className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] text-muted"
                title={`확률 ${record.percent}%`}
              >
                {record.percent}% · {record.attempts.toLocaleString()}회
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
