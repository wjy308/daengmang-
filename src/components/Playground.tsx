"use client";

import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import ProbabilityRitual from "@/components/playground/ProbabilityRitual";

/** 놀이 시스템을 모아두는 페이지. 새 놀이는 여기에 섹션으로 덧붙인다. */
export default function Playground() {
  return (
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
  );
}
