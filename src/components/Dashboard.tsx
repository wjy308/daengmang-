"use client";

import type { ReactNode } from "react";
import type { RaidId } from "@/lib/raids";
import type { User } from "@/lib/types";
import { useDragReorder } from "@/hooks/useDragReorder";
import ReorderableRaidChips from "@/components/ReorderableRaidChips";
import DraggableCharacterRow from "@/components/DraggableCharacterRow";
import RoleBadge from "@/components/ui/RoleBadge";
import { listCharacterRaids } from "@/lib/character-raids";

interface DashboardProps {
  users: User[];
  actions: ReactNode;
  customClear: ReactNode;
  onEditUser: (userId: string) => void;
  onEditCharacter: (userId: string, characterId: string) => void;
  onReorderCharacters: (userId: string, characterIds: string[]) => void;
  onReorderCharacterRaids: (
    userId: string,
    characterId: string,
    raidIds: RaidId[],
  ) => void;
}

function CharacterCard({
  userId,
  nickname,
  character,
  onEdit,
  onReorderRaids,
}: {
  userId: string;
  nickname: string;
  character: User["characters"][number];
  onEdit: () => void;
  onReorderRaids: (
    userId: string,
    characterId: string,
    raidIds: RaidId[],
  ) => void;
}) {
  const raids = listCharacterRaids(character);
  const clearedCount = raids.filter((r) => r.cleared).length;

  return (
    <div className="min-w-0 flex-1 rounded-lg border border-border bg-card text-left transition hover:border-border-strong hover:bg-card-hover">
      <button
        type="button"
        onClick={onEdit}
        className="w-full p-3 text-left lg:p-2.5"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <h4 className="truncate text-sm font-medium">{character.name}</h4>
            <RoleBadge role={character.role} />
          </div>
          {raids.length > 0 && (
            <span className="shrink-0 text-[10px] text-muted lg:hidden">
              {clearedCount > 0 && `${clearedCount}✓`}
            </span>
          )}
        </div>

        {raids.length > 0 ? (
          <ReorderableRaidChips
            userId={userId}
            characterId={character.id}
            character={character}
            onReorder={onReorderRaids}
            className="mt-2.5 lg:mt-2"
          />
        ) : (
          <p className="mt-2 text-[11px] text-muted">미배정</p>
        )}

        <p className="mt-2 text-[10px] text-muted-subtle lg:hidden">
          {nickname} · 편집
        </p>
      </button>
    </div>
  );
}

function UserCard({
  user,
  onEditUser,
  onEditCharacter,
  onReorderCharacters,
  onReorderCharacterRaids,
}: {
  user: User;
  onEditUser: () => void;
  onEditCharacter: (characterId: string) => void;
  onReorderCharacters: (userId: string, characterIds: string[]) => void;
  onReorderCharacterRaids: (
    userId: string,
    characterId: string,
    raidIds: RaidId[],
  ) => void;
}) {
  const clearedTotal = user.characters.reduce(
    (n, c) => n + c.clearedRaids.length,
    0,
  );
  const characterIds = user.characters.map((c) => c.id);
  const characterDrag = useDragReorder<string>();

  return (
    <article
      className="flex flex-col rounded-xl border border-border bg-surface shadow-sm lg:min-h-0"
      style={{ boxShadow: "0 1px 3px var(--shadow)" }}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 lg:px-2.5 lg:py-2">
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-medium text-foreground">
            {user.nickname}
          </h3>
          <p className="text-[10px] text-muted">
            캐릭 {user.characters.length}
            {clearedTotal > 0 && ` · 클리어 ${clearedTotal}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onEditUser}
          className="shrink-0 rounded-md border border-border px-2 py-0.5 text-[10px] text-muted transition hover:border-border-strong hover:text-foreground"
        >
          관리
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-2.5 p-2.5 lg:gap-2 lg:p-2">
        {user.characters.length === 0 ? (
          <button
            type="button"
            onClick={onEditUser}
            className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-dashed-border py-6 text-xs text-muted transition hover:border-border-strong lg:py-4"
          >
            캐릭 추가
          </button>
        ) : (
          user.characters.map((character, index) => (
            <DraggableCharacterRow
              key={character.id}
              index={index}
              characterIds={characterIds}
              drag={characterDrag}
              onReorder={(nextIds) => onReorderCharacters(user.id, nextIds)}
            >
              <CharacterCard
                userId={user.id}
                nickname={user.nickname}
                character={character}
                onEdit={() => onEditCharacter(character.id)}
                onReorderRaids={onReorderCharacterRaids}
              />
            </DraggableCharacterRow>
          ))
        )}
      </div>
    </article>
  );
}

export default function Dashboard({
  users,
  actions,
  customClear,
  onEditUser,
  onEditCharacter,
  onReorderCharacters,
  onReorderCharacterRaids,
}: DashboardProps) {
  const totalCharacters = users.reduce((n, u) => n + u.characters.length, 0);

  return (
    <section id="dashboard" className="space-y-4 lg:space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight lg:text-xl">
            대시보드
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            유저 {users.length}명 · 캐릭터 {totalCharacters}명
            <span className="hidden text-muted-subtle sm:inline">
              {" "}
              · ⠿ 드래그로 순서 변경
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="order-2 min-w-0 lg:order-1">
          {users.length === 0 ? (
            <div className="rounded-xl border border-dashed border-dashed-border bg-surface-muted py-16 text-center">
              <p className="text-sm text-muted">아직 등록된 유저가 없어요.</p>
              <p className="mt-1 text-xs text-muted-subtle">
                아래에서 유저와 캐릭터를 추가해 보세요.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onEditUser={() => onEditUser(user.id)}
                  onEditCharacter={(characterId) =>
                    onEditCharacter(user.id, characterId)
                  }
                  onReorderCharacters={onReorderCharacters}
                  onReorderCharacterRaids={onReorderCharacterRaids}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="daengmang-scroll order-1 space-y-4 lg:order-2 lg:sticky lg:top-[4.25rem] lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto lg:pr-1">
          {actions}
        </aside>
      </div>

      {customClear}
    </section>
  );
}
