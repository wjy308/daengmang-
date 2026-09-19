"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { listCharacterRaids } from "@/lib/character-raids";
import type { CharacterRole, GoldPriority, User } from "@/lib/types";
import { GOLD_PRIORITY_HINT, GOLD_PRIORITY_LABEL, ROLE_LABEL } from "@/lib/types";
import {
  getGoldTieGroups,
  getRecommendedGoldRaidIds,
  userGoldPlan,
  type GoldPlan,
} from "@/lib/gold";
import type { GoldOverrides } from "@/lib/gold-overrides";
import { useDragReorder } from "@/hooks/useDragReorder";
import CharacterRaidPicker from "@/components/CharacterRaidPicker";
import DraggableReorderRow from "@/components/DraggableReorderRow";
import ReorderableRaidChips from "@/components/ReorderableRaidChips";
import RoleBadge from "@/components/ui/RoleBadge";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel";
import SmallDialog from "@/components/ui/SmallDialog";
import { DEFAULT_RAID_DEFINITIONS, type RaidDefinition, type RaidId } from "@/lib/raids";

const inputClass =
  "w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-sm outline-none focus:border-accent";

interface RaidManagerProps {
  users: User[];
  selectedUser: User | null;
  highlightCharacterId: string | null;
  goldOverrides?: GoldOverrides;
  raids?: RaidDefinition[];
  onSelectUser: (userId: string) => void;
  onAddUser: (nickname: string) => void;
  onRemoveUser: (userId: string) => void;
  onSetUserGoldPriority: (userId: string, priority: GoldPriority) => void;
  onAddCharacter: (userId: string, name: string, role: CharacterRole) => void;
  onSetCharacterRole: (
    userId: string,
    characterId: string,
    role: CharacterRole,
  ) => void;
  onRemoveCharacter: (userId: string, characterId: string) => void;
  onToggleCharacterRaid: (
    userId: string,
    characterId: string,
    raidId: RaidId,
  ) => void;
  onToggleCharacterNoGold: (
    userId: string,
    characterId: string,
    raidId: RaidId,
  ) => void;
  onToggleCharacterBonus: (
    userId: string,
    characterId: string,
    raidId: RaidId,
  ) => void;
  onReorderCharacters: (userId: string, characterIds: string[]) => void;
  onReorderCharacterRaids: (
    userId: string,
    characterId: string,
    raidIds: RaidId[],
  ) => void;
  userNickname: string;
  onUserNicknameChange: (value: string) => void;
}

export default function RaidManager({
  users,
  selectedUser,
  highlightCharacterId,
  goldOverrides,
  raids = DEFAULT_RAID_DEFINITIONS,
  onSelectUser,
  onAddUser,
  onRemoveUser,
  onSetUserGoldPriority,
  onAddCharacter,
  onSetCharacterRole,
  onRemoveCharacter,
  onToggleCharacterRaid,
  onToggleCharacterNoGold,
  onToggleCharacterBonus,
  onReorderCharacters,
  onReorderCharacterRaids,
  userNickname,
  onUserNicknameChange,
}: RaidManagerProps) {
  const highlightRef = useRef<HTMLDivElement>(null);
  const characterDrag = useDragReorder<string>();
  const [isOpen, setIsOpen] = useState(false);
  const [addCharacterOpen, setAddCharacterOpen] = useState(false);

  // selectedUser가 없으면 아래 블록 자체가 렌더되지 않으므로 기본값은 쓰이지 않는다
  const goldPlan: GoldPlan = selectedUser
    ? userGoldPlan(selectedUser)
    : { priority: "total", tiePreference: [] };

  useEffect(() => {
    if (highlightCharacterId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [highlightCharacterId, selectedUser?.id]);

  const handleAddUser = (e: FormEvent) => {
    e.preventDefault();
    onAddUser(userNickname);
    onUserNicknameChange("");
  };

  return (
    <section id="manage" className="space-y-6 border-t border-border pt-8 lg:space-y-5 lg:pt-6">
      <CollapsiblePanel
        title="관리"
        subtitle="유저 · 캐릭터 추가 및 레이드 설정"
        open={isOpen}
        onToggle={() => setIsOpen((v) => !v)}
      >
        <div className="space-y-4 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
              유저
            </h3>

            <form onSubmit={handleAddUser} className="space-y-2">
              <input
                type="text"
                value={userNickname}
                onChange={(e) => onUserNicknameChange(e.target.value)}
                placeholder="닉네임 입력"
                className={inputClass}
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-accent py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90"
              >
                유저 추가
              </button>
            </form>

            {users.length > 0 && (
              <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1.5">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => onSelectUser(user.id)}
                    className={`group flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition lg:w-full lg:justify-between lg:rounded-lg lg:px-3 lg:py-2 lg:text-left ${
                      selectedUser?.id === user.id
                        ? "border-accent bg-[var(--chip-gold-bg)] text-accent-soft"
                        : "border-border bg-card hover:border-border-strong"
                    }`}
                  >
                    <span className="truncate">{user.nickname}</span>
                    <span className="hidden text-[10px] text-muted lg:inline">
                      {user.characters.length}캐릭
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`"${user.nickname}" 유저를 삭제할까요?`)) {
                          onRemoveUser(user.id);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          if (confirm(`"${user.nickname}" 유저를 삭제할까요?`)) {
                            onRemoveUser(user.id);
                          }
                        }
                      }}
                      className="ml-1 hidden text-muted-subtle hover:text-[var(--danger-text)] group-hover:inline"
                    >
                      ×
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-0">
            {selectedUser && (
              <div className="space-y-4">
                {/*
                  제목 줄에 골드 기준·캐릭터 추가를 작게 모은다.
                  예전엔 둘 다 오른쪽 폭 전체로 펼쳐져 있어 사소한 설정이 제일 커 보였다.
                */}
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <h3 className="text-sm font-semibold tracking-wide text-muted">
                    {selectedUser.nickname} · 캐릭터
                    <span className="ml-1.5 font-normal text-muted-subtle">
                      {selectedUser.characters.length}
                    </span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted">골드 기준</span>
                      <div
                        role="radiogroup"
                        aria-label="골드 수급 기준"
                        className="flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5"
                      >
                        {(["total", "normal"] as const).map((priority) => {
                          const active = selectedUser.goldPriority === priority;
                          return (
                            <button
                              key={priority}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              title={GOLD_PRIORITY_HINT[priority]}
                              onClick={() =>
                                onSetUserGoldPriority(selectedUser.id, priority)
                              }
                              className={`rounded-md px-2 py-1 text-[11px] transition ${
                                active
                                  ? "bg-[var(--chip-muted-bg)] font-semibold text-foreground"
                                  : "text-muted hover:text-foreground"
                              }`}
                            >
                              {GOLD_PRIORITY_LABEL[priority]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddCharacterOpen(true)}
                      className="rounded-lg border border-accent/50 bg-[var(--chip-gold-bg)] px-3 py-1.5 text-xs font-semibold text-accent-soft transition hover:border-accent"
                    >
                      + 캐릭터 추가
                    </button>
                  </div>
                </div>
                <p className="-mt-2 text-[11px] text-muted-subtle">
                  {GOLD_PRIORITY_HINT[selectedUser.goldPriority]} · 캐릭당 골드는 레이드
                  3개까지, 기준을 바꾸면 ★와 무골 체크가 같이 바뀌어요 (레이드 배정은
                  그대로)
                  {selectedUser.characters.length > 1 && " · ⠿ 드래그로 캐릭터 순서 변경"}
                </p>

              <div>

                {selectedUser.characters.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setAddCharacterOpen(true)}
                    className="w-full rounded-lg border border-dashed border-dashed-border py-8 text-center text-sm text-muted transition hover:border-border-strong hover:text-foreground"
                  >
                    + 캐릭터를 추가해 주세요
                  </button>
                ) : (
                  <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 xl:grid-cols-2">
                    {selectedUser.characters.map((character, index) => {
                      const sortedRaids = listCharacterRaids(character);
                      const highlighted = highlightCharacterId === character.id;
                      const characterIds = selectedUser.characters.map(
                        (c) => c.id,
                      );

                      return (
                        <DraggableReorderRow
                          key={character.id}
                          index={index}
                          itemIds={characterIds}
                          label="캐릭터 순서 변경"
                          drag={characterDrag}
                          onReorder={(nextIds) =>
                            onReorderCharacters(selectedUser.id, nextIds)
                          }
                        >
                          <article
                            ref={highlighted ? highlightRef : undefined}
                            className={`rounded-xl border bg-surface p-4 transition lg:p-3 ${
                              highlighted
                                ? "border-accent ring-1 ring-accent/30"
                                : "border-border"
                            }`}
                          >
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-medium">
                                    {character.name}
                                  </h4>
                                  <RoleBadge role={character.role} />
                                  <div className="flex gap-1">
                                    {(["dealer", "support"] as const).map(
                                      (role) => (
                                        <button
                                          key={role}
                                          type="button"
                                          onClick={() =>
                                            onSetCharacterRole(
                                              selectedUser.id,
                                              character.id,
                                              role,
                                            )
                                          }
                                          className={`rounded px-2 py-0.5 text-[10px] transition ${
                                            character.role === role
                                              ? "bg-[var(--chip-muted-bg)] text-foreground"
                                              : "text-muted-subtle hover:text-muted"
                                          }`}
                                        >
                                          {ROLE_LABEL[role]}
                                        </button>
                                      ),
                                    )}
                                  </div>
                                </div>
                                {sortedRaids.length > 0 && (
                                  <ReorderableRaidChips
                                    userId={selectedUser.id}
                                    characterId={character.id}
                                    character={character}
                                    recommendedRaidIds={getRecommendedGoldRaidIds(
                                      character,
                                      goldPlan,
                                      goldOverrides,
                                    )}
                                    onReorder={onReorderCharacterRaids}
                                    className="mt-2"
                                  />
                                )}
                                {getGoldTieGroups(
                                  character,
                                  goldPlan,
                                  goldOverrides,
                                ).map((group) => (
                                  <p
                                    key={group.map((r) => r.raidId).join("|")}
                                    className="mt-1.5 text-[11px] text-muted"
                                  >
                                    ⇄ {group.map((r) => r.label).join(" = ")}{" "}
                                    골드가 같아요 — 편한 쪽으로 가면 돼요
                                  </p>
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `"${character.name}" 캐릭터를 삭제할까요?`,
                                    )
                                  ) {
                                    onRemoveCharacter(
                                      selectedUser.id,
                                      character.id,
                                    );
                                  }
                                }}
                                className="shrink-0 text-xs text-muted-subtle hover:text-[var(--danger-text)]"
                              >
                                삭제
                              </button>
                            </div>

                            <div className="border-t border-border pt-3">
                              <p className="mb-2 text-[10px] font-medium text-muted-subtle">
                                레이드 배정
                              </p>
                              <CharacterRaidPicker
                                character={character}
                                userId={selectedUser.id}
                                raids={raids}
                                onToggleRaid={onToggleCharacterRaid}
                                onToggleNoGold={onToggleCharacterNoGold}
                                onToggleBonus={onToggleCharacterBonus}
                              />
                            </div>
                          </article>
                        </DraggableReorderRow>
                      );
                    })}
                  </div>
                )}
                {selectedUser.characters.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAddCharacterOpen(true)}
                    aria-label="캐릭터 추가"
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-dashed-border py-3 text-sm text-muted transition hover:border-border-strong hover:text-foreground"
                  >
                    <span className="text-lg leading-none">+</span>
                    <span className="text-xs">캐릭터 추가</span>
                  </button>
                )}
              </div>
              </div>
            )}
            {selectedUser && addCharacterOpen && (
              <AddCharacterDialog
                nickname={selectedUser.nickname}
                onAdd={(name, role) => onAddCharacter(selectedUser.id, name, role)}
                onClose={() => setAddCharacterOpen(false)}
              />
            )}
          </div>
        </div>
      </CollapsiblePanel>
    </section>
  );
}

/**
 * 캐릭터 이름·역할을 받는 작은 다이얼로그.
 * 새 유저는 캐릭터를 여러 개 한 번에 넣으므로, 추가해도 닫지 않고 이름만 비워 이어서 받는다.
 */
function AddCharacterDialog({
  nickname,
  onAdd,
  onClose,
}: {
  nickname: string;
  onAdd: (name: string, role: CharacterRole) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<CharacterRole>("dealer");
  const [added, setAdded] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, role);
    setAdded((prev) => [...prev, trimmed]);
    setName("");
    inputRef.current?.focus();
  };

  return (
    <SmallDialog title={`${nickname} · 캐릭터 추가`} onClose={onClose} onSubmit={submit}>
      <input
        ref={inputRef}
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="캐릭터 이름"
        className={`${inputClass} mt-3`}
      />
      <div className="mt-2 flex gap-1.5">
        {(["dealer", "support"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            aria-pressed={role === r}
            className={`flex-1 rounded-lg border py-1.5 text-xs transition ${
              role === r
                ? "border-border-strong bg-[var(--chip-muted-bg)] font-semibold text-foreground"
                : "border-border bg-card text-muted hover:border-border-strong"
            }`}
          >
            {ROLE_LABEL[r]}
          </button>
        ))}
      </div>
      {added.length > 0 && (
        <p className="mt-2 text-[11px] text-[var(--success-text)]">
          ✓ {added.join(", ")} 추가됨 — 이어서 입력하거나 닫으세요
        </p>
      )}
      <div className="mt-3 flex justify-end gap-1.5">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted transition hover:border-border-strong hover:text-foreground"
        >
          {added.length > 0 ? "완료" : "취소"}
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-lg border border-accent/50 bg-[var(--chip-gold-bg)] px-3 py-1.5 text-xs font-semibold text-accent-soft transition hover:border-accent disabled:opacity-40"
        >
          추가
        </button>
      </div>
    </SmallDialog>
  );
}
