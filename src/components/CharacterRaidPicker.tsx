"use client";

import type { RaidId } from "@/lib/raids";
import { getRaid, RAID_GROUPS, raidsByGroup } from "@/lib/raids";
import type { Character } from "@/lib/types";

function RaidRow({
  id,
  label,
  assigned,
  noGold,
  cleared,
  onToggleAssigned,
  onToggleNoGold,
}: {
  id: string;
  label: string;
  assigned: boolean;
  noGold: boolean;
  cleared: boolean;
  onToggleAssigned: () => void;
  onToggleNoGold: () => void;
}) {
  return (
    <div
      className="flex min-h-8 items-center gap-2 rounded-md px-2 py-1"
      style={
        cleared
          ? {
              background: "var(--success-surface)",
              boxShadow: "inset 0 0 0 1px var(--success-border)",
            }
          : { background: "var(--surface-muted)" }
      }
    >
      <label
        htmlFor={id}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
      >
        <input
          id={id}
          type="checkbox"
          checked={assigned}
          onChange={onToggleAssigned}
          className="size-3.5 shrink-0 rounded accent-[var(--accent)]"
        />
        <span className="truncate text-xs font-medium leading-none">{label}</span>
      </label>
      {cleared && (
        <span
          className="shrink-0 text-[10px] font-medium"
          style={{ color: "var(--success-text)" }}
        >
          ✓
        </span>
      )}
      <label
        className={`flex shrink-0 items-center gap-1 text-[10px] leading-none ${
          assigned ? "cursor-pointer text-muted" : "cursor-not-allowed opacity-30"
        }`}
      >
        <input
          type="checkbox"
          checked={noGold}
          disabled={!assigned}
          onChange={onToggleNoGold}
          className="size-3 rounded accent-[var(--accent)]"
        />
        무골
      </label>
    </div>
  );
}

export default function CharacterRaidPicker({
  character,
  userId,
  onToggleRaid,
  onToggleNoGold,
}: {
  character: Character;
  userId: string;
  onToggleRaid: (userId: string, characterId: string, raidId: RaidId) => void;
  onToggleNoGold: (
    userId: string,
    characterId: string,
    raidId: RaidId,
  ) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {RAID_GROUPS.map((group) => (
        <div
          key={group}
          className="rounded-lg border border-border bg-card p-2.5"
        >
          <h5 className="mb-2 border-b border-border pb-1.5 text-[10px] font-semibold text-accent-soft">
            {group}
          </h5>
          <div className="space-y-1">
            {raidsByGroup(group).map((raid) => {
              const assigned = character.assignedRaids.includes(raid.id);
              const noGold = character.noGoldRaids.includes(raid.id);
              const cleared = character.clearedRaids.includes(raid.id);

              return (
                <RaidRow
                  key={raid.id}
                  id={`char-${character.id}-${raid.id}`}
                  label={getRaid(raid.id).label.replace(`${group} · `, "")}
                  assigned={assigned}
                  noGold={noGold}
                  cleared={cleared}
                  onToggleAssigned={() =>
                    onToggleRaid(userId, character.id, raid.id)
                  }
                  onToggleNoGold={() =>
                    onToggleNoGold(userId, character.id, raid.id)
                  }
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
