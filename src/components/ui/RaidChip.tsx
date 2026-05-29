export default function RaidChip({
  label,
  noGold,
}: {
  label: string;
  noGold?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
        noGold
          ? "border border-stone-600 bg-stone-800/80 text-stone-400"
          : "bg-accent/20 text-accent-soft"
      }`}
    >
      {noGold && <span className="mr-1 opacity-60">무골</span>}
      {label}
    </span>
  );
}
