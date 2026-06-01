"use client";

import type { ReactNode } from "react";

export default function CollapsiblePanel({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-card-hover lg:py-2"
        aria-expanded={open}
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border text-[10px] text-muted"
          aria-hidden
        >
          {open ? "−" : "+"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold">{title}</span>
          {subtitle && (
            <span className="mt-0.5 block truncate text-[10px] text-muted">
              {subtitle}
            </span>
          )}
        </span>
      </button>
      {open && (
        <div className="border-t border-border px-3 py-3 lg:px-2.5 lg:py-2.5">
          {children}
        </div>
      )}
    </div>
  );
}
