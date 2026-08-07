"use client";

import { listCharacterRaids } from "@/lib/character-raids";
import { DEFAULT_RAID_DEFINITIONS, type RaidDefinition, type RaidId } from "@/lib/raids";
import type { Character } from "@/lib/types";
import { useDragReorder } from "@/hooks/useDragReorder";
import ReorderGrip from "@/components/ui/ReorderGrip";
import RaidChip from "@/components/ui/RaidChip";

export default function ReorderableRaidChips({
  userId,
  characterId,
  character,
  raids: raidDefs = DEFAULT_RAID_DEFINITIONS,
  recommendedRaidIds,
  onReorder,
  vertical = false,
  className = "",
}: {
  userId: string;
  characterId: string;
  character: Character;
  raids?: RaidDefinition[];
  /** 골드를 받아야 하는 레이드 (유저 골드 설정 기준) */
  recommendedRaidIds?: Set<RaidId>;
  onReorder: (userId: string, characterId: string, raidIds: RaidId[]) => void;
  /** 한 줄에 레이드 하나씩 세로로 쌓기 (가로 정렬 레이아웃용) */
  vertical?: boolean;
  className?: string;
}) {
  const raids = listCharacterRaids(character, raidDefs);
  const raidIds = character.assignedRaids;
  const {
    dragIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    createDropHandler,
  } = useDragReorder<RaidId>();

  if (raids.length === 0) return null;

  return (
    <div
      className={`flex ${
        vertical ? "flex-col items-stretch gap-1" : "flex-wrap gap-2"
      } ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {raids.map((raid, index) => (
        <span
          key={raid.id}
          draggable
          onDragStart={handleDragStart(index)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={createDropHandler(index, raidIds, (nextIds) =>
            onReorder(userId, characterId, nextIds),
          )}
          className={`inline-flex cursor-grab items-center gap-0.5 rounded-md active:cursor-grabbing ${
            vertical ? "min-w-0" : ""
          } ${dragIndex === index ? "opacity-40" : ""}`}
        >
          <ReorderGrip asHandle={false} label="레이드 순서 변경" />
          <RaidChip
            label={raid.label}
            noGold={raid.noGold}
            bonus={raid.bonus}
            cleared={raid.cleared}
            recommended={recommendedRaidIds?.has(raid.id)}
            stretch={vertical}
          />
        </span>
      ))}
    </div>
  );
}
