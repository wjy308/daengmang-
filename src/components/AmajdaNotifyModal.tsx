"use client";

import { useEffect, useRef, useState } from "react";
import AmajdaUserChecklistView from "@/components/amajda/AmajdaUserChecklistView";
import { hasAnyAmajdaItemChecked } from "@/lib/amajda";
import type { User } from "@/lib/types";

function toggleUserCheckedLocal(
  users: User[],
  userId: string,
  itemId: string,
): User[] {
  return users.map((user) => {
    if (user.id !== userId) return user;
    const checked = user.amajdaChecked.includes(itemId);
    return {
      ...user,
      amajdaChecked: checked
        ? user.amajdaChecked.filter((id) => id !== itemId)
        : [...user.amajdaChecked, itemId],
    };
  });
}

function toggleCharacterCheckedLocal(
  users: User[],
  userId: string,
  characterId: string,
  itemId: string,
): User[] {
  return users.map((user) => {
    if (user.id !== userId) return user;
    return {
      ...user,
      characters: user.characters.map((character) => {
        if (character.id !== characterId) return character;
        const checked = character.amajdaChecked.includes(itemId);
        return {
          ...character,
          amajdaChecked: checked
            ? character.amajdaChecked.filter((id) => id !== itemId)
            : [...character.amajdaChecked, itemId],
        };
      }),
    };
  });
}

export default function AmajdaNotifyModal({
  users,
  open,
  onClose,
  onToggleUserAmajdaChecked,
  onToggleCharacterAmajdaChecked,
  awaitingPartyClear,
}: {
  users: User[];
  open: boolean;
  onClose: () => void;
  onToggleUserAmajdaChecked: (userId: string, itemId: string) => void;
  onToggleCharacterAmajdaChecked: (
    userId: string,
    characterId: string,
    itemId: string,
  ) => void;
  /** 직접 클리어 확정 전 아맞다 확인 */
  awaitingPartyClear?: boolean;
}) {
  const [localUsers, setLocalUsers] = useState<User[]>(users);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setLocalUsers(users);
    }
    wasOpenRef.current = open;
  }, [open, users]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || localUsers.length === 0) return null;

  const hasChecked = hasAnyAmajdaItemChecked(localUsers);
  const actionLabel = hasChecked ? "완료" : "닫기";

  const handleToggleUser = (userId: string, itemId: string) => {
    setLocalUsers((prev) => toggleUserCheckedLocal(prev, userId, itemId));
    onToggleUserAmajdaChecked(userId, itemId);
  };

  const handleToggleCharacter = (
    userId: string,
    characterId: string,
    itemId: string,
  ) => {
    setLocalUsers((prev) =>
      toggleCharacterCheckedLocal(prev, userId, characterId, itemId),
    );
    onToggleCharacterAmajdaChecked(userId, characterId, itemId);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="amajda-notify-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(85dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
        <header className="shrink-0 border-b border-border px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold tracking-wide text-accent">
              아맞다
            </p>
            <h2
              id="amajda-notify-title"
              className="text-base font-semibold tracking-tight"
            >
              {localUsers.length === 1
                ? `${localUsers[0].nickname} — 빠뜨린 거 없나요?`
                : "빠뜨린 거 없나요?"}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {awaitingPartyClear
                ? "닫기·완료를 누르면 레이드 클리어가 적용돼요."
                : hasChecked
                  ? "체크한 내용이 저장돼요."
                  : "확인만 하고 닫을 수도 있어요."}
            </p>
          </div>
        </header>

        <div className="daengmang-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div>
            {localUsers.map((user, index) => (
              <div key={user.id}>
                {index > 0 && (
                  <div
                    className="my-6 border-t border-border"
                    role="separator"
                    aria-hidden
                  />
                )}
                {localUsers.length > 1 && (
                  <h3 className="mb-3 text-sm font-semibold">{user.nickname}</h3>
                )}
                <AmajdaUserChecklistView
                  user={user}
                  onToggleUserItem={(itemId) =>
                    handleToggleUser(user.id, itemId)
                  }
                  onToggleCharacterItem={(characterId, itemId) =>
                    handleToggleCharacter(user.id, characterId, itemId)
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <footer className="shrink-0 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className={`w-full rounded-xl border py-2.5 text-sm font-semibold transition ${
              hasChecked
                ? "border-[var(--success-border)] bg-[var(--success-surface)] text-[var(--success-text)]"
                : "border-border bg-card text-muted hover:border-border-strong hover:text-foreground"
            }`}
          >
            {actionLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
