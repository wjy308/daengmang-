"use client";

import { FormEvent, useEffect, useRef } from "react";
import { sortCharacterRaids } from "@/lib/character-raids";
import { RAID_GROUPS, raidsByGroup, type RaidId } from "@/lib/raids";
import type { CharacterRole, User } from "@/lib/types";
import { ROLE_LABEL } from "@/lib/types";
import RaidChip from "@/components/ui/RaidChip";
import RoleBadge from "@/components/ui/RoleBadge";

function RaidCheckbox({
  id,
  label,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 transition ${
        disabled
          ? "cursor-not-allowed border-stone-800 opacity-40"
          : checked
            ? "border-accent/50 bg-accent/10"
            : "border-stone-800 bg-stone-900/50 hover:border-stone-600"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="size-4 rounded border-stone-600 accent-[var(--accent)]"
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}

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
  userNickname,
  onUserNicknameChange,
  charName,
  onCharNameChange,
}: RaidManagerProps) {
  const highlightRef = useRef<HTMLDivElement>(null);

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
    <section id="manage" className="space-y-8 border-t border-stone-800 pt-8">
      <div>
        <h2 className="text-lg font-semibold">관리</h2>
        <p className="mt-0.5 text-sm text-muted">
          유저 · 캐릭터 추가 및 레이드 설정
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          유저
        </h3>

        <form onSubmit={handleAddUser} className="flex gap-2">
          <input
            type="text"
            value={userNickname}
            onChange={(e) => onUserNicknameChange(e.target.value)}
            placeholder="닉네임 입력"
            className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-stone-950 hover:bg-accent-soft"
          >
            유저 추가
          </button>
        </form>

        {users.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => onSelectUser(user.id)}
                className={`group flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition ${
                  selectedUser?.id === user.id
                    ? "border-accent bg-accent/15 text-accent-soft"
                    : "border-stone-700 bg-stone-900 hover:border-stone-500"
                }`}
              >
                {user.nickname}
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
                  className="ml-1 hidden text-stone-500 hover:text-red-400 group-hover:inline"
                >
                  ×
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {selectedUser.nickname} · 캐릭터
          </h3>

          <form onSubmit={handleAddCharacter} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={charName}
                onChange={(e) => onCharNameChange(e.target.value)}
                placeholder="캐릭터 이름"
                className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="rounded-lg border border-stone-600 px-4 py-2 text-sm font-medium transition hover:border-stone-400"
              >
                캐릭 추가
              </button>
            </div>
            <div className="flex gap-2">
              {(["dealer", "support"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => onCharRoleChange(role)}
                  className={`flex-1 rounded-lg border py-2 text-sm transition ${
                    charRole === role
                      ? "border-accent bg-accent/15 text-accent-soft"
                      : "border-stone-700 bg-stone-900 text-muted hover:border-stone-500"
                  }`}
                >
                  {ROLE_LABEL[role]}
                </button>
              ))}
            </div>
          </form>

          {selectedUser.characters.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-700 py-8 text-center text-sm text-muted">
              캐릭터를 추가해 주세요.
            </p>
          ) : (
            <div className="space-y-4">
              {selectedUser.characters.map((character) => {
                const sortedRaids = sortCharacterRaids(character);
                const highlighted = highlightCharacterId === character.id;

                return (
                  <article
                    key={character.id}
                    ref={highlighted ? highlightRef : undefined}
                    className={`rounded-xl border bg-stone-900/60 p-5 transition ${
                      highlighted
                        ? "border-accent ring-1 ring-accent/30"
                        : "border-stone-800"
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-semibold">
                            {character.name}
                          </h4>
                          <RoleBadge role={character.role} />
                          <div className="flex gap-1">
                            {(["dealer", "support"] as const).map((role) => (
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
                                    ? "bg-stone-700 text-foreground"
                                    : "text-stone-600 hover:text-muted"
                                }`}
                              >
                                {ROLE_LABEL[role]}
                              </button>
                            ))}
                          </div>
                        </div>
                        {sortedRaids.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {sortedRaids.map((r) => (
                              <RaidChip
                                key={r.id}
                                label={r.label}
                                noGold={r.noGold}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(`"${character.name}" 캐릭터를 삭제할까요?`)
                          ) {
                            onRemoveCharacter(selectedUser.id, character.id);
                          }
                        }}
                        className="text-xs text-stone-500 hover:text-red-400"
                      >
                        삭제
                      </button>
                    </div>

                    <div className="grid gap-4 border-t border-stone-800 pt-4 sm:grid-cols-2">
                      {RAID_GROUPS.map((group) => (
                        <div key={group} className="space-y-2">
                          <h5 className="text-xs font-semibold text-accent-soft">
                            {group}
                          </h5>
                          <div className="space-y-2">
                            {raidsByGroup(group).map((raid) => {
                              const assigned = character.assignedRaids.includes(
                                raid.id,
                              );
                              const noGold = character.noGoldRaids.includes(
                                raid.id,
                              );

                              return (
                                <div
                                  key={raid.id}
                                  className="space-y-1 rounded-lg bg-stone-950/50 p-2"
                                >
                                  <RaidCheckbox
                                    id={`char-${character.id}-${raid.id}`}
                                    label={raid.label}
                                    checked={assigned}
                                    onChange={() =>
                                      onToggleCharacterRaid(
                                        selectedUser.id,
                                        character.id,
                                        raid.id,
                                      )
                                    }
                                  />
                                  <label
                                    className={`flex items-center gap-1.5 pl-2 text-xs ${
                                      assigned
                                        ? "text-muted"
                                        : "cursor-not-allowed opacity-30"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={noGold}
                                      disabled={!assigned}
                                      onChange={() =>
                                        onToggleCharacterNoGold(
                                          selectedUser.id,
                                          character.id,
                                          raid.id,
                                        )
                                      }
                                      className="size-3.5 rounded accent-stone-500"
                                    />
                                    골드 안 받음
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
