export default function RaidChip({
  label,
  noGold,
  cleared,
}: {
  label: string;
  noGold?: boolean;
  cleared?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium leading-snug ${
        cleared
          ? "border line-through decoration-[var(--chip-cleared-text)]/50"
          : noGold
            ? "border"
            : ""
      }`}
      style={
        cleared
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
              }
      }
    >
      {cleared && <span className="no-underline">✓</span>}
      {noGold && !cleared && <span className="opacity-70">무골</span>}
      {label}
    </span>
  );
}
