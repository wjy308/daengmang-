export default function RaidChip({
  label,
  noGold,
  bonus,
  cleared,
  recommended,
  stretch = false,
}: {
  label: string;
  noGold?: boolean;
  bonus?: boolean;
  cleared?: boolean;
  /** 유저 골드 설정 기준으로 골드를 받아야 하는 레이드 */
  recommended?: boolean;
  /** 칸 폭을 꽉 채우고 넘치는 이름은 말줄임 (세로로 쌓을 때) */
  stretch?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium leading-snug ${
        stretch ? "w-full min-w-0" : ""
      } ${
        cleared
          ? "border line-through decoration-[var(--chip-cleared-text)]/50"
          : noGold || recommended
            ? "border"
            : ""
      }`}
      style={{
        ...(cleared
          ? {
              background: "var(--chip-cleared-bg)",
              borderColor: "var(--chip-cleared-border)",
              color: "var(--chip-cleared-text)",
            }
          : noGold
            ? {
                background: "var(--chip-muted-bg)",
                borderColor: "var(--border)",
                color: "var(--chip-muted-text)",
              }
            : {
                background: "var(--chip-gold-bg)",
                color: "var(--accent-soft)",
              }),
        // 클리어한 레이드는 초록 테두리를 유지한다 — 골드 표시가 클리어 상태를 덮지 않게
        ...(recommended && !cleared
          ? {
              borderColor: "color-mix(in srgb, var(--accent) 60%, transparent)",
            }
          : null),
      }}
      title={recommended ? `${label} — 골드 수급 레이드` : label}
    >
      {cleared && <span className="no-underline">✓</span>}
      {recommended && !cleared && (
        <span className="no-underline text-accent">★</span>
      )}
      {noGold && !cleared && (
        <span className="shrink-0 opacity-70">무골</span>
      )}
      {bonus && <span className="shrink-0 opacity-70">더보기</span>}
      <span className={stretch ? "min-w-0 truncate" : ""}>{label}</span>
    </span>
  );
}
