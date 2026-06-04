"use client";

import { useMemo, useState } from "react";
import {
  getAmajdaProgress,
  getCharacterAmajdaProgress,
  getUserAmajdaProgress,
  isAmajdaItemChecked,
} from "@/lib/amajda";
import type { AmajdaItem, Character, User } from "@/lib/types";
import AmajdaNotificationSettings from "@/components/AmajdaNotificationSettings";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel";
import RoleBadge from "@/components/ui/RoleBadge";
import type { BrowserProfile } from "@/lib/amajda-notify";

function progressLabel(progress: { checked: number; total: number }): string {
  if (progress.total === 0) return "항목 없음";
  if (progress.checked === progress.total) return "완료";
  return `${progress.checked}/${progress.total}`;
}

function AmajdaItemRow({
  item,
  checked,
  editing,
  onToggle,
  onRemove,
}: {
  item: AmajdaItem;
  checked: boolean;
  editing: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-2.5 py-2 transition"
      style={{
        borderColor: checked ? "var(--success-border)" : "var(--border)",
        background: checked ? "var(--chip-cleared-bg)" : "var(--card)",
      }}
    >
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-4 w-4 shrink-0 rounded border-border accent-[var(--accent)]"
        />
        <span
          className={`min-w-0 flex-1 text-sm ${
            checked ? "text-muted line-through" : "text-foreground"
          }`}
        >
          {item.label}
        </span>
        {item.period && (
          <span className="shrink-0 rounded bg-[var(--chip-muted-bg)] px-1.5 py-0.5 text-[10px] text-muted">
            {item.period}
          </span>
        )}
      </label>
      {editing && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-muted transition hover:text-[var(--danger-text)]"
        >
          삭제
        </button>
      )}
    </div>
  );
}

function AddAmajdaForm({
  onAdd,
  compact,
  labelPlaceholder,
}: {
  onAdd: (label: string, period?: string) => void;
  compact?: boolean;
  labelPlaceholder: string;
}) {
  const [label, setLabel] = useState("");

  const submit = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setLabel("");
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    e.preventDefault();
    submit();
  };

  return (
    <div
      className={`flex flex-col gap-2 ${compact ? "" : "rounded-lg border border-dashed border-dashed-border p-2.5"}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleLabelKeyDown}
          placeholder={labelPlaceholder}
          className="min-w-0 flex-1 rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-sm outline-none focus:border-border-strong"
        />
        {/* 기간 입력 — 추후 사용
        <input placeholder="기간 (선택)" ... />
        */}
        <button
          type="button"
          onClick={submit}
          disabled={!label.trim()}
          className="shrink-0 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-muted transition hover:border-border-strong hover:text-foreground disabled:opacity-40"
        >
          추가
        </button>
      </div>
    </div>
  );
}

function UserAmajdaBlock({
  user,
  editing,
  onToggleUserItem,
  onRemoveUserItem,
  onAddUserItem,
}: {
  user: User;
  editing: boolean;
  onToggleUserItem: (itemId: string) => void;
  onRemoveUserItem: (itemId: string) => void;
  onAddUserItem: (label: string, period?: string) => void;
}) {
  const progress = getAmajdaProgress(user.amajdaItems, user.amajdaChecked);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted">
          계정 · 유저
        </p>
        <span className="text-[10px] text-muted">{progressLabel(progress)}</span>
      </div>
      {user.amajdaItems.length === 0 && !editing ? (
        <p className="text-xs text-muted-subtle">유저 단위 항목이 없어요.</p>
      ) : (
        <div className="space-y-1.5">
          {user.amajdaItems.map((item) => (
            <AmajdaItemRow
              key={item.id}
              item={item}
              checked={isAmajdaItemChecked(item.id, user.amajdaChecked)}
              editing={editing}
              onToggle={() => onToggleUserItem(item.id)}
              onRemove={() => onRemoveUserItem(item.id)}
            />
          ))}
        </div>
      )}
      {editing && (
        <div className="mt-2">
          <AddAmajdaForm
            onAdd={onAddUserItem}
            compact
            labelPlaceholder="ex) 익스트림 상점, 코인샵"
          />
        </div>
      )}
    </div>
  );
}

function CharacterAmajdaBlock({
  character,
  editing,
  onToggleItem,
  onRemoveItem,
  onAddItem,
}: {
  character: Character;
  editing: boolean;
  onToggleItem: (characterId: string, itemId: string) => void;
  onRemoveItem: (characterId: string, itemId: string) => void;
  onAddItem: (characterId: string, label: string, period?: string) => void;
}) {
  const progress = getCharacterAmajdaProgress(character);
  const hasItems = character.amajdaItems.length > 0;

  if (!hasItems && !editing) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-xs font-medium">{character.name}</span>
          <RoleBadge role={character.role} />
        </div>
        <span className="shrink-0 text-[10px] text-muted">
          {progressLabel(progress)}
        </span>
      </div>
      {hasItems ? (
        <div className="space-y-1.5">
          {character.amajdaItems.map((item) => (
            <AmajdaItemRow
              key={item.id}
              item={item}
              checked={isAmajdaItemChecked(item.id, character.amajdaChecked)}
              editing={editing}
              onToggle={() => onToggleItem(character.id, item.id)}
              onRemove={() => onRemoveItem(character.id, item.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-subtle">캐릭 항목이 없어요.</p>
      )}
      {editing && (
        <div className="mt-2">
          <AddAmajdaForm
            onAdd={(label, period) => onAddItem(character.id, label, period)}
            compact
            labelPlaceholder="ex) 낙원, 모래시계, 싱글상점"
          />
        </div>
      )}
    </div>
  );
}

function UserAmajdaCard({
  user,
  open,
  onToggleOpen,
  editing,
  onToggleUserItem,
  onRemoveUserItem,
  onAddUserItem,
  onToggleCharacterItem,
  onRemoveCharacterItem,
  onAddCharacterItem,
}: {
  user: User;
  open: boolean;
  onToggleOpen: () => void;
  editing: boolean;
  onToggleUserItem: (itemId: string) => void;
  onRemoveUserItem: (itemId: string) => void;
  onAddUserItem: (label: string, period?: string) => void;
  onToggleCharacterItem: (characterId: string, itemId: string) => void;
  onRemoveCharacterItem: (characterId: string, itemId: string) => void;
  onAddCharacterItem: (
    characterId: string,
    label: string,
    period?: string,
  ) => void;
}) {
  const progress = getUserAmajdaProgress(user);
  const charBlocks = user.characters.filter(
    (c) => c.amajdaItems.length > 0 || editing,
  );

  return (
    <CollapsiblePanel
      title={user.nickname}
      subtitle={progressLabel(progress)}
      open={open}
      onToggle={onToggleOpen}
    >
      <div className="space-y-4">
        <UserAmajdaBlock
          user={user}
          editing={editing}
          onToggleUserItem={onToggleUserItem}
          onRemoveUserItem={onRemoveUserItem}
          onAddUserItem={onAddUserItem}
        />

        {(charBlocks.length > 0 || (editing && user.characters.length > 0)) && (
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted">
              캐릭터별
            </p>
            {user.characters.length === 0 ? (
              <p className="text-xs text-muted-subtle">
                캐릭터를 추가하면 캐릭별 항목을 넣을 수 있어요.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {(editing ? user.characters : charBlocks).map((character) => (
                  <CharacterAmajdaBlock
                    key={character.id}
                    character={character}
                    editing={editing}
                    onToggleItem={onToggleCharacterItem}
                    onRemoveItem={onRemoveCharacterItem}
                    onAddItem={onAddCharacterItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
}

export default function AmajdaChecklist({
  users,
  browserProfile,
  onBrowserProfileChange,
  onAddUserAmajdaItem,
  onRemoveUserAmajdaItem,
  onToggleUserAmajdaChecked,
  onAddCharacterAmajdaItem,
  onRemoveCharacterAmajdaItem,
  onToggleCharacterAmajdaChecked,
}: {
  users: User[];
  browserProfile: BrowserProfile;
  onBrowserProfileChange: (profile: BrowserProfile) => void;
  onAddUserAmajdaItem: (
    userId: string,
    label: string,
    period?: string,
  ) => void;
  onRemoveUserAmajdaItem: (userId: string, itemId: string) => void;
  onToggleUserAmajdaChecked: (userId: string, itemId: string) => void;
  onAddCharacterAmajdaItem: (
    userId: string,
    characterId: string,
    label: string,
    period?: string,
  ) => void;
  onRemoveCharacterAmajdaItem: (
    userId: string,
    characterId: string,
    itemId: string,
  ) => void;
  onToggleCharacterAmajdaChecked: (
    userId: string,
    characterId: string,
    itemId: string,
  ) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [openUserIds, setOpenUserIds] = useState<Set<string>>(() => new Set());

  const totalProgress = useMemo(() => {
    const parts = users.map(getUserAmajdaProgress);
    return {
      total: parts.reduce((n, p) => n + p.total, 0),
      checked: parts.reduce((n, p) => n + p.checked, 0),
    };
  }, [users]);

  const toggleUserOpen = (userId: string) => {
    setOpenUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  if (users.length === 0) {
    return (
      <section
        id="amajda"
        className="rounded-xl border border-dashed border-dashed-border bg-surface-muted py-12 text-center"
      >
        <h2 className="text-lg font-semibold tracking-tight">아맞다 체크리스트</h2>
        <p className="mt-2 text-sm text-muted">
          유저를 추가하면 주간·이벤트 할 일을 체크할 수 있어요.
        </p>
      </section>
    );
  }

  return (
    <section id="amajda" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight lg:text-xl">
            아맞다!! 체크리스트
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            주간·기간별 이벤트·상점 등 빠뜨리기 쉬운 할 일을 체크해요.
            <span className="block text-xs text-muted-subtle">
              유저(계정) 단위와 캐릭터 단위로 항목을 직접 추가할 수 있어요. 체크
              상태는 레이드 주간 리셋(수 10시)에 초기화됩니다.
            </span>
          </p>
          {totalProgress.total > 0 && (
            <p className="mt-1 text-xs text-accent-soft">
              전체 {progressLabel(totalProgress)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs transition ${
            editing
              ? "border-accent bg-[var(--chip-gold-bg)] text-accent-soft"
              : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground"
          }`}
        >
          {editing ? "편집 완료" : "항목 편집"}
        </button>
      </div>

      <AmajdaNotificationSettings
        users={users}
        profile={browserProfile}
        onProfileChange={onBrowserProfileChange}
      />

      <div className="space-y-3">
        {users.map((user) => (
          <UserAmajdaCard
            key={user.id}
            user={user}
            open={openUserIds.has(user.id)}
            onToggleOpen={() => toggleUserOpen(user.id)}
            editing={editing}
            onToggleUserItem={(itemId) =>
              onToggleUserAmajdaChecked(user.id, itemId)
            }
            onRemoveUserItem={(itemId) =>
              onRemoveUserAmajdaItem(user.id, itemId)
            }
            onAddUserItem={(label, period) =>
              onAddUserAmajdaItem(user.id, label, period)
            }
            onToggleCharacterItem={(characterId, itemId) =>
              onToggleCharacterAmajdaChecked(user.id, characterId, itemId)
            }
            onRemoveCharacterItem={(characterId, itemId) =>
              onRemoveCharacterAmajdaItem(user.id, characterId, itemId)
            }
            onAddCharacterItem={(characterId, label, period) =>
              onAddCharacterAmajdaItem(user.id, characterId, label, period)
            }
          />
        ))}
      </div>
    </section>
  );
}
