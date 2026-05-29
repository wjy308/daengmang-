import type { RaidId } from "./raids";
import { getRaid } from "./raids";
import type { Character } from "./types";

export interface SortedRaidEntry {
  id: RaidId;
  label: string;
  noGold: boolean;
}

/** 골드 O → 무골 순으로 정렬 (캐릭터별) */
export function sortCharacterRaids(character: Character): SortedRaidEntry[] {
  const withGold: SortedRaidEntry[] = [];
  const noGold: SortedRaidEntry[] = [];

  for (const id of character.assignedRaids) {
    const entry: SortedRaidEntry = {
      id,
      label: getRaid(id).label,
      noGold: character.noGoldRaids.includes(id),
    };
    if (entry.noGold) noGold.push(entry);
    else withGold.push(entry);
  }

  return [...withGold, ...noGold];
}
