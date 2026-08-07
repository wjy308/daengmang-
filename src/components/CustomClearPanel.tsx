"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { buildRoster } from "@/lib/roster";
import { DEFAULT_RAID_DEFINITIONS, type RaidDefinition, type RaidId } from "@/lib/raids";
import type { User } from "@/lib/types";
import { getRecommendedGoldRaidIds, userGoldPlan } from "@/lib/gold";
import type { GoldOverrides } from "@/lib/gold-overrides";
import RoleBadge from "@/components/ui/RoleBadge";
import MascotCursor from "@/components/ui/MascotCursor";

export interface PartyClearMember {
  userId: string;
  characterId: string;
}

type SelectedMember = PartyClearMember;

/**
 * 골드 수급 대상은 ★ 마커와 이름 글자색으로만 구분한다.
 * 배경·테두리까지 물들이면 명단이 번쩍여서 선택·클리어 상태가 오히려 안 보인다.
 */
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
      borderColor: "var(--danger-border)",
      background: "var(--danger-surface)",
      color: "var(--danger-text)",
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

export interface PartyClearSubmitPayload {
  raidId: RaidId;
  toMark: PartyClearMember[];
  toCancel: PartyClearMember[];
}

export default function CustomClearPanel({
  users,
  goldOverrides,
  raids = DEFAULT_RAID_DEFINITIONS,
  onPartyClearSubmit,
}: {
  users: User[];
  goldOverrides?: GoldOverrides;
  raids?: RaidDefinition[];
  onPartyClearSubmit: (payload: PartyClearSubmitPayload) => void;
}) {
  const [raidId, setRaidId] = useState<RaidId | null>(null);
  const [selected, setSelected] = useState<SelectedMember[]>([]);
  const [clearing, setClearing] = useState(false);
  const [mascotPos, setMascotPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  const roster = useMemo(() => buildRoster(users), [users]);
  const hasCharacters = roster.length > 0;

  const selectedCharacterIds = new Set(selected.map((s) => s.characterId));
  const selectedUserIds = new Set(selected.map((s) => s.userId));

  const usersWithChars = useMemo(
    () => users.filter((u) => u.characters.length > 0),
    [users],
  );

  const usersForRaid = useMemo(() => {
    if (!raidId) return [];

    return usersWithChars
      .map((user) => ({
        ...user,
        characters: user.characters.filter((character) =>
          character.assignedRaids.includes(raidId),
        ),
      }))
      .filter((user) => user.characters.length > 0);
  }, [raidId, usersWithChars]);

  /** 선택한 레이드에서 골드를 받아야 하는 캐릭 (유저별 골드 기준 반영) */
  const goldTargetCharacterIds = useMemo(() => {
    const ids = new Set<string>();
    if (!raidId) return ids;

    for (const user of usersWithChars) {
      for (const character of user.characters) {
        const recommended = getRecommendedGoldRaidIds(
          character,
          userGoldPlan(user),
          goldOverrides,
        );
        if (recommended.has(raidId)) ids.add(character.id);
      }
    }
    return ids;
  }, [raidId, usersWithChars, goldOverrides]);

  const isAlreadyCleared = useCallback(
    (m: SelectedMember) => {
      if (!raidId) return false;
      const entry = roster.find((e) => e.character.id === m.characterId);
      return entry?.character.clearedRaids.includes(raidId) ?? false;
    },
    [raidId, roster],
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

    const toCancel = selected.filter(isAlreadyCleared);
    const toMark = selected.filter((m) => !isAlreadyCleared(m));

    try {
      onPartyClearSubmit({ raidId, toMark, toCancel });
      setSelected([]);
    } finally {
      setClearing(false);
    }
  };

  const toCancelCount = raidId
    ? selected.filter(isAlreadyCleared).length
    : 0;
  const toMarkCount = selected.length - toCancelCount;
  const submitDisabled = !raidId || selected.length === 0 || clearing;
  /** 취소만 하는 경우 — 버튼 색과 커서가 취소 톤으로 바뀐다 */
  const cancelOnly = toCancelCount > 0 && toMarkCount === 0;

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
            {raids.map((raid) => (
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
            {raidId && goldTargetCharacterIds.size > 0 && (
              <span className="ml-2 font-normal text-accent-soft">
                ★ 골드 받아야 하는 캐릭
              </span>
            )}
          </p>

          {!raidId ? (
            <p className="rounded-lg border border-dashed border-dashed-border px-4 py-5 text-center text-sm text-muted lg:py-4 lg:text-xs">
              먼저 레이드를 선택해 주세요.
            </p>
          ) : usersForRaid.length === 0 ? (
            <p className="rounded-lg border border-dashed border-dashed-border px-4 py-5 text-center text-sm text-muted lg:py-4 lg:text-xs">
              이 레이드에 배정된 캐릭터가 없어요.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {usersForRaid.map((user) => (
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
                      const isGoldTarget = goldTargetCharacterIds.has(
                        character.id,
                      );

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
                          title={isGoldTarget ? "골드 수급 레이드" : undefined}
                          className="flex items-center gap-1 rounded-md border px-2 py-1.5 text-left text-xs transition hover:border-border-strong disabled:cursor-not-allowed lg:py-1 lg:text-[11px]"
                        >
                          <RoleBadge role={character.role} />
                          {isGoldTarget && (
                            <span className="shrink-0 text-accent">★</span>
                          )}
                          <span
                            className={`truncate ${
                              isGoldTarget
                                ? "font-semibold text-accent-soft"
                                : ""
                            }`}
                          >
                            {character.name}
                          </span>
                          {alreadyCleared && (
                            <span
                              className="ml-auto text-[10px]"
                              style={{
                                color: isSelected
                                  ? "var(--danger-text)"
                                  : "var(--success-text)",
                              }}
                            >
                              {isSelected ? "취소" : "✓"}
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
          disabled={submitDisabled}
          onMouseEnter={(e) => {
            if (submitDisabled) return;
            setMascotPos({ x: e.clientX, y: e.clientY });
          }}
          onMouseLeave={() => setMascotPos(null)}
          className={`w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-8 lg:py-2 lg:text-xs ${
            // 누를 수 있을 때만 OS 커서를 감추고 마스코트로 대체 (비활성일 땐 not-allowed 유지)
            submitDisabled ? "" : "cursor-none"
          }`}
          style={{
            borderColor: cancelOnly
              ? "var(--danger-border)"
              : "var(--success-border)",
            background: cancelOnly
              ? "var(--danger-surface)"
              : "var(--success-surface)",
            color: cancelOnly ? "var(--danger-text)" : "var(--success-text)",
          }}
        >
          {clearing
            ? "저장 중…"
            : toMarkCount > 0 && toCancelCount > 0
              ? `${toMarkCount}명 클리어 · ${toCancelCount}명 취소`
              : toMarkCount > 0
                ? `${toMarkCount}명 클리어 체크`
                : toCancelCount > 0
                  ? `${toCancelCount}명 클리어 취소`
                  : "캐릭을 선택해 주세요"}
        </button>
      </div>

      <MascotCursor
        pos={submitDisabled ? null : mascotPos}
        variant={cancelOnly ? "mascot-cursor-run" : "mascot-cursor-lets-go"}
      />
    </section>
  );
}
