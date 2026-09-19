"use client";

import { useMemo, useState } from "react";
import {
  getAmajdaProgress,
  getCharacterAmajdaProgress,
  getUserAmajdaProgress,
  isAmajdaItemChecked,
  resetsAmajdaItemWeekly,
} from "@/lib/amajda";
import type { AmajdaItem, Character, User } from "@/lib/types";
import AmajdaNotificationSettings from "@/components/AmajdaNotificationSettings";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel";
import RoleBadge from "@/components/ui/RoleBadge";
import type { BrowserProfile } from "@/lib/amajda-notify";

/**
 * 캐릭터별 카드 격자. 한 줄 개수를 바꾸려면 여기만 만지면 된다.
 * sm(640~) 2개 · lg(1024~) 4개 · xl(1280~) 5개 · 2xl(1536~) 6개, 카드 사이 6px.
 * 1280에서 6개를 넣으면 카드가 190px라 편집 모드에서 긴 항목이 4줄로 쪼개진다.
 * (알림 모달은 폭이 좁아 2열 그대로 — AmajdaUserChecklistView)
 */
const CHARACTER_GRID_CLASS =
  "grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

function progressLabel(progress: { checked: number; total: number }): string {
  if (progress.total === 0) return "항목 없음";
  if (progress.checked === progress.total) return "완료";
  return `${progress.checked}/${progress.total}`;
}

/**
 * 항목 한 줄.
 * - 보기: 체크박스로 완료 체크, 계속 유지 항목엔 "유지" 표시
 * - 편집: 완료 체크박스를 아예 없앤다. 예전엔 완료 체크박스와 「수요일마다 초기화」
 *   체크박스가 똑같이 생겨 헷갈렸다. 초기화 여부는 눌러서 바꾸는 작은 버튼 하나로.
 * 카드 안에 또 테두리 상자를 넣으면 겹겹이 보여서, 줄은 테두리 없이 배경만 쓴다.
 */
function AmajdaItemRow({
  item,
  checked,
  editing,
  onToggle,
  onRemove,
  onSetResetWeekly,
}: {
  item: AmajdaItem;
  checked: boolean;
  editing: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onSetResetWeekly: (resetWeekly: boolean) => void;
}) {
  const weeklyReset = resetsAmajdaItemWeekly(item);

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-card-hover">
        <span className="min-w-0 flex-1 truncate text-sm text-foreground" title={item.label}>
          {item.label}
        </span>
        <button
          type="button"
          onClick={() => onSetResetWeekly(!weeklyReset)}
          title="눌러서 바꾸기 — 매주: 수요일 10시에 체크가 풀려요 / 유지: 계속 체크된 채로"
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] transition ${
            weeklyReset
              ? "border-border text-muted hover:border-border-strong"
              : "border-border-strong bg-[var(--chip-muted-bg)] font-semibold text-foreground"
          }`}
        >
          {weeklyReset ? "매주 초기화" : "계속 유지"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${item.label} 삭제`}
          title="삭제"
          className="shrink-0 rounded px-1 text-sm leading-none text-muted-subtle transition hover:text-[var(--danger-text)]"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 transition ${
        checked ? "bg-[var(--chip-cleared-bg)]" : "hover:bg-card-hover"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 shrink-0 rounded border-border accent-[var(--accent)]"
      />
      <span
        className={`min-w-0 flex-1 truncate text-sm ${
          checked ? "text-muted line-through" : "text-foreground"
        }`}
        title={item.label}
      >
        {item.label}
      </span>
      {item.period && (
        <span className="shrink-0 rounded bg-[var(--chip-muted-bg)] px-1.5 py-0.5 text-[10px] text-muted">
          {item.period}
        </span>
      )}
      {!weeklyReset && (
        <span className="shrink-0 rounded bg-[var(--chip-muted-bg)] px-1.5 py-0.5 text-[10px] text-muted">
          유지
        </span>
      )}
    </label>
  );
}

/**
 * 편집 모드에서 항목을 더하는 자리. 평소엔 "+ 항목 추가" 글자만 두고, 누르면 입력칸이 열린다.
 * 카드마다 입력칸이 늘 떠 있으면 체크 항목과 입력칸이 뒤섞여 복잡해 보였다.
 * Enter로 추가하면 칸을 비우고 열어 둬서 여러 개를 이어서 넣을 수 있다.
 */
function AddAmajdaItem({
  onAdd,
  placeholder,
}: {
  onAdd: (label: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md px-1.5 py-1 text-left text-xs text-muted-subtle transition hover:bg-card-hover hover:text-foreground"
      >
        + 항목 추가
      </button>
    );
  }

  const close = () => {
    setLabel("");
    setOpen(false);
  };

  const submit = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setLabel("");
  };

  return (
    <input
      autoFocus
      type="text"
      value={label}
      onChange={(e) => setLabel(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
        if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
        e.preventDefault();
        submit();
      }}
      // 비운 채로 다른 곳을 누르면 닫는다 (쓰던 글자가 있으면 남겨 둔다)
      onBlur={() => {
        if (!label.trim()) close();
      }}
      placeholder={`${placeholder} · Enter`}
      className="w-full rounded-md border border-border bg-[var(--input-bg)] px-2 py-1 text-sm outline-none focus:border-border-strong"
    />
  );
}

/** 계정 공통 — 계정당 한 번이면 되는 일. 캐릭터 카드와 섞이지 않게 따로 상자에 담는다 */
function UserAmajdaBlock({
  user,
  editing,
  onToggleUserItem,
  onRemoveUserItem,
  onAddUserItem,
  onSetUserItemResetWeekly,
}: {
  user: User;
  editing: boolean;
  onToggleUserItem: (itemId: string) => void;
  onRemoveUserItem: (itemId: string) => void;
  onAddUserItem: (label: string, period?: string) => void;
  onSetUserItemResetWeekly: (itemId: string, resetWeekly: boolean) => void;
}) {
  const progress = getAmajdaProgress(user.amajdaItems, user.amajdaChecked);
  if (user.amajdaItems.length === 0 && !editing) return null;

  return (
    <section className="rounded-lg border border-border bg-surface-muted p-3">
      <SectionHeading
        title="계정 공통"
        hint="계정당 한 번이면 되는 것"
        progress={user.amajdaItems.length > 0 ? progressLabel(progress) : undefined}
      />
      <div className="grid gap-x-3 gap-y-0.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {user.amajdaItems.map((item) => (
          <AmajdaItemRow
            key={item.id}
            item={item}
            checked={isAmajdaItemChecked(item.id, user.amajdaChecked)}
            editing={editing}
            onToggle={() => onToggleUserItem(item.id)}
            onRemove={() => onRemoveUserItem(item.id)}
            onSetResetWeekly={(resetWeekly) => onSetUserItemResetWeekly(item.id, resetWeekly)}
          />
        ))}
        {editing && (
          <AddAmajdaItem onAdd={onAddUserItem} placeholder="익스트림 상점, 코인샵" />
        )}
      </div>
    </section>
  );
}

function SectionHeading({
  title,
  hint,
  progress,
}: {
  title: string;
  hint: string;
  progress?: string;
}) {
  return (
    <div className="mb-2 flex items-baseline gap-2">
      <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      <span className="text-[11px] text-muted-subtle">{hint}</span>
      {progress && <span className="text-[10px] text-muted">· {progress}</span>}
    </div>
  );
}

function CharacterAmajdaBlock({
  character,
  editing,
  onToggleItem,
  onRemoveItem,
  onAddItem,
  onSetItemResetWeekly,
}: {
  character: Character;
  editing: boolean;
  onToggleItem: (characterId: string, itemId: string) => void;
  onRemoveItem: (characterId: string, itemId: string) => void;
  onAddItem: (characterId: string, label: string, period?: string) => void;
  onSetItemResetWeekly: (
    characterId: string,
    itemId: string,
    resetWeekly: boolean,
  ) => void;
}) {
  const progress = getCharacterAmajdaProgress(character);
  const hasItems = character.amajdaItems.length > 0;

  if (!hasItems && !editing) return null;

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* 이름 줄을 선으로 떼어 카드끼리·항목과 구분되게 */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-2.5 py-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-xs font-semibold">{character.name}</span>
          <RoleBadge role={character.role} />
        </div>
        {hasItems && (
          <span className="shrink-0 text-[10px] text-muted">{progressLabel(progress)}</span>
        )}
      </div>
      <div className="space-y-0.5 p-1.5">
        {character.amajdaItems.map((item) => (
          <AmajdaItemRow
            key={item.id}
            item={item}
            checked={isAmajdaItemChecked(item.id, character.amajdaChecked)}
            editing={editing}
            onToggle={() => onToggleItem(character.id, item.id)}
            onRemove={() => onRemoveItem(character.id, item.id)}
            onSetResetWeekly={(resetWeekly) =>
              onSetItemResetWeekly(character.id, item.id, resetWeekly)
            }
          />
        ))}
        {editing && (
          <AddAmajdaItem
            onAdd={(label) => onAddItem(character.id, label)}
            placeholder="낙원, 모래시계"
          />
        )}
      </div>
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
  onSetUserItemResetWeekly,
  onSetCharacterItemResetWeekly,
}: {
  user: User;
  open: boolean;
  onToggleOpen: () => void;
  editing: boolean;
  onToggleUserItem: (itemId: string) => void;
  onRemoveUserItem: (itemId: string) => void;
  onAddUserItem: (label: string, period?: string) => void;
  onSetUserItemResetWeekly: (itemId: string, resetWeekly: boolean) => void;
  onToggleCharacterItem: (characterId: string, itemId: string) => void;
  onRemoveCharacterItem: (characterId: string, itemId: string) => void;
  onAddCharacterItem: (
    characterId: string,
    label: string,
    period?: string,
  ) => void;
  onSetCharacterItemResetWeekly: (
    characterId: string,
    itemId: string,
    resetWeekly: boolean,
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
          onSetUserItemResetWeekly={onSetUserItemResetWeekly}
        />

        {(charBlocks.length > 0 || (editing && user.characters.length > 0)) && (
          <div>
            <SectionHeading title="캐릭터별" hint="캐릭마다 따로 하는 것" />
            {user.characters.length === 0 ? (
              <p className="text-xs text-muted-subtle">
                캐릭터를 추가하면 캐릭별 항목을 넣을 수 있어요.
              </p>
            ) : (
              <div className={CHARACTER_GRID_CLASS}>
                {(editing ? user.characters : charBlocks).map((character) => (
                  <CharacterAmajdaBlock
                    key={character.id}
                    character={character}
                    editing={editing}
                    onToggleItem={onToggleCharacterItem}
                    onRemoveItem={onRemoveCharacterItem}
                    onAddItem={onAddCharacterItem}
                    onSetItemResetWeekly={onSetCharacterItemResetWeekly}
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
  onSetUserAmajdaItemResetWeekly,
  onSetCharacterAmajdaItemResetWeekly,
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
  onSetUserAmajdaItemResetWeekly: (
    userId: string,
    itemId: string,
    resetWeekly: boolean,
  ) => void;
  onSetCharacterAmajdaItemResetWeekly: (
    userId: string,
    characterId: string,
    itemId: string,
    resetWeekly: boolean,
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
              「항목 편집」에서 계정 공통·캐릭터별 항목을 추가해요. 「매주 초기화」
              항목은 수요일 10시 주간 리셋 때 체크가 풀리고, 「계속 유지」 항목은
              그대로 남아요.
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
            onSetUserItemResetWeekly={(itemId, resetWeekly) =>
              onSetUserAmajdaItemResetWeekly(user.id, itemId, resetWeekly)
            }
            onSetCharacterItemResetWeekly={(
              characterId,
              itemId,
              resetWeekly,
            ) =>
              onSetCharacterAmajdaItemResetWeekly(
                user.id,
                characterId,
                itemId,
                resetWeekly,
              )
            }
          />
        ))}
      </div>
    </section>
  );
}
