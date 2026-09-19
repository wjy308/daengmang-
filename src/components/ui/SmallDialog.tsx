"use client";

import { useEffect, useId, type FormEvent, type ReactNode } from "react";

/**
 * 이름 하나 받는 정도의 작은 입력 다이얼로그 틀.
 * 바깥을 누르거나 Esc를 누르면 닫히고, 안쪽은 form이라 Enter로 제출된다.
 */
export default function SmallDialog({
  title,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="닫기"
        onClick={onClose}
      />
      <form
        className="relative z-10 w-full max-w-xs rounded-xl border border-border bg-surface p-4 shadow-lg"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <h3 id={titleId} className="text-sm font-semibold tracking-tight">
          {title}
        </h3>
        {children}
      </form>
    </div>
  );
}
