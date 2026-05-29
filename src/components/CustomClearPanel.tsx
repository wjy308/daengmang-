"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { buildRoster } from "@/lib/roster";
import { RAID_DEFINITIONS, type RaidId } from "@/lib/raids";
import type { User } from "@/lib/types";
import RoleBadge from "@/components/ui/RoleBadge";

interface SelectedMember {
  userId: string;
  characterId: string;
}

function charButtonStyle(
  isSelected: boolean,
  alreadyCleared: boolean,
  blockedByUser: boolean,
): CSSProperties {
  if (blockedByUser) {
    return { borderColor: "var(--border)", background: "var(--card)", opacity: 0.35 };
  }
  if (alreadyCleared && isSelected) {
    return {
      borderColor: "var(--success-border)",
      background: "var(--success-surface)",
      color: "var(--success-text)",
    };
  }
  if (alreadyCleared) {
    return {
      borderColor: "var(--success-border)",
      background: "var(--chip-cleared-bg)",
      color: "var(--chip-cleared-text)",
      opacity: 0.85,
    };
  }
  if (isSelected) {
    return {
      borderColor: "var(--accent)",
      background: "var(--chip-gold-bg)",
      color: "var(--accent-soft)",
    };
  }
  return {
    borderColor: "var(--border)",
    background: "var(--card)",
  };
}

export default function CustomClearPanel({
  users,
  onMarkPartyCleared,
}: {
  users: User[];
  onMarkPartyCleared: (
    raidId: RaidId,
    members: { userId: string; characterId: string }[],
  ) => void;
}) {
  const [raidId, setRaidId] = useState<RaidId | null>(null);
  const [selected, setSelected] = useState<SelectedMember[]>([]);
  const [clearing, setClearing] = useState(false);

  const roster = useMemo(() => buildRoster(users), [users]);
  const hasCharacters = roster.length > 0;

  const selectedCharacterIds = new Set(selected.map((s) => s.characterId));
  const selectedUserIds = new Set(selected.map((s) => s.userId));

  const usersWithChars = useMemo(
    () => users.filter((u) => u.characters.length > 0),
    [users],
  );

  const toggleCharacter = (userId: string, characterId: string) => {
    if (selectedCharacterIds.has(characterId)) {
      setSelected((prev) => prev.filter((s) => s.characterId !== characterId));
      return;
    }
    setSelected((prev) => [
      ...prev.filter((s) => s.userId !== userId),
      { userId, characterId },
    ]);
  };

  const handleRaidChange = (nextRaidId: RaidId) => {
    setRaidId(nextRaidId);
    setSelected([]);
  };

  const handleSubmit = () => {
    if (!raidId || selected.length === 0) return;
    setClearing(true);
    try {
      onMarkPartyCleared(raidId, selected);
      setSelected([]);
    } finally {
      setClearing(false);
    }
  };

  const pendingCount = selected.filter((member) => {
    const entry = roster.find((e) => e.character.id === member.characterId);
    return !entry?.character.clearedRaids.includes(raidId!);
  }).length;

  if (!hasCharacters) return null;

  return (
    <section className="rounded-xl border border-border bg-surface-muted p-4 lg:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-semibold tracking-tight">직접 클리어 체크</h3>
          <p className="mt-0.5 text-sm text-muted lg:text-xs">
            공팟·2인팟 등 자유 조합. 레이드와 같이 간 캐릭만 골라 체크.
          </p>
        </div>
        {raidId && selected.length > 0 && (
          <div className="rounded-lg border border-border bg-card px-3 py-2 lg:max-w-md lg:shrink-0">
            <p className="text-[10px] text-muted">선택</p>
            <p className="mt-0.5 text-xs lg:text-sm">
              {selected
                .map((member) => {
                  const entry = roster.find(
                    (e) => e.character.id === member.characterId,
                  );
                  return entry
                    ? `${entry.userNickname}/${entry.character.name}`
                    : "";
                })
                .filter(Boolean)
                .join(" · ")}
              <span className="ml-1 text-muted">({selected.length}명)</span>
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] lg:items-start lg:gap-6 lg:space-y-0">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted">
            1. 레이드
          </p>
          <div className="flex flex-wrap gap-1.5 lg:gap-1.5">
            {RAID_DEFINITIONS.map((raid) => (
              <button
                key={raid.id}
                type="button"
                onClick={() => handleRaidChange(raid.id)}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] transition lg:text-[10px] ${
                  raidId === raid.id
                    ? "border-accent bg-[var(--chip-gold-bg)] text-accent-soft"
                    : "border-border bg-card text-muted hover:border-border-strong"
                }`}
              >
                {raid.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted">
            2. 같이 간 캐릭
            {raidId && (
              <span className="ml-2 font-normal text-muted-subtle">
                (인원당 1캐릭)
              </span>
            )}
          </p>

          {!raidId ? (
            <p className="rounded-lg border border-dashed border-dashed-border px-4 py-5 text-center text-sm text-muted lg:py-4 lg:text-xs">
              먼저 레이드를 선택해 주세요.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {usersWithChars.map((user) => (
                <div
                  key={user.id}
                  className="rounded-lg border border-border bg-card p-2.5 lg:p-2"
                >
                  <p className="mb-1.5 truncate text-[13px] font-medium lg:text-xs">
                    {user.nickname}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {user.characters.map((character) => {
                      const isSelected = selectedCharacterIds.has(character.id);
                      const alreadyCleared =
                        character.clearedRaids.includes(raidId);
                      const blockedByUser =
                        selectedUserIds.has(user.id) && !isSelected;

                      return (
                        <button
                          key={character.id}
                          type="button"
                          disabled={blockedByUser}
                          onClick={() =>
                            toggleCharacter(user.id, character.id)
                          }
                          style={charButtonStyle(
                            isSelected,
                            alreadyCleared,
                            blockedByUser,
                          )}
                          className="flex items-center gap-1 rounded-md border px-2 py-1.5 text-left text-xs transition hover:border-border-strong disabled:cursor-not-allowed lg:py-1 lg:text-[11px]"
                        >
                          <RoleBadge role={character.role} />
                          <span className="truncate">{character.name}</span>
                          {alreadyCleared && (
                            <span
                              className="ml-auto text-[10px]"
                              style={{ color: "var(--success-text)" }}
                            >
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end lg:mt-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!raidId || selected.length === 0 || clearing}
          className="w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-8 lg:py-2 lg:text-xs"
          style={{
            borderColor: "var(--success-border)",
            background: "var(--success-surface)",
            color: "var(--success-text)",
          }}
        >
          {clearing
            ? "저장 중…"
            : pendingCount === 0 && selected.length > 0
              ? "선택 캐릭 모두 클리어 됨"
              : selected.length > 0
                ? `${selected.length}명 클리어 체크`
                : "캐릭을 선택해 주세요"}
        </button>
      </div>
    </section>
  );
}
