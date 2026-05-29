"use client";

import { FormEvent, useEffect, useRef } from "react";
import { listCharacterRaids } from "@/lib/character-raids";
import type { CharacterRole, User } from "@/lib/types";
import { ROLE_LABEL } from "@/lib/types";
import { useDragReorder } from "@/hooks/useDragReorder";
import CharacterRaidPicker from "@/components/CharacterRaidPicker";
import DraggableCharacterRow from "@/components/DraggableCharacterRow";
import ReorderableRaidChips from "@/components/ReorderableRaidChips";
import RoleBadge from "@/components/ui/RoleBadge";
import type { RaidId } from "@/lib/raids";

const inputClass =
  "w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-sm outline-none focus:border-accent";

interface RaidManagerProps {
  users: User[];
  selectedUser: User | null;
  highlightCharacterId: string | null;
  onSelectUser: (userId: string) => void;
  onAddUser: (nickname: string) => void;
  onRemoveUser: (userId: string) => void;
  onAddCharacter: (userId: string, name: string, role: CharacterRole) => void;
  onSetCharacterRole: (
    userId: string,
    characterId: string,
    role: CharacterRole,
  ) => void;
  charRole: CharacterRole;
  onCharRoleChange: (role: CharacterRole) => void;
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
  onReorderCharacters: (userId: string, characterIds: string[]) => void;
  onReorderCharacterRaids: (
    userId: string,
    characterId: string,
    raidIds: RaidId[],
  ) => void;
  userNickname: string;
  onUserNicknameChange: (value: string) => void;
  charName: string;
  onCharNameChange: (value: string) => void;
}

export default function RaidManager({
  users,
  selectedUser,
  highlightCharacterId,
  onSelectUser,
  onAddUser,
  onRemoveUser,
  onAddCharacter,
  onSetCharacterRole,
  charRole,
  onCharRoleChange,
  onRemoveCharacter,
  onToggleCharacterRaid,
  onToggleCharacterNoGold,
  onReorderCharacters,
  onReorderCharacterRaids,
  userNickname,
  onUserNicknameChange,
  charName,
  onCharNameChange,
}: RaidManagerProps) {
  const highlightRef = useRef<HTMLDivElement>(null);
  const characterDrag = useDragReorder<string>();

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

  const handleAddCharacter = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    onAddCharacter(selectedUser.id, charName, charRole);
    onCharNameChange("");
  };

  return (
    <section id="manage" className="space-y-6 border-t border-border pt-8 lg:space-y-5 lg:pt-6">
      <div>
        <h2 className="text-lg font-semibold lg:text-xl">관리</h2>
        <p className="mt-0.5 text-sm text-muted">
          유저 · 캐릭터 추가 및 레이드 설정
        </p>
      </div>

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
            <div className="space-y-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                {selectedUser.nickname} · 캐릭터
              </h3>

              <form
                onSubmit={handleAddCharacter}
                className="rounded-xl border border-border bg-surface-muted p-3"
              >
                <p className="mb-2 text-xs font-medium text-muted">캐릭터 추가</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={charName}
                    onChange={(e) => onCharNameChange(e.target.value)}
                    placeholder="캐릭터 이름"
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-border bg-card py-1.5 text-sm font-medium transition hover:border-border-strong"
                  >
                    캐릭 추가
                  </button>
                  <div className="flex gap-2">
                    {(["dealer", "support"] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => onCharRoleChange(role)}
                        className={`flex-1 rounded-lg border py-1.5 text-sm transition ${
                          charRole === role
                            ? "border-accent bg-[var(--chip-gold-bg)] text-accent-soft"
                            : "border-border bg-card text-muted hover:border-border-strong"
                        }`}
                      >
                        {ROLE_LABEL[role]}
                      </button>
                    ))}
                  </div>
                </div>
              </form>

              <div className="border-t border-border pt-5">
                <p className="mb-3 text-xs font-medium text-muted">
                  등록된 캐릭터
                  {selectedUser.characters.length > 0 && (
                    <span className="ml-1 text-muted-subtle">
                      · ⠿ 드래그로 순서 변경
                    </span>
                  )}
                </p>

                {selectedUser.characters.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-dashed-border py-8 text-center text-sm text-muted">
                    캐릭터를 추가해 주세요.
                  </p>
                ) : (
                  <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 xl:grid-cols-2">
                    {selectedUser.characters.map((character, index) => {
                      const sortedRaids = listCharacterRaids(character);
                      const highlighted = highlightCharacterId === character.id;
                      const characterIds = selectedUser.characters.map(
                        (c) => c.id,
                      );

                      return (
                        <DraggableCharacterRow
                          key={character.id}
                          index={index}
                          characterIds={characterIds}
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
                                    onReorder={onReorderCharacterRaids}
                                    className="mt-2"
                                  />
                                )}
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
                                onToggleRaid={onToggleCharacterRaid}
                                onToggleNoGold={onToggleCharacterNoGold}
                              />
                            </div>
                          </article>
                        </DraggableCharacterRow>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
