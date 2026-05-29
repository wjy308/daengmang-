import type { CharacterRole } from "@/lib/types";
import { ROLE_LABEL } from "@/lib/types";

export default function RoleBadge({ role }: { role: CharacterRole }) {
  const isSupport = role === "support";
  return (
    <span
      className="inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
      style={{
        background: isSupport ? "var(--support-bg)" : "var(--dealer-bg)",
        color: isSupport ? "var(--support-text)" : "var(--dealer-text)",
      }}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
