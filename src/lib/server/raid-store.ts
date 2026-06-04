import { randomUUID } from "crypto";
import type { RaidId } from "@/lib/raids";
import { sameIdSet } from "@/lib/reorder";
import { loadStoredData, saveStoredData } from "@/lib/server/storage";
import type { AmajdaItem, Character, CharacterRole, User } from "@/lib/types";

const MAX_GOLD_CHARACTERS = 6;

function includedGoldCharacterCount(user: User): number {
  return user.characters.filter((c) => c.goldIncluded).length;
}

export async function getUsers(): Promise<User[]> {
  const data = await loadStoredData();
  return data.users;
}

export async function addUser(nickname: string): Promise<User> {
  const trimmed = nickname.trim();
  if (!trimmed) {
    throw new Error("닉네임을 입력해 주세요.");
  }

  const data = await loadStoredData();
  const user: User = {
    id: randomUUID(),
    nickname: trimmed,
    characters: [],
    amajdaItems: [],
    amajdaChecked: [],
  };
  data.users.push(user);
  await saveStoredData(data);
  return user;
}

export async function removeUser(userId: string): Promise<void> {
  const data = await loadStoredData();
  data.users = data.users.filter((u) => u.id !== userId);
  await saveStoredData(data);
}

export async function addCharacter(
  userId: string,
  name: string,
  role: CharacterRole,
): Promise<Character> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("캐릭터 이름을 입력해 주세요.");
  }

  const data = await loadStoredData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("유저를 찾을 수 없습니다.");
  }

  const character: Character = {
    id: randomUUID(),
    name: trimmed,
    role,
    goldIncluded: includedGoldCharacterCount(user) < MAX_GOLD_CHARACTERS,
    assignedRaids: [],
    noGoldRaids: [],
    bonusRaids: [],
    clearedRaids: [],
    amajdaItems: [],
    amajdaChecked: [],
  };
  user.characters.push(character);
  await saveStoredData(data);
  return character;
}

export async function removeCharacter(
  userId: string,
  characterId: string,
): Promise<void> {
  const data = await loadStoredData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("유저를 찾을 수 없습니다.");
  }
  user.characters = user.characters.filter((c) => c.id !== characterId);
  await saveStoredData(data);
}

export async function setCharacterRole(
  userId: string,
  characterId: string,
  role: CharacterRole,
): Promise<void> {
  const data = await loadStoredData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("유저를 찾을 수 없습니다.");
  }
  const character = user.characters.find((c) => c.id === characterId);
  if (!character) {
    throw new Error("캐릭터를 찾을 수 없습니다.");
  }
  character.role = role;
  await saveStoredData(data);
}

export async function toggleCharacterRaid(
  userId: string,
  characterId: string,
  raidId: Character["assignedRaids"][number],
): Promise<void> {
  const data = await loadStoredData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("유저를 찾을 수 없습니다.");
  }
  const character = user.characters.find((c) => c.id === characterId);
  if (!character) {
    throw new Error("캐릭터를 찾을 수 없습니다.");
  }

  const assigned = character.assignedRaids.includes(raidId);
  if (assigned) {
    character.assignedRaids = character.assignedRaids.filter(
      (r) => r !== raidId,
    );
    character.noGoldRaids = character.noGoldRaids.filter((r) => r !== raidId);
    character.bonusRaids = character.bonusRaids.filter((r) => r !== raidId);
    character.clearedRaids = character.clearedRaids.filter((r) => r !== raidId);
  } else {
    character.assignedRaids.push(raidId);
  }
  await saveStoredData(data);
}

export interface PartyClearMember {
  userId: string;
  characterId: string;
}

export async function markPartyCleared(
  raidId: Character["assignedRaids"][number],
  members: PartyClearMember[],
): Promise<void> {
  const data = await loadStoredData();

  for (const member of members) {
    const user = data.users.find((u) => u.id === member.userId);
    if (!user) continue;
    const character = user.characters.find((c) => c.id === member.characterId);
    if (!character) continue;
    if (!character.clearedRaids.includes(raidId)) {
      character.clearedRaids.push(raidId);
    }
  }

  await saveStoredData(data);
}

export async function unmarkPartyCleared(
  raidId: Character["assignedRaids"][number],
  members: PartyClearMember[],
): Promise<void> {
  const data = await loadStoredData();

  for (const member of members) {
    const user = data.users.find((u) => u.id === member.userId);
    if (!user) continue;
    const character = user.characters.find((c) => c.id === member.characterId);
    if (!character) continue;
    if (character.clearedRaids.includes(raidId)) {
      character.clearedRaids = character.clearedRaids.filter(
        (r) => r !== raidId,
      );
    }
  }

  await saveStoredData(data);
}

export async function reorderCharacters(
  userId: string,
  characterIds: string[],
): Promise<void> {
  const data = await loadStoredData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("유저를 찾을 수 없습니다.");
  }

  const existingIds = user.characters.map((c) => c.id);
  if (!sameIdSet(characterIds, existingIds)) {
    throw new Error("캐릭터 목록이 일치하지 않습니다.");
  }

  const byId = new Map(user.characters.map((c) => [c.id, c]));
  user.characters = characterIds.map((id) => {
    const character = byId.get(id);
    if (!character) throw new Error("캐릭터를 찾을 수 없습니다.");
    return character;
  });
  await saveStoredData(data);
}

export async function reorderCharacterRaids(
  userId: string,
  characterId: string,
  raidIds: RaidId[],
): Promise<void> {
  const data = await loadStoredData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("유저를 찾을 수 없습니다.");
  }
  const character = user.characters.find((c) => c.id === characterId);
  if (!character) {
    throw new Error("캐릭터를 찾을 수 없습니다.");
  }

  if (!sameIdSet(raidIds, character.assignedRaids)) {
    throw new Error("레이드 목록이 일치하지 않습니다.");
  }

  character.assignedRaids = [...raidIds];
  await saveStoredData(data);
}

export async function toggleCharacterNoGold(
  userId: string,
  characterId: string,
  raidId: Character["noGoldRaids"][number],
): Promise<void> {
  const data = await loadStoredData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("유저를 찾을 수 없습니다.");
  }
  const character = user.characters.find((c) => c.id === characterId);
  if (!character) {
    throw new Error("캐릭터를 찾을 수 없습니다.");
  }
  if (!character.assignedRaids.includes(raidId)) {
    return;
  }

  const noGold = character.noGoldRaids.includes(raidId);
  if (noGold) {
    character.noGoldRaids = character.noGoldRaids.filter((r) => r !== raidId);
  } else {
    character.noGoldRaids = [...character.noGoldRaids, raidId];
    character.bonusRaids = character.bonusRaids.filter((r) => r !== raidId);
  }
  await saveStoredData(data);
}

export async function toggleCharacterBonus(
  userId: string,
  characterId: string,
  raidId: Character["assignedRaids"][number],
): Promise<void> {
  const data = await loadStoredData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("유저를 찾을 수 없습니다.");
  }
  const character = user.characters.find((c) => c.id === characterId);
  if (!character) {
    throw new Error("캐릭터를 찾을 수 없습니다.");
  }
  if (!character.assignedRaids.includes(raidId)) {
    return;
  }

  const bonus = character.bonusRaids.includes(raidId);
  character.bonusRaids = bonus
    ? character.bonusRaids.filter((r) => r !== raidId)
    : [...character.bonusRaids, raidId];
  await saveStoredData(data);
}

export async function toggleCharacterGoldIncluded(
  userId: string,
  characterId: string,
): Promise<void> {
  const data = await loadStoredData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("유저를 찾을 수 없습니다.");
  }
  const character = user.characters.find((c) => c.id === characterId);
  if (!character) {
    throw new Error("캐릭터를 찾을 수 없습니다.");
  }

  if (character.goldIncluded) {
    character.goldIncluded = false;
    await saveStoredData(data);
    return;
  }

  const included = includedGoldCharacterCount(user);
  if (included >= MAX_GOLD_CHARACTERS) {
    throw new Error("골드 합산 캐릭터는 유저당 최대 6명까지 선택할 수 있습니다.");
  }

  character.goldIncluded = true;
  await saveStoredData(data);
}

function normalizeAmajdaLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) {
    throw new Error("항목 이름을 입력해 주세요.");
  }
  return trimmed;
}

function normalizeAmajdaPeriod(period?: string): string | undefined {
  const trimmed = period?.trim();
  return trimmed ? trimmed : undefined;
}

export async function addUserAmajdaItem(
  userId: string,
  label: string,
  period?: string,
): Promise<AmajdaItem> {
  const data = await loadStoredData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("유저를 찾을 수 없습니다.");
  }

  const item: AmajdaItem = {
    id: randomUUID(),
    label: normalizeAmajdaLabel(label),
    period: normalizeAmajdaPeriod(period),
  };
  user.amajdaItems.push(item);
  await saveStoredData(data);
  return item;
}

export async function removeUserAmajdaItem(
  userId: string,
  itemId: string,
): Promise<void> {
  const data = await loadStoredData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("유저를 찾을 수 없습니다.");
  }

  user.amajdaItems = user.amajdaItems.filter((item) => item.id !== itemId);
  user.amajdaChecked = user.amajdaChecked.filter((id) => id !== itemId);
  await saveStoredData(data);
}

export async function toggleUserAmajdaChecked(
  userId: string,
  itemId: string,
): Promise<void> {
  const data = await loadStoredData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("유저를 찾을 수 없습니다.");
  }
  if (!user.amajdaItems.some((item) => item.id === itemId)) {
    throw new Error("체크리스트 항목을 찾을 수 없습니다.");
  }

  const checked = user.amajdaChecked.includes(itemId);
  user.amajdaChecked = checked
    ? user.amajdaChecked.filter((id) => id !== itemId)
    : [...user.amajdaChecked, itemId];
  await saveStoredData(data);
}

export async function addCharacterAmajdaItem(
  userId: string,
  characterId: string,
  label: string,
  period?: string,
): Promise<AmajdaItem> {
  const data = await loadStoredData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("유저를 찾을 수 없습니다.");
  }
  const character = user.characters.find((c) => c.id === characterId);
  if (!character) {
    throw new Error("캐릭터를 찾을 수 없습니다.");
  }

  const item: AmajdaItem = {
    id: randomUUID(),
    label: normalizeAmajdaLabel(label),
    period: normalizeAmajdaPeriod(period),
  };
  character.amajdaItems.push(item);
  await saveStoredData(data);
  return item;
}

export async function removeCharacterAmajdaItem(
  userId: string,
  characterId: string,
  itemId: string,
): Promise<void> {
  const data = await loadStoredData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("유저를 찾을 수 없습니다.");
  }
  const character = user.characters.find((c) => c.id === characterId);
  if (!character) {
    throw new Error("캐릭터를 찾을 수 없습니다.");
  }

  character.amajdaItems = character.amajdaItems.filter(
    (item) => item.id !== itemId,
  );
  character.amajdaChecked = character.amajdaChecked.filter((id) => id !== itemId);
  await saveStoredData(data);
}

export async function toggleCharacterAmajdaChecked(
  userId: string,
  characterId: string,
  itemId: string,
): Promise<void> {
  const data = await loadStoredData();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("유저를 찾을 수 없습니다.");
  }
  const character = user.characters.find((c) => c.id === characterId);
  if (!character) {
    throw new Error("캐릭터를 찾을 수 없습니다.");
  }
  if (!character.amajdaItems.some((item) => item.id === itemId)) {
    throw new Error("체크리스트 항목을 찾을 수 없습니다.");
  }

  const checked = character.amajdaChecked.includes(itemId);
  character.amajdaChecked = checked
    ? character.amajdaChecked.filter((id) => id !== itemId)
    : [...character.amajdaChecked, itemId];
  await saveStoredData(data);
}
