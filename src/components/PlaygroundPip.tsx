"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import ProbabilityRitual from "@/components/playground/ProbabilityRitual";

const FAB_IMAGE = "/play.png";

export default function PlaygroundPip() {
  const [open, setOpen] = useState(false);
  const [opacity, setOpacity] = useState(0.95);
  const [pos, setPos] = useState({ x: 24, y: 80 });
  const [fabPeek, setFabPeek] = useState<{ x: number; y: number } | null>(null);

  const dragRef = useRef<{
    active: boolean;
    startMouse: { x: number; y: number };
    startPanel: { x: number; y: number };
  }>({ active: false, startMouse: { x: 0, y: 0 }, startPanel: { x: 0, y: 0 } });

  const handleHeaderMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = {
        active: true,
        startMouse: { x: e.clientX, y: e.clientY },
        startPanel: { ...pos },
      };
    },
    [pos],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const { startMouse, startPanel } = dragRef.current;
      setPos({
        x: Math.max(0, startPanel.x + e.clientX - startMouse.x),
        y: Math.max(0, startPanel.y + e.clientY - startMouse.y),
      });
    };
    const onUp = () => {
      dragRef.current.active = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <>
      {open && (
        <div
          className="pointer-events-auto fixed z-40 w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
          style={{ left: pos.x, top: pos.y, opacity }}
        >
          <header
            className="flex cursor-move select-none items-center justify-between gap-2 border-b border-border px-3 py-2"
            onMouseDown={handleHeaderMouseDown}
          >
            <span className="text-sm font-semibold text-foreground">확률 의식</span>
            <div
              className="flex items-center gap-2"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <label className="flex items-center gap-1.5">
                <span className="whitespace-nowrap text-[10px] text-muted">투명도</span>
                <input
                  type="range"
                  min={0.15}
                  max={1}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-14 accent-[var(--accent)]"
                />
              </label>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded border border-border px-2 py-0.5 text-[10px] text-muted transition hover:border-border-strong hover:text-foreground"
              >
                닫기
              </button>
            </div>
          </header>

          <div className="max-h-[70dvh] overflow-y-auto p-3 daengmang-scroll">
            <ProbabilityRitual />
          </div>
        </div>
      )}

      {fabPeek && (
        <div
          className="pointer-events-none fixed z-[60] select-none"
          style={{ left: fabPeek.x + 14, top: fabPeek.y - 10 }}
          aria-hidden
        >
          <span className="whitespace-nowrap rounded-full border border-accent/40 bg-surface px-2.5 py-1 text-[11px] font-bold tracking-tight text-accent shadow-md">
            놀이터
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseMove={(e) => setFabPeek({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setFabPeek(null)}
        aria-expanded={open}
        aria-label={open ? "놀이터 닫기" : "놀이터 열기"}
        className={`pointer-events-auto fixed right-4 bottom-20 z-40 flex size-12 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface p-1 shadow-lg transition hover:border-border-strong hover:brightness-110 active:scale-95 sm:right-6 sm:bottom-24 sm:size-14 ${
          open ? "ring-2 ring-accent/40" : ""
        } ${fabPeek ? "cursor-none" : ""}`}
        style={{ boxShadow: "0 8px 24px var(--shadow)" }}
      >
        <Image
          src={FAB_IMAGE}
          alt=""
          width={48}
          height={48}
          className="size-full object-contain"
          priority
        />
      </button>
    </>
  );
}
