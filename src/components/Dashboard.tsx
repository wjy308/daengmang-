"use client";

import type { ReactNode } from "react";
import { sortCharacterRaids } from "@/lib/character-raids";
import type { User } from "@/lib/types";
import RaidChip from "@/components/ui/RaidChip";
import RoleBadge from "@/components/ui/RoleBadge";

interface DashboardProps {
  users: User[];
  partyPlanner: ReactNode;
  onEditUser: (userId: string) => void;
  onEditCharacter: (userId: string, characterId: string) => void;
}

function CharacterCard({
  nickname,
  character,
  onEdit,
}: {
  nickname: string;
  character: User["characters"][number];
  onEdit: () => void;
}) {
  const raids = sortCharacterRaids(character);
  const goldCount = raids.filter((r) => !r.noGold).length;
  const noGoldCount = raids.filter((r) => r.noGold).length;

  return (
    <button
      type="button"
      onClick={onEdit}
      className="w-full rounded-lg border border-stone-800 bg-stone-950/60 p-3 text-left transition hover:border-stone-600 hover:bg-stone-900"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{character.name}</h4>
          <RoleBadge role={character.role} />
        </div>
        {raids.length > 0 && (
          <span className="shrink-0 text-xs text-muted">
            골드 {goldCount}
            {noGoldCount > 0 && ` · 무골 ${noGoldCount}`}
          </span>
        )}
      </div>

      {raids.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {raids.map((r) => (
            <RaidChip key={r.id} label={r.label} noGold={r.noGold} />
          ))}
        </div>
      ) : (
        <p className="mt-1.5 text-xs text-muted">레이드 미배정 · 클릭해서 설정</p>
      )}

      <p className="mt-2 text-[10px] text-stone-600">
        {nickname} · 편집
      </p>
    </button>
  );
}

function UserCard({
  user,
  onEditUser,
  onEditCharacter,
}: {
  user: User;
  onEditUser: () => void;
  onEditCharacter: (characterId: string) => void;
}) {
  return (
    <article className="flex flex-col rounded-xl border border-stone-800 bg-stone-900/50 shadow-lg shadow-black/20">
      <header className="flex items-center justify-between gap-2 border-b border-stone-800 px-4 py-3">
        <div>
          <h3 className="text-lg font-semibold">{user.nickname}</h3>
          <p className="text-xs text-muted">캐릭터 {user.characters.length}명</p>
        </div>
        <button
          type="button"
          onClick={onEditUser}
          className="rounded-md border border-stone-700 px-2.5 py-1 text-xs text-muted transition hover:border-stone-500 hover:text-foreground"
        >
          관리
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {user.characters.length === 0 ? (
          <button
            type="button"
            onClick={onEditUser}
            className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-stone-700 py-8 text-sm text-muted transition hover:border-stone-500"
          >
            캐릭터 추가하기
          </button>
        ) : (
          user.characters.map((character) => (
            <CharacterCard
              key={character.id}
              nickname={user.nickname}
              character={character}
              onEdit={() => onEditCharacter(character.id)}
            />
          ))
        )}
      </div>
    </article>
  );
}

export default function Dashboard({
  users,
  partyPlanner,
  onEditUser,
  onEditCharacter,
}: DashboardProps) {
  const totalCharacters = users.reduce((n, u) => n + u.characters.length, 0);

  return (
    <section id="dashboard" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">대시보드</h2>
          <p className="mt-0.5 text-sm text-muted">
            유저 {users.length}명 · 캐릭터 {totalCharacters}명
          </p>
        </div>
      </div>

      {partyPlanner}

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-700 bg-stone-900/30 py-16 text-center">
          <p className="text-sm text-muted">아직 등록된 유저가 없어요.</p>
          <p className="mt-1 text-xs text-stone-600">
            아래에서 유저와 캐릭터를 추가해 보세요.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEditUser={() => onEditUser(user.id)}
              onEditCharacter={(characterId) =>
                onEditCharacter(user.id, characterId)
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
