"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ProbabilityRitual from "@/components/playground/ProbabilityRitual";

const FAB_IMAGE = "/play.png";

function cloneStylesheets(target: Window) {
  target.document.documentElement.className =
    document.documentElement.className;
  document
    .querySelectorAll<HTMLElement>("style, link[rel='stylesheet']")
    .forEach((el) => target.document.head.appendChild(el.cloneNode(true)));
  target.document.body.style.margin = "0";
}

export default function PlaygroundPip() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [opacity, setOpacity] = useState(1);
  const [fabPeek, setFabPeek] = useState<{ x: number; y: number } | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const openPip = async () => {
    if (!("documentPictureInPicture" in window)) {
      setHint("Chrome 116+ 에서만 지원해요");
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pip: Window = await (window as any).documentPictureInPicture.requestWindow({
        width: 420,
        height: 640,
      });
      cloneStylesheets(pip);
      pip.addEventListener("pagehide", () => setPipWindow(null));
      setPipWindow(pip);
    } catch {
      // 사용자가 취소한 경우 무시
    }
  };

  const closePip = () => {
    pipWindow?.close();
    setPipWindow(null);
  };

  // 테마 변경 시 PiP 창에도 동기화
  useEffect(() => {
    if (!pipWindow) return;
    const observer = new MutationObserver(() => {
      pipWindow.document.documentElement.className =
        document.documentElement.className;
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [pipWindow]);

  // 투명도 PiP body에 적용
  useEffect(() => {
    if (!pipWindow) return;
    pipWindow.document.body.style.opacity = String(opacity);
  }, [pipWindow, opacity]);

  return (
    <>
      {pipWindow &&
        createPortal(
          <div className="min-h-dvh bg-background text-foreground">
            <header
              className="sticky top-0 z-10 flex items-center gap-3 border-b border-border px-3 py-2"
              style={{ background: "var(--header-bg)" }}
            >
              <span className="text-sm font-semibold">확률 의식</span>
              <label className="ml-auto flex items-center gap-1.5">
                <span className="whitespace-nowrap text-[10px] text-muted">
                  투명도
                </span>
                <input
                  type="range"
                  min={0.15}
                  max={1}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-16 accent-[var(--accent)]"
                />
              </label>
            </header>
            <div className="p-3">
              <ProbabilityRitual />
            </div>
          </div>,
          pipWindow.document.body,
        )}

      {fabPeek && (
        <div
          className="pointer-events-none fixed z-[60] select-none"
          style={{ left: fabPeek.x + 14, top: fabPeek.y - 10 }}
          aria-hidden
        >
          <span className="whitespace-nowrap rounded-full border border-accent/40 bg-surface px-2.5 py-1 text-[11px] font-bold tracking-tight text-accent shadow-md">
            {hint ?? (pipWindow ? "닫기" : "놀이터 PiP")}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={pipWindow ? closePip : openPip}
        onMouseMove={(e) => {
          setFabPeek({ x: e.clientX, y: e.clientY });
          setHint(null);
        }}
        onMouseLeave={() => setFabPeek(null)}
        aria-expanded={!!pipWindow}
        aria-label={pipWindow ? "놀이터 닫기" : "놀이터 PiP 열기"}
        className={`pointer-events-auto fixed right-4 bottom-20 z-40 flex size-12 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface p-1 shadow-lg transition hover:border-border-strong hover:brightness-110 active:scale-95 sm:right-6 sm:bottom-24 sm:size-14 ${
          pipWindow ? "ring-2 ring-accent/40" : ""
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
