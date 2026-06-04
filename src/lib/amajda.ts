import type { AmajdaItem, Character, User } from "@/lib/types";

export interface AmajdaProgress {
  total: number;
  checked: number;
}

export function getAmajdaProgress(
  items: AmajdaItem[],
  checkedIds: string[],
): AmajdaProgress {
  const total = items.length;
  const checkedSet = new Set(checkedIds);
  const checked = items.filter((item) => checkedSet.has(item.id)).length;
  return { total, checked };
}

export function getCharacterAmajdaProgress(character: Character): AmajdaProgress {
  return getAmajdaProgress(character.amajdaItems, character.amajdaChecked);
}

export function getUserAmajdaProgress(user: User): AmajdaProgress {
  const userPart = getAmajdaProgress(user.amajdaItems, user.amajdaChecked);
  const charParts = user.characters.map(getCharacterAmajdaProgress);
  return {
    total: userPart.total + charParts.reduce((n, p) => n + p.total, 0),
    checked: userPart.checked + charParts.reduce((n, p) => n + p.checked, 0),
  };
}

export function isAmajdaItemChecked(
  itemId: string,
  checkedIds: string[],
): boolean {
  return checkedIds.includes(itemId);
}

/** 항목이 없거나 모두 체크됨 */
export function isUserAmajdaFullyChecked(user: User): boolean {
  const progress = getUserAmajdaProgress(user);
  if (progress.total === 0) return true;
  return progress.checked === progress.total;
}

/** 다이얼로그: 하나라도 체크된 항목이 있으면 true */
export function hasAnyAmajdaItemChecked(users: User[]): boolean {
  return users.some(
    (user) =>
      user.amajdaChecked.length > 0 ||
      user.characters.some((character) => character.amajdaChecked.length > 0),
  );
}
