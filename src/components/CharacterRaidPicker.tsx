"use client";

import type { RaidId } from "@/lib/raids";
import { getRaid, RAID_GROUPS, raidsByGroup } from "@/lib/raids";
import type { Character } from "@/lib/types";

function MiniToggle({
  id,
  label,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] leading-none ${
        disabled
          ? "cursor-not-allowed border-border/60 opacity-40"
          : checked
            ? "cursor-pointer border-accent/40 bg-[var(--chip-gold-bg)] text-accent-soft"
            : "cursor-pointer border-border bg-card text-muted hover:border-border-strong"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="size-2.5 shrink-0 rounded accent-[var(--accent)]"
      />
      {label}
    </label>
  );
}

function RaidRow({
  id,
  label,
  assigned,
  noGold,
  bonus,
  cleared,
  onToggleAssigned,
  onToggleNoGold,
  onToggleBonus,
}: {
  id: string;
  label: string;
  assigned: boolean;
  noGold: boolean;
  bonus: boolean;
  cleared: boolean;
  onToggleAssigned: () => void;
  onToggleNoGold: () => void;
  onToggleBonus: () => void;
}) {
  return (
    <div
      className="min-w-0 overflow-hidden rounded-md px-2 py-1.5"
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
        className="flex min-w-0 cursor-pointer items-center gap-2"
      >
        <input
          id={id}
          type="checkbox"
          checked={assigned}
          onChange={onToggleAssigned}
          className="size-3.5 shrink-0 rounded accent-[var(--accent)]"
        />
        <span className="min-w-0 flex-1 truncate text-xs font-medium leading-snug">
          {label}
        </span>
        {cleared && (
          <span
            className="shrink-0 text-[10px] font-medium"
            style={{ color: "var(--success-text)" }}
          >
            ✓
          </span>
        )}
      </label>

      <div className="mt-1.5 flex flex-wrap gap-1 pl-5">
        <MiniToggle
          id={`${id}-nogold`}
          label="무골"
          checked={noGold}
          disabled={!assigned}
          onChange={onToggleNoGold}
        />
        <MiniToggle
          id={`${id}-bonus`}
          label="더보기"
          checked={bonus}
          disabled={!assigned || noGold}
          onChange={onToggleBonus}
        />
      </div>
    </div>
  );
}

export default function CharacterRaidPicker({
  character,
  userId,
  onToggleRaid,
  onToggleNoGold,
  onToggleBonus,
}: {
  character: Character;
  userId: string;
  onToggleRaid: (userId: string, characterId: string, raidId: RaidId) => void;
  onToggleNoGold: (
    userId: string,
    characterId: string,
    raidId: RaidId,
  ) => void;
  onToggleBonus: (
    userId: string,
    characterId: string,
    raidId: RaidId,
  ) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {RAID_GROUPS.map((group) => (
        <div
          key={group}
          className="min-w-0 rounded-lg border border-border bg-card p-2"
        >
          <h5 className="mb-1.5 border-b border-border pb-1 text-[10px] font-semibold text-accent-soft">
            {group}
          </h5>
          <div className="space-y-1">
            {raidsByGroup(group).map((raid) => {
              const assigned = character.assignedRaids.includes(raid.id);
              const noGold = character.noGoldRaids.includes(raid.id);
              const bonus = character.bonusRaids.includes(raid.id);
              const cleared = character.clearedRaids.includes(raid.id);

              return (
                <RaidRow
                  key={raid.id}
                  id={`char-${character.id}-${raid.id}`}
                  label={getRaid(raid.id).label.replace(`${group} · `, "")}
                  assigned={assigned}
                  noGold={noGold}
                  bonus={bonus}
                  cleared={cleared}
                  onToggleAssigned={() =>
                    onToggleRaid(userId, character.id, raid.id)
                  }
                  onToggleNoGold={() =>
                    onToggleNoGold(userId, character.id, raid.id)
                  }
                  onToggleBonus={() =>
                    onToggleBonus(userId, character.id, raid.id)
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
