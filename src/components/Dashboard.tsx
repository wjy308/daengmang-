"use client";

import { useState, type ReactNode } from "react";
import type { RaidId } from "@/lib/raids";
import { getRaid, RAID_DEFINITIONS } from "@/lib/raids";
import type { User } from "@/lib/types";
import { useDragReorder } from "@/hooks/useDragReorder";
import ReorderableRaidChips from "@/components/ReorderableRaidChips";
import DraggableCharacterRow from "@/components/DraggableCharacterRow";
import RoleBadge from "@/components/ui/RoleBadge";
import { listCharacterRaids } from "@/lib/character-raids";
import {
  formatGold,
  getCharacterGoldProgress,
  getGoldOptimizationInfo,
  getUserGoldProgress,
  type GoldOptimizationInfo,
  type RaidGoldOption,
} from "@/lib/gold";
import type { GoldOverrides } from "@/lib/gold-overrides";

interface DashboardProps {
  users: User[];
  actions: ReactNode;
  customClear: ReactNode;
  goldOverrides?: GoldOverrides;
  onEditUser: (userId: string) => void;
  onEditCharacter: (userId: string, characterId: string) => void;
  onReorderCharacters: (userId: string, characterIds: string[]) => void;
  onReorderCharacterRaids: (
    userId: string,
    characterId: string,
    raidIds: RaidId[],
  ) => void;
  onToggleCharacterGoldIncluded: (userId: string, characterId: string) => void;
}

interface PendingRaidEntry {
  id: string;
  label: string;
  dealers: number;
  supports: number;
  hasGold: boolean;
  charNames: string[];
}

function getPendingRaids(user: User): PendingRaidEntry[] {
  const map = new Map<string, PendingRaidEntry>();

  for (const character of user.characters) {
    for (const raidId of character.assignedRaids) {
      if (character.clearedRaids.includes(raidId)) continue;
      const isGold = character.goldIncluded && !character.noGoldRaids.includes(raidId);
      const key = `${raidId}:${isGold}`;
      if (!map.has(key)) {
        map.set(key, { id: key, label: getRaid(raidId).label, dealers: 0, supports: 0, hasGold: isGold, charNames: [] });
      }
      const entry = map.get(key)!;
      if (character.role === "dealer") entry.dealers++;
      else entry.supports++;
      entry.charNames.push(character.name);
    }
  }

  const result: PendingRaidEntry[] = [];
  for (const raid of RAID_DEFINITIONS) {
    const gold = map.get(`${raid.id}:true`);
    const noGold = map.get(`${raid.id}:false`);
    if (gold) result.push(gold);
    if (noGold) result.push(noGold);
  }
  return result;
}

function RaidRow({
  entry,
  isPinned,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onClick,
}: {
  entry: PendingRaidEntry;
  isPinned: boolean;
  onMouseEnter: (x: number, y: number) => void;
  onMouseMove: (x: number, y: number) => void;
  onMouseLeave: () => void;
  onClick: (x: number, y: number) => void;
}) {
  const parts: string[] = [];
  if (entry.dealers > 0) parts.push(`딜${entry.dealers}`);
  if (entry.supports > 0) parts.push(`폿${entry.supports}`);
  return (
    <li
      className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${
        isPinned
          ? "border-accent/50 bg-card"
          : "border-border bg-card hover:border-border-strong"
      }`}
      onMouseEnter={(e) => onMouseEnter(e.clientX, e.clientY)}
      onMouseMove={(e) => onMouseMove(e.clientX, e.clientY)}
      onMouseLeave={onMouseLeave}
      onClick={(e) => onClick(e.clientX, e.clientY)}
    >
      <span className="text-sm font-medium text-foreground">{entry.label}</span>
      <span className="shrink-0 text-sm font-semibold text-accent">
        {parts.join(", ")}
      </span>
    </li>
  );
}

function RemainingRaidsDialog({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const pending = getPendingRaids(user);
  const goldRaids = pending.filter((r) => r.hasGold);
  const noGoldRaids = pending.filter((r) => !r.hasGold);

  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const activeId = pinnedId ?? hoveredId;
  const activeEntry = pending.find((e) => e.id === activeId);

  const handleMouseEnter = (x: number, y: number, id: string) => {
    if (pinnedId) return;
    setHoveredId(id);
    setTooltipPos({ x, y });
  };

  const handleMouseMove = (x: number, y: number) => {
    if (!pinnedId) setTooltipPos({ x, y });
  };

  const handleMouseLeave = () => {
    if (!pinnedId) setHoveredId(null);
  };

  const handleClick = (x: number, y: number, id: string) => {
    if (pinnedId === id) {
      setPinnedId(null);
    } else {
      setPinnedId(id);
      setTooltipPos({ x, y });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (pinnedId) { setPinnedId(null); return; }
      onClose();
    }
  };

  const renderRows = (entries: PendingRaidEntry[]) =>
    entries.map((entry) => (
      <RaidRow
        key={entry.id}
        entry={entry}
        isPinned={pinnedId === entry.id}
        onMouseEnter={(x, y) => handleMouseEnter(x, y, entry.id)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={(x, y) => handleClick(x, y, entry.id)}
      />
    ));

  return (
    <>
      {activeEntry && (
        <div
          className="pointer-events-none fixed z-[60] min-w-[7rem] rounded-lg border border-accent/40 bg-accent/15 px-3 py-2 shadow-lg"
          style={{ left: tooltipPos.x + 14, top: tooltipPos.y + 14 }}
        >
          {activeEntry.charNames.map((name) => (
            <p key={name} className="text-xs font-semibold text-foreground">{name}</p>
          ))}
        </div>
      )}
      <div
        className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="remaining-raids-title"
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/50"
          aria-label="닫기"
          onClick={onClose}
        />
        <div className="relative z-10 flex max-h-[min(80dvh,36rem)] w-full max-w-sm flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <header className="shrink-0 border-b border-border px-4 py-3">
            <p className="text-[10px] font-semibold tracking-wide text-muted">
              {user.nickname}
            </p>
            <h2
              id="remaining-raids-title"
              className="text-base font-semibold tracking-tight"
            >
              뭐가..남았더라..?
            </h2>
          </header>

          <div className="daengmang-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {pending.length === 0 ? (
              <p className="text-sm text-muted">이번 주 레이드 다 클리어했어요 🎉</p>
            ) : (
              <div className="space-y-4">
                {goldRaids.length > 0 && (
                  <section>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-accent-soft">
                      골드
                    </p>
                    <ul className="space-y-1.5">
                      {renderRows(goldRaids)}
                    </ul>
                  </section>
                )}
                {noGoldRaids.length > 0 && (
                  <section>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      무골
                    </p>
                    <ul className="space-y-1.5">
                      {renderRows(noGoldRaids)}
                    </ul>
                  </section>
              )}
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-muted transition hover:border-border-strong hover:text-foreground"
          >
            닫기
          </button>
        </footer>
      </div>
    </div>
    </>
  );
}

function OptRaidRow({ opt, rank }: { opt: RaidGoldOption; rank: number }) {
  const allBound = opt.normal === 0 && opt.bound > 0;
  const mixed = opt.bound > 0 && opt.normal > 0;
  return (
    <li className="flex items-center gap-1.5 text-[11px]">
      <span className="w-3 shrink-0 text-muted">{rank}.</span>
      <span className="min-w-0 flex-1 truncate text-foreground">{opt.label}</span>
      <span className="shrink-0 font-semibold text-foreground">{formatGold(opt.total)}</span>
      {allBound && (
        <span className="shrink-0 rounded bg-[var(--chip-muted-bg)] px-1 text-[10px] text-muted">귀속</span>
      )}
      {mixed && (
        <span className="shrink-0 rounded bg-[var(--chip-muted-bg)] px-1 text-[10px] text-muted">혼합</span>
      )}
    </li>
  );
}

function GoldOptimizationTooltip({
  character,
  info,
  pos,
}: {
  character: User["characters"][number];
  info: GoldOptimizationInfo;
  pos: { x: number; y: number };
}) {
  const width = 272;
  const safeLeft =
    typeof window !== "undefined"
      ? Math.min(pos.x + 16, window.innerWidth - width - 8)
      : pos.x + 16;
  const safeTop =
    typeof window !== "undefined"
      ? Math.min(pos.y + 16, window.innerHeight - 280)
      : pos.y + 16;

  const sameOrder =
    info.byTotal.length === info.byNormal.length &&
    info.byTotal.every((r, i) => r.raidId === info.byNormal[i]?.raidId);

  return (
    <div
      className="pointer-events-none fixed z-[60] rounded-xl border border-border bg-surface text-left shadow-xl"
      style={{ left: safeLeft, top: safeTop, width }}
    >
      <div className="border-b border-border px-3 py-2">
        <p className="text-[12px] font-semibold text-foreground">
          {character.name} · 골드 최적화
        </p>
        <p className="text-[10px] text-muted">클릭 → 뭐가 남았더라</p>
      </div>

      <div className="space-y-3 px-3 py-2.5">
        <section>
          <p className="mb-1.5 text-[10px] font-semibold text-accent-soft">
            총 골드 우선 (귀속 포함) · {formatGold(info.totalSum)}
          </p>
          {info.byTotal.length > 0 ? (
            <ul className="space-y-1">
              {info.byTotal.map((r, i) => (
                <OptRaidRow key={r.raidId} opt={r} rank={i + 1} />
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-muted">골드 수급 레이드 없음</p>
          )}
        </section>

        {sameOrder ? (
          <p className="text-[10px] text-muted">유통 골드 순서 동일</p>
        ) : (
          <section>
            <p className="mb-1.5 text-[10px] font-semibold text-muted">
              유통 골드 우선 (일반만) · {formatGold(info.normalSum)}
            </p>
            {info.byNormal.length > 0 ? (
              <ul className="space-y-1">
                {info.byNormal.map((r, i) => (
                  <li key={r.raidId} className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-3 shrink-0 text-muted">{i + 1}.</span>
                    <span className="min-w-0 flex-1 truncate text-foreground">{r.label}</span>
                    <span className="shrink-0 font-semibold text-foreground">{formatGold(r.normal)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-muted">유통 골드 없음</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function CharacterCard({
  userId,
  nickname,
  character,
  goldOverrides,
  onEdit,
  onShowRemaining,
  onReorderRaids,
  onToggleGoldIncluded,
}: {
  userId: string;
  nickname: string;
  character: User["characters"][number];
  goldOverrides?: GoldOverrides;
  onEdit: () => void;
  onShowRemaining: () => void;
  onReorderRaids: (
    userId: string,
    characterId: string,
    raidIds: RaidId[],
  ) => void;
  onToggleGoldIncluded: () => void;
}) {
  const raids = listCharacterRaids(character);
  const clearedCount = raids.filter((r) => r.cleared).length;
  const gold = getCharacterGoldProgress(character, goldOverrides);
  const optimizationInfo = getGoldOptimizationInfo(character, goldOverrides);

  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (optimizationInfo.byTotal.length > 0) {
      setTooltipPos({ x: e.clientX, y: e.clientY });
      setTooltipVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setTooltipVisible(false);
  };

  return (
    <div
      className="min-w-0 flex-1 cursor-pointer rounded-lg border border-border bg-card text-left transition hover:border-border-strong hover:bg-card-hover"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onShowRemaining}
    >
      <div className="p-3 lg:p-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <h4 className="truncate text-sm font-medium">{character.name}</h4>
            <RoleBadge role={character.role} />
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] ${
                character.goldIncluded
                  ? "bg-[var(--chip-gold-bg)] text-accent-soft"
                  : "bg-[var(--chip-muted-bg)] text-muted"
              }`}
            >
              {character.goldIncluded ? "합산" : "제외"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {raids.length > 0 && clearedCount > 0 && (
              <span className="text-[10px] text-muted lg:hidden">{clearedCount}✓</span>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="rounded px-1.5 py-0.5 text-[10px] text-muted-subtle transition hover:text-muted"
            >
              편집
            </button>
          </div>
        </div>

        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onToggleGoldIncluded(); }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            e.stopPropagation();
            onToggleGoldIncluded();
          }}
          className="mt-1 inline-block whitespace-nowrap rounded-md border border-border px-2 py-0.5 text-[10px] text-muted transition hover:border-border-strong hover:text-foreground"
        >
          골드 합산 {character.goldIncluded ? "해제" : "포함"}
        </span>

        {raids.length > 0 ? (
          <div onClick={(e) => e.stopPropagation()}>
            <ReorderableRaidChips
              userId={userId}
              characterId={character.id}
              character={character}
              onReorder={onReorderRaids}
              className="mt-2.5 lg:mt-2"
            />
          </div>
        ) : (
          <p className="mt-2 text-[11px] text-muted">미배정</p>
        )}

        <p className="mt-1.5 text-[11px] text-muted">
          주간 골드 {formatGold(gold.current.total)} / {formatGold(gold.max.total)}
        </p>
        <p className="text-muted-subtle text-[11px]">
          {" "}
          - 귀속 {formatGold(gold.current.bound)} / {formatGold(gold.max.bound)}
        </p>
        <p className="text-muted-subtle text-[11px]">
          {" "}
          - 일반 {formatGold(gold.current.normal)} / {formatGold(gold.max.normal)}
        </p>

        <p className="mt-2 text-[10px] text-muted-subtle lg:hidden">
          {nickname}
        </p>
      </div>

      {tooltipVisible && (
        <GoldOptimizationTooltip
          character={character}
          info={optimizationInfo}
          pos={tooltipPos}
        />
      )}
    </div>
  );
}

function UserCard({
  user,
  goldOverrides,
  onEditUser,
  onEditCharacter,
  onReorderCharacters,
  onReorderCharacterRaids,
  onToggleCharacterGoldIncluded,
}: {
  user: User;
  goldOverrides?: GoldOverrides;
  onEditUser: () => void;
  onEditCharacter: (characterId: string) => void;
  onReorderCharacters: (userId: string, characterIds: string[]) => void;
  onReorderCharacterRaids: (
    userId: string,
    characterId: string,
    raidIds: RaidId[],
  ) => void;
  onToggleCharacterGoldIncluded: (userId: string, characterId: string) => void;
}) {
  const [showRemaining, setShowRemaining] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const clearedTotal = user.characters.reduce(
    (n, c) => n + c.clearedRaids.length,
    0,
  );
  const weeklyGold = getUserGoldProgress(user, goldOverrides);
  const characterIds = user.characters.map((c) => c.id);
  const characterDrag = useDragReorder<string>();

  return (
    <>
      {tooltipVisible && (
        <span
          className="pointer-events-none fixed z-50 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background shadow-lg"
          style={{ left: tooltipPos.x + 14, top: tooltipPos.y + 14 }}
        >
          뭐가..남았더라..?
        </span>
      )}
      <article
        className="flex flex-col rounded-xl border border-border bg-surface shadow-sm lg:min-h-0"
        style={{ boxShadow: "0 1px 3px var(--shadow)" }}
      >
        <header
          className="flex cursor-pointer items-center justify-between gap-2 border-b border-border px-3 py-2 lg:px-2.5 lg:py-2"
          onClick={() => setShowRemaining(true)}
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
          onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
        >
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-medium text-foreground">
              {user.nickname}
            </h3>
            <p className="text-[10px] text-muted">
              캐릭 {user.characters.length}
              {clearedTotal > 0 && ` · 클리어 ${clearedTotal}`}
            </p>
            <p className="text-[10px] text-accent-soft">
              주간 {formatGold(weeklyGold.current.total)} / {formatGold(weeklyGold.max.total)}
            </p>
            <p className="text-[10px] text-accent-soft">
              - 귀속 {formatGold(weeklyGold.current.bound)} / {formatGold(weeklyGold.max.bound)}
            </p>
            <p className="text-[10px] text-accent-soft">
              - 일반 {formatGold(weeklyGold.current.normal)} / {formatGold(weeklyGold.max.normal)}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditUser();
            }}
            onMouseEnter={() => setTooltipVisible(false)}
            onMouseLeave={() => setTooltipVisible(true)}
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
                  goldOverrides={goldOverrides}
                  onEdit={() => onEditCharacter(character.id)}
                  onShowRemaining={() => setShowRemaining(true)}
                  onReorderRaids={onReorderCharacterRaids}
                  onToggleGoldIncluded={() =>
                    onToggleCharacterGoldIncluded(user.id, character.id)
                  }
                />
              </DraggableCharacterRow>
            ))
          )}
        </div>
      </article>

      {showRemaining && (
        <RemainingRaidsDialog
          user={user}
          onClose={() => setShowRemaining(false)}
        />
      )}
    </>
  );
}

export default function Dashboard({
  users,
  actions,
  customClear,
  goldOverrides,
  onEditUser,
  onEditCharacter,
  onReorderCharacters,
  onReorderCharacterRaids,
  onToggleCharacterGoldIncluded,
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

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,4fr)_minmax(24rem,1.6fr)] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,6fr)_minmax(28rem,3fr)]">
        <div className="order-2 min-w-0 lg:order-1">
          {users.length === 0 ? (
            <div className="rounded-xl border border-dashed border-dashed-border bg-surface-muted py-16 text-center">
              <p className="text-sm text-muted">아직 등록된 유저가 없어요.</p>
              <p className="mt-1 text-xs text-muted-subtle">
                아래에서 유저와 캐릭터를 추가해 보세요.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  goldOverrides={goldOverrides}
                  onEditUser={() => onEditUser(user.id)}
                  onEditCharacter={(characterId) =>
                    onEditCharacter(user.id, characterId)
                  }
                  onReorderCharacters={onReorderCharacters}
                  onReorderCharacterRaids={onReorderCharacterRaids}
                  onToggleCharacterGoldIncluded={onToggleCharacterGoldIncluded}
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
