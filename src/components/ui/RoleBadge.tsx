import type { CharacterRole } from "@/lib/types";
import { ROLE_LABEL } from "@/lib/types";

export default function RoleBadge({ role }: { role: CharacterRole }) {
  const isSupport = role === "support";
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        isSupport
          ? "bg-sky-500/20 text-sky-300"
          : "bg-rose-500/20 text-rose-300"
      }`}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
