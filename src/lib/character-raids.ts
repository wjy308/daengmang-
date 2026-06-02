import type { RaidId } from "./raids";
import { getRaid } from "./raids";
import type { Character } from "./types";

export interface CharacterRaidEntry {
  id: RaidId;
  label: string;
  noGold: boolean;
  bonus: boolean;
  cleared: boolean;
}

/** assignedRaids 배열 순서 그대로 표시 */
export function listCharacterRaids(character: Character): CharacterRaidEntry[] {
  return character.assignedRaids.map((id) => ({
    id,
    label: getRaid(id).label,
    noGold: character.noGoldRaids.includes(id),
    bonus: character.bonusRaids.includes(id),
    cleared: character.clearedRaids.includes(id),
  }));
}

/** @deprecated listCharacterRaids 사용 */
export const sortCharacterRaids = listCharacterRaids;
