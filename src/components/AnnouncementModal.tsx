"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "daengmang-notice-dismissed-v1";

export default function AnnouncementModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(DISMISSED_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="닫기"
        onClick={dismiss}
      />

      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
        <header className="border-b border-border px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-accent-soft">
            공지
          </p>
          <h2
            id="announcement-title"
            className="mt-0.5 text-base font-semibold tracking-tight"
          >
            골드 구성 변경 안내
          </h2>
        </header>

        <div className="px-4 py-4 text-sm leading-relaxed text-foreground space-y-3">
          <p>
            <span className="font-semibold text-accent-soft">종막 노말 골드 너프</span>로 인해
            기존 1730 캐릭터가 받던
          </p>
          <p className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-[13px]">
            하르카 → 4막 하드 → 종막 노말
          </p>
          <p>
            이 조합에서 이제 클리어 골드 기준으로는{" "}
            <span className="font-semibold">종막 노말 대신 성심당 2단계</span>가 더 높아요.
          </p>
          <p className="text-muted text-[13px]">
            단, 성심당 2단계는 골드가{" "}
            <span className="font-semibold text-foreground">전부 귀속</span>이기 때문에
            이 점 고려해서 골드 체크해 주세요.
          </p>
        </div>

        <footer className="border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={dismiss}
            className="w-full rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-muted transition hover:border-border-strong hover:text-foreground"
          >
            닫기 (다시 보지 않기)
          </button>
        </footer>
      </div>
    </div>
  );
}
