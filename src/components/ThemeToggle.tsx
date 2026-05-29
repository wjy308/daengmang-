"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-muted transition hover:border-border-strong hover:text-foreground"
    >
      {theme === "dark" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="size-4"
          aria-hidden
        >
          <path d="M10 2a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm4.95 2.05a1 1 0 0 1 0 1.414L13.536 7.879a1 1 0 1 1-1.414-1.414l1.414-1.415a1 1 0 0 1 1.414 0ZM17 9a1 1 0 1 1 0 2h-1.5a1 1 0 1 1 0-2H17ZM13.536 12.121a1 1 0 0 1 1.414 0l1.415 1.414a1 1 0 1 1-1.414 1.414l-1.415-1.414a1 1 0 0 1 0-1.414ZM10 14.5a1 1 0 0 1 1 1V17a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1ZM5.05 14.95a1 1 0 0 1 0-1.414l1.415-1.414a1 1 0 1 1 1.414 1.414L6.464 14.95a1 1 0 0 1-1.414 0ZM3 9a1 1 0 0 1 0 2H1.5a1 1 0 0 1 0-2H3Zm2.05-4.95a1 1 0 0 1 1.414 0L7.879 5.464a1 1 0 0 1-1.414 1.414L4.05 5.414a1 1 0 0 1 0-1.414ZM10 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="size-4"
          aria-hidden
        >
          <path d="M7.293 3.293a1 1 0 0 1 1.414 0l1.879 1.879a1 1 0 0 1-1.414 1.414L7.293 4.707a1 1 0 0 1 0-1.414ZM3.293 7.293a1 1 0 0 1 0 1.414L5.172 10.586a1 1 0 1 1-1.414 1.414L1.879 8.707a1 1 0 0 1 0-1.414 1 1 0 0 1 1.414 0ZM12.121 3.293a1 1 0 0 1 1.414 0l1.414 1.414a1 1 0 0 1-1.414 1.414L12.121 4.707a1 1 0 0 1 0-1.414ZM16.121 7.293a1 1 0 0 1 0 1.414l-1.879 1.879a1 1 0 1 1-1.414-1.414l1.879-1.879a1 1 0 0 1 1.414 0ZM10 4.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 10a1 1 0 0 1 1-1h1.5a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm13.5 0a1 1 0 0 1 1-1H17a1 1 0 1 1 0 2h-1.5a1 1 0 0 1-1-1ZM7.293 12.121a1 1 0 0 1 1.414 0l1.879 1.879a1 1 0 1 1-1.414 1.414l-1.879-1.879a1 1 0 0 1 0-1.414Zm5.414 0a1 1 0 0 1 1.414 0l1.879 1.879a1 1 0 1 1-1.414 1.414l-1.879-1.879a1 1 0 0 1 0-1.414Z" />
        </svg>
      )}
    </button>
  );
}
