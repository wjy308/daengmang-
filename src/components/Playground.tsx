"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ThemeToggle from "@/components/ThemeToggle";
import ProbabilityRitual from "@/components/playground/ProbabilityRitual";

function cloneStylesheets(target: Window) {
  target.document.documentElement.className =
    document.documentElement.className;
  document
    .querySelectorAll<HTMLElement>("style, link[rel='stylesheet']")
    .forEach((el) => target.document.head.appendChild(el.cloneNode(true)));
  target.document.body.style.margin = "0";
}

/** 놀이 시스템을 모아두는 페이지. 새 놀이는 여기에 섹션으로 덧붙인다. */
export default function Playground() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [opacity, setOpacity] = useState(1);

  const openPip = async () => {
    if (!("documentPictureInPicture" in window)) {
      alert("Chrome 116+ 이상에서만 지원해요.");
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
      // 사용자가 취소
    }
  };

  const closePip = () => {
    pipWindow?.close();
    setPipWindow(null);
  };

  // 테마 변경 → PiP 창에 동기화
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

  // 투명도 → PiP body에 적용
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

      <div className="min-h-dvh bg-background">
        <header
          className="sticky top-0 z-10 border-b border-border backdrop-blur"
          style={{ background: "var(--header-bg)" }}
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 lg:max-w-[1600px] lg:px-8">
            <div className="flex items-center gap-2.5">
              <Image
                src="/play.png"
                alt=""
                width={36}
                height={36}
                className="shrink-0"
                priority
              />
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-accent">
                  daengmang
                </p>
                <h1 className="text-lg font-semibold tracking-tight">놀이터</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={pipWindow ? closePip : openPip}
                className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                  pipWindow
                    ? "border-accent/50 bg-[var(--chip-gold-bg)] font-semibold text-accent-soft hover:opacity-80"
                    : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground"
                }`}
              >
                {pipWindow ? "PiP 닫기" : "PiP 모드"}
              </button>
              <Link
                href="/"
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted transition hover:border-border-strong hover:text-foreground"
              >
                ← 레이드 정리
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 lg:max-w-[1600px] lg:space-y-10 lg:px-8 lg:py-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight lg:text-xl">
              놀이터
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              숙제와 상관없는, 그냥 재밌자고 만든 것들
            </p>
          </div>

          <ProbabilityRitual />
        </main>
      </div>
    </>
  );
}
