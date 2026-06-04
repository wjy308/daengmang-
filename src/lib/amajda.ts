import type { AmajdaItem, Character, User } from "@/lib/types";

/** 수요일 10시(KST) 주간 리셋 시 체크도 함께 초기화 (기본값) */
export function resetsAmajdaItemWeekly(item: AmajdaItem): boolean {
  return item.resetWeekly !== false;
}

function keepPersistentAmajdaChecks(
  items: AmajdaItem[],
  checkedIds: string[],
): string[] {
  const persistentIds = new Set(
    items.filter((item) => !resetsAmajdaItemWeekly(item)).map((item) => item.id),
  );
  return checkedIds.filter((id) => persistentIds.has(id));
}

/** 레이드 주간 리셋 시: 수요일 초기화 항목만 체크 해제 */
export function applyWeeklyAmajdaResetToUser(user: User): User {
  return {
    ...user,
    amajdaChecked: keepPersistentAmajdaChecks(
      user.amajdaItems,
      user.amajdaChecked,
    ),
    characters: user.characters.map((character) => ({
      ...character,
      amajdaChecked: keepPersistentAmajdaChecks(
        character.amajdaItems,
        character.amajdaChecked,
      ),
    })),
  };
}

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
