"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import type { RaidId } from "@/lib/raids";
import { getRaid, RAID_DEFINITIONS } from "@/lib/raids";
import type { GoldPriority, User } from "@/lib/types";
import { GOLD_PRIORITY_LABEL, GOLD_PRIORITY_SHORT } from "@/lib/types";
import { useDragReorder } from "@/hooks/useDragReorder";
import { usePersistedFlag } from "@/hooks/usePersistedFlag";
import { usePersistedOrder } from "@/hooks/usePersistedOrder";
import ReorderableRaidChips from "@/components/ReorderableRaidChips";
import DraggableReorderRow from "@/components/DraggableReorderRow";
import RoleBadge from "@/components/ui/RoleBadge";
import { listCharacterRaids } from "@/lib/character-raids";
import {
  formatGold,
  getCharacterGoldProgress,
  getGoldOptimizationInfo,
  getGoldTieGroups,
  getRecommendedGoldRaidIds,
  getUserGoldProgress,
  userGoldPlan,
  type GoldOptimizationInfo,
  type GoldPlan,
  type RaidGoldOption,
} from "@/lib/gold";
import type { GoldOverrides } from "@/lib/gold-overrides";

/** 골드 기준 스위치 위에서는 커서 자체가 이 마스코트로 바뀐다 */
const GOLD_PEEK_IMAGE = "/more.png";
const GOLD_PEEK_SIZE = 72;

/** 우측 사이드(파티 추천) 접힘 상태 — 접으면 대시보드가 그만큼 넓어진다 */
const SIDE_OPEN_KEY = "daengmang-dashboard-side-open";
/** 대시보드 본문(유저 카드 + 사이드) 접힘 상태 */
const BOARD_OPEN_KEY = "daengmang-dashboard-open";
/** 가로 정렬(한 유저 = 한 행) 사용 여부 */
const ROW_LAYOUT_KEY = "daengmang-dashboard-row-layout";
/** 유저 카드 표시 순서 (브라우저별) */
const USER_ORDER_KEY = "daengmang-dashboard-user-order";
/** 골드 합산 제외 캐릭터를 펼쳐 뒀는지 (캐릭터 id별) */
const CHAR_EXPANDED_KEY_PREFIX = "daengmang-char-expanded:";

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
  onSetUserGoldPriority: (userId: string, priority: GoldPriority) => void;
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

/**
 * 총골드 ↔ 유통 전환 스위치.
 * 켜짐/꺼짐이 아니라 동등한 두 선택지라 트랙은 항상 같은 톤이고 노브만 좌우로 움직인다.
 * 주변에 주황이 이미 많아 껍데기는 중립 톤으로 두고, 노브에만 액센트를 남긴다.
 */
function GoldPriorityToggle({
  priority,
  onChange,
  onPeek,
}: {
  priority: GoldPriority;
  onChange: (priority: GoldPriority) => void;
  /** 커서 위에 붙는 마스코트 위치. null이면 숨김. */
  onPeek: (pos: { x: number; y: number } | null) => void;
}) {
  const isNormal = priority === "normal";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isNormal}
      aria-label={`골드 기준: ${GOLD_PRIORITY_LABEL[priority]}`}
      title={`${GOLD_PRIORITY_LABEL[priority]} — 눌러서 전환`}
      onClick={(e) => {
        e.stopPropagation();
        onPeek({ x: e.clientX, y: e.clientY });
        onChange(isNormal ? "total" : "normal");
      }}
      onMouseEnter={(e) => onPeek({ x: e.clientX, y: e.clientY })}
      onMouseMove={(e) => onPeek({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => onPeek(null)}
      className="group flex shrink-0 items-center gap-1 rounded-full border border-border bg-[var(--chip-muted-bg)] py-0.5 pl-0.5 pr-1.5 transition hover:border-accent/60 hover:bg-[var(--chip-gold-bg)]"
    >
      {/* 트랙에 테두리를 둘러 스위치라는 게 한눈에 보이게 한다 */}
      <span className="relative block h-4 w-7 rounded-full border border-border-strong bg-[var(--toggle-track)] transition group-hover:border-accent/50">
        <span
          className="absolute top-0.5 h-2.5 w-2.5 rounded-full bg-accent transition-all duration-150"
          style={{ left: isNormal ? "0.875rem" : "0.125rem" }}
        />
      </span>
      <span className="whitespace-nowrap text-[10px] font-semibold text-foreground transition group-hover:text-accent-soft">
        {GOLD_PRIORITY_SHORT[priority]}
      </span>
    </button>
  );
}

function GoldTieNotice({ groups }: { groups: RaidGoldOption[][] }) {
  if (groups.length === 0) return null;

  return (
    <section className="rounded-lg border border-dashed border-border px-2 py-1.5">
      <p className="mb-1 text-[10px] font-semibold text-muted">
        ⇄ 골드 동일 — 편한 쪽으로
      </p>
      {groups.map((group) => (
        <p
          key={group.map((r) => r.raidId).join("|")}
          className="text-[11px] leading-snug text-foreground"
        >
          {group.map((r) => r.label).join(" = ")}
        </p>
      ))}
    </section>
  );
}

function GoldOptimizationTooltip({
  character,
  info,
  tieGroups,
  pos,
}: {
  character: User["characters"][number];
  info: GoldOptimizationInfo;
  tieGroups: RaidGoldOption[][];
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

        <GoldTieNotice groups={tieGroups} />
      </div>
    </div>
  );
}

function GoldIncludedBadge({ included }: { included: boolean }) {
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] ${
        included
          ? "bg-[var(--chip-gold-bg)] text-accent-soft"
          : "bg-[var(--chip-muted-bg)] text-muted"
      }`}
    >
      {included ? "합산" : "제외"}
    </span>
  );
}

function CharacterCard({
  userId,
  nickname,
  character,
  goldPlan,
  goldOverrides,
  onEdit,
  onShowRemaining,
  onReorderRaids,
  onToggleGoldIncluded,
  rowLayout = false,
}: {
  userId: string;
  nickname: string;
  character: User["characters"][number];
  goldPlan: GoldPlan;
  goldOverrides?: GoldOverrides;
  /** 가로 정렬 레이아웃 — 폭이 좁아 정보를 줄 단위로 쌓는다 */
  rowLayout?: boolean;
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
  const recommendedRaidIds = getRecommendedGoldRaidIds(
    character,
    goldPlan,
    goldOverrides,
  );
  const tieGroups = getGoldTieGroups(character, goldPlan, goldOverrides);

  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [expanded, toggleExpanded] = usePersistedFlag(
    `${CHAR_EXPANDED_KEY_PREFIX}${character.id}`,
    false,
  );

  /** 골드 합산에서 빠진 캐릭은 볼 게 적어서 기본으로 접어 이름만 남긴다 */
  const collapsible = !character.goldIncluded;
  const collapsed = collapsible && !expanded;

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
        {/* 가로 정렬은 폭이 좁아 이름 줄과 뱃지 줄을 나눈다 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
            <h4 className="truncate text-sm font-medium">{character.name}</h4>
            {!rowLayout && !collapsed && (
              <>
                <RoleBadge role={character.role} />
                <GoldIncludedBadge included={character.goldIncluded} />
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {raids.length > 0 && clearedCount > 0 && !collapsed && (
              <span className="text-[10px] text-muted lg:hidden">{clearedCount}✓</span>
            )}
            {collapsible && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded();
                }}
                aria-expanded={expanded}
                title={collapsed ? "펼치기 (골드 합산 제외)" : "접기"}
                className="rounded border border-border px-1 text-[10px] leading-tight text-muted-subtle transition hover:border-border-strong hover:text-muted"
              >
                {collapsed ? "+" : "−"}
              </button>
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

        {!collapsed && (
          <>
          {rowLayout && (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <RoleBadge role={character.role} />
              <GoldIncludedBadge included={character.goldIncluded} />
            </div>
          )}

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
                recommendedRaidIds={recommendedRaidIds}
                onReorder={onReorderRaids}
                vertical={rowLayout}
                className="mt-2.5 lg:mt-2"
              />
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-muted">미배정</p>
          )}

          {tieGroups.map((group) => (
            <p
              key={group.map((r) => r.raidId).join("|")}
              className="mt-1.5 text-[10px] leading-snug text-muted"
              title="골드가 같아 어느 쪽을 골라도 됩니다"
            >
              ⇄ {group.map((r) => r.label).join(" = ")} (골드 동일)
            </p>
          ))}

          {rowLayout ? (
            <p className="mt-1.5 text-[11px] text-muted">
              주간 골드:
              <br />
              {formatGold(gold.current.total)} / {formatGold(gold.max.total)}
            </p>
          ) : (
            <p className="mt-1.5 text-[11px] text-muted">
              주간 골드 {formatGold(gold.current.total)} / {formatGold(gold.max.total)}
            </p>
          )}
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
          </>
        )}
      </div>

      {tooltipVisible && (
        <GoldOptimizationTooltip
          character={character}
          info={optimizationInfo}
          tieGroups={tieGroups}
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
  onSetGoldPriority,
  rowLayout = false,
}: {
  user: User;
  goldOverrides?: GoldOverrides;
  /** 한 유저가 한 행을 차지하고 캐릭터가 가로로 늘어서는 배치 */
  rowLayout?: boolean;
  onEditUser: () => void;
  onEditCharacter: (characterId: string) => void;
  onReorderCharacters: (userId: string, characterIds: string[]) => void;
  onReorderCharacterRaids: (
    userId: string,
    characterId: string,
    raidIds: RaidId[],
  ) => void;
  onToggleCharacterGoldIncluded: (userId: string, characterId: string) => void;
  onSetGoldPriority: (priority: GoldPriority) => void;
}) {
  const [showRemaining, setShowRemaining] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [goldPeek, setGoldPeek] = useState<{ x: number; y: number } | null>(
    null,
  );
  const clearedTotal = user.characters.reduce(
    (n, c) => n + c.clearedRaids.length,
    0,
  );
  const weeklyGold = getUserGoldProgress(user, goldOverrides);
  const goldPlan = userGoldPlan(user);
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
      {goldPeek && (
        <div
          key={user.goldPriority}
          className="gold-peek pointer-events-none fixed z-[60] select-none"
          style={{
            left: Math.min(
              goldPeek.x + 14,
              (typeof window !== "undefined" ? window.innerWidth : 9999) -
                GOLD_PEEK_SIZE -
                8,
            ),
            top: Math.max(goldPeek.y - GOLD_PEEK_SIZE - 4, 8),
          }}
          aria-hidden
        >
          <Image
            src={GOLD_PEEK_IMAGE}
            alt=""
            width={GOLD_PEEK_SIZE}
            height={GOLD_PEEK_SIZE}
            className="drop-shadow-lg"
          />
        </div>
      )}
      <article
        className={`flex rounded-xl border border-border bg-surface shadow-sm lg:min-h-0 ${
          rowLayout ? "flex-col lg:flex-row lg:items-stretch" : "flex-col"
        }`}
        style={{ boxShadow: "0 1px 3px var(--shadow)" }}
      >
        <header
          className={`flex cursor-pointer items-center justify-between gap-2 border-b border-border px-3 py-2 lg:px-2.5 lg:py-2 ${
            rowLayout
              ? "lg:w-40 lg:shrink-0 lg:flex-col lg:items-start lg:justify-start lg:gap-1 lg:px-2 lg:border-b-0 lg:border-r"
              : ""
          }`}
          onClick={() => setShowRemaining(true)}
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
          onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
        >
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <h3 className="truncate text-[13px] font-medium text-foreground">
                {user.nickname}
              </h3>
              <GoldPriorityToggle
                priority={user.goldPriority}
                onChange={onSetGoldPriority}
                onPeek={(pos) => {
                  setGoldPeek(pos);
                  setTooltipVisible(pos === null);
                }}
              />
            </div>
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

        <div
          className={`flex flex-1 flex-col gap-2.5 p-2.5 lg:gap-2 lg:p-2 ${
            // 캐릭터를 격자로 깔아 화면 폭과 무관하게 한 줄에 정해진 수가 들어가게 한다
            rowLayout ? "lg:grid lg:grid-cols-4 xl:grid-cols-6" : ""
          }`}
        >
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
              <DraggableReorderRow
                key={character.id}
                index={index}
                itemIds={characterIds}
                label="캐릭터 순서 변경"
                drag={characterDrag}
                onReorder={(nextIds) => onReorderCharacters(user.id, nextIds)}
                className={rowLayout ? "min-w-0" : ""}
              >
                <CharacterCard
                  userId={user.id}
                  nickname={user.nickname}
                  character={character}
                  goldPlan={goldPlan}
                  goldOverrides={goldOverrides}
                  rowLayout={rowLayout}
                  onEdit={() => onEditCharacter(character.id)}
                  onShowRemaining={() => setShowRemaining(true)}
                  onReorderRaids={onReorderCharacterRaids}
                  onToggleGoldIncluded={() =>
                    onToggleCharacterGoldIncluded(user.id, character.id)
                  }
                />
              </DraggableReorderRow>
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
  onSetUserGoldPriority,
}: DashboardProps) {
  const totalCharacters = users.reduce((n, u) => n + u.characters.length, 0);
  const [sideOpen, toggleSide] = usePersistedFlag(SIDE_OPEN_KEY, true);
  const [boardOpen, toggleBoard] = usePersistedFlag(BOARD_OPEN_KEY, true);
  const [rowLayout, toggleRowLayout] = usePersistedFlag(ROW_LAYOUT_KEY, false);
  const [orderedUserIds, setUserOrder] = usePersistedOrder(
    USER_ORDER_KEY,
    users.map((u) => u.id),
  );
  const orderedUsers = orderedUserIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is User => u !== undefined);
  const userDrag = useDragReorder<string>();

  return (
    <section id="dashboard" className="space-y-4 lg:space-y-5">
      <div className="flex items-end justify-between gap-4">
        <button
          type="button"
          onClick={toggleBoard}
          aria-expanded={boardOpen}
          className="group flex items-center gap-2.5 text-left"
        >
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-xs text-muted transition group-hover:border-border-strong group-hover:text-foreground"
            aria-hidden
          >
            {boardOpen ? "−" : "+"}
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-tight lg:text-xl">
              대시보드
            </span>
            <span className="mt-0.5 block text-sm text-muted">
              유저 {users.length}명 · 캐릭터 {totalCharacters}명
              {boardOpen && (
                <span className="hidden text-muted-subtle sm:inline">
                  {" "}
                  · ⠿ 드래그로 순서 변경
                </span>
              )}
            </span>
          </span>
        </button>

        {boardOpen && (
          <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5">
            {[
              { id: "grid", label: "카드", active: !rowLayout },
              { id: "row", label: "가로", active: rowLayout },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  if (!mode.active) toggleRowLayout();
                }}
                aria-pressed={mode.active}
                title={
                  mode.id === "row"
                    ? "한 유저가 한 줄 · 캐릭터를 가로로"
                    : "유저 카드를 격자로"
                }
                className={`rounded-md px-2 py-1 text-[11px] transition ${
                  mode.active
                    ? "bg-[var(--chip-muted-bg)] font-semibold text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {boardOpen && (
        <div
          className={`flex flex-col gap-4 lg:grid lg:items-start lg:gap-6 ${
            sideOpen
              ? "lg:grid-cols-[minmax(0,4fr)_minmax(24rem,1.6fr)] xl:grid-cols-[minmax(0,6fr)_minmax(28rem,3fr)]"
              : "lg:grid-cols-[minmax(0,1fr)_2.25rem] lg:gap-3"
          }`}
        >
          <div className="order-2 min-w-0 lg:order-1">
            {users.length === 0 ? (
              <div className="rounded-xl border border-dashed border-dashed-border bg-surface-muted py-16 text-center">
                <p className="text-sm text-muted">아직 등록된 유저가 없어요.</p>
                <p className="mt-1 text-xs text-muted-subtle">
                  아래에서 유저와 캐릭터를 추가해 보세요.
                </p>
              </div>
            ) : (
              <div
                className={
                  rowLayout
                    ? "flex flex-col gap-3"
                    : "grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                }
              >
                {orderedUsers.map((user, index) => (
                  <DraggableReorderRow
                    key={user.id}
                    index={index}
                    itemIds={orderedUserIds}
                    label="유저 순서 변경"
                    drag={userDrag}
                    onReorder={setUserOrder}
                    className="min-w-0"
                  >
                    <UserCard
                      user={user}
                      goldOverrides={goldOverrides}
                      rowLayout={rowLayout}
                      onEditUser={() => onEditUser(user.id)}
                      onEditCharacter={(characterId) =>
                        onEditCharacter(user.id, characterId)
                      }
                      onReorderCharacters={onReorderCharacters}
                      onReorderCharacterRaids={onReorderCharacterRaids}
                      onToggleCharacterGoldIncluded={
                        onToggleCharacterGoldIncluded
                      }
                      onSetGoldPriority={(priority) =>
                        onSetUserGoldPriority(user.id, priority)
                      }
                    />
                  </DraggableReorderRow>
                ))}
              </div>
            )}
          </div>

          <aside
            className={`daengmang-scroll order-1 lg:order-2 lg:sticky lg:top-[4.25rem] lg:max-h-[calc(100dvh-5.5rem)] lg:pr-1 ${
              sideOpen ? "space-y-2 lg:overflow-y-auto" : ""
            }`}
          >
            {sideOpen ? (
              <>
                <button
                  type="button"
                  onClick={toggleSide}
                  aria-expanded
                  className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-[11px] text-muted transition hover:border-border-strong hover:text-foreground"
                >
                  <span aria-hidden>→</span> 접기
                </button>
                {actions}
              </>
            ) : (
              <button
                type="button"
                onClick={toggleSide}
                aria-expanded={false}
                title="파티 추천 펼치기"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-muted px-2 py-2 text-[11px] text-muted transition hover:border-border-strong hover:text-foreground lg:h-[calc(100dvh-5.5rem)] lg:flex-col lg:py-4"
              >
                <span aria-hidden className="hidden lg:inline">
                  ←
                </span>
                <span className="lg:[writing-mode:vertical-rl]">파티 추천</span>
                <span className="lg:hidden">펼치기</span>
              </button>
            )}
          </aside>
        </div>
      )}

      {customClear}
    </section>
  );
}
