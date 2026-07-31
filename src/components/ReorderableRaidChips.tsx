"use client";

import { listCharacterRaids } from "@/lib/character-raids";
import type { RaidId } from "@/lib/raids";
import type { Character } from "@/lib/types";
import { useDragReorder } from "@/hooks/useDragReorder";
import ReorderGrip from "@/components/ui/ReorderGrip";
import RaidChip from "@/components/ui/RaidChip";

export default function ReorderableRaidChips({
  userId,
  characterId,
  character,
  recommendedRaidIds,
  onReorder,
  className = "",
}: {
  userId: string;
  characterId: string;
  character: Character;
  /** 골드를 받아야 하는 레이드 (유저 골드 설정 기준) */
  recommendedRaidIds?: Set<RaidId>;
  onReorder: (userId: string, characterId: string, raidIds: RaidId[]) => void;
  className?: string;
}) {
  const raids = listCharacterRaids(character);
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
      className={`flex flex-wrap gap-2 ${className}`}
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
            dragIndex === index ? "opacity-40" : ""
          }`}
        >
          <ReorderGrip asHandle={false} label="레이드 순서 변경" />
          <RaidChip
            label={raid.label}
            noGold={raid.noGold}
            bonus={raid.bonus}
            cleared={raid.cleared}
            recommended={recommendedRaidIds?.has(raid.id)}
          />
        </span>
      ))}
    </div>
  );
}
