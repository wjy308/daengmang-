"use client";

import {
  getAmajdaProgress,
  getCharacterAmajdaProgress,
  getUserAmajdaProgress,
  isAmajdaItemChecked,
} from "@/lib/amajda";
import type { AmajdaItem, Character, User } from "@/lib/types";
import RoleBadge from "@/components/ui/RoleBadge";

function progressLabel(progress: { checked: number; total: number }): string {
  if (progress.total === 0) return "항목 없음";
  if (progress.checked === progress.total) return "완료";
  return `${progress.checked}/${progress.total}`;
}

function ChecklistItemRow({
  item,
  checked,
  onToggle,
}: {
  item: AmajdaItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className="flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 transition"
      style={{
        borderColor: checked ? "var(--success-border)" : "var(--border)",
        background: checked ? "var(--chip-cleared-bg)" : "var(--card)",
      }}
    >
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
  );
}

function CharacterChecklistSection({
  character,
  onToggleItem,
}: {
  character: Character;
  onToggleItem: (itemId: string) => void;
}) {
  const progress = getCharacterAmajdaProgress(character);
  if (character.amajdaItems.length === 0) return null;

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
      <div className="space-y-1.5">
        {character.amajdaItems.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            checked={isAmajdaItemChecked(item.id, character.amajdaChecked)}
            onToggle={() => onToggleItem(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function AmajdaUserChecklistView({
  user,
  onToggleUserItem,
  onToggleCharacterItem,
}: {
  user: User;
  onToggleUserItem: (itemId: string) => void;
  onToggleCharacterItem: (characterId: string, itemId: string) => void;
}) {
  const userProgress = getAmajdaProgress(user.amajdaItems, user.amajdaChecked);
  const totalProgress = getUserAmajdaProgress(user);
  const charSections = user.characters.filter((c) => c.amajdaItems.length > 0);

  if (totalProgress.total === 0) {
    return (
      <p className="rounded-lg border border-dashed border-dashed-border px-4 py-6 text-center text-sm text-muted">
        등록된 아맞다!! 항목이 없어요. 아래 체크리스트에서 항목을 추가해 보세요.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {user.amajdaItems.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-muted">
              계정 · 유저
            </p>
            <span className="text-[10px] text-muted">
              {progressLabel(userProgress)}
            </span>
          </div>
          <div className="space-y-1.5">
            {user.amajdaItems.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                checked={isAmajdaItemChecked(item.id, user.amajdaChecked)}
                onToggle={() => onToggleUserItem(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {charSections.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted">
            캐릭터별
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {charSections.map((character) => (
              <CharacterChecklistSection
                key={character.id}
                character={character}
                onToggleItem={(itemId) =>
                  onToggleCharacterItem(character.id, itemId)
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
