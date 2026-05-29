import { randomUUID } from "crypto";
import type { RaidId } from "@/lib/raids";
import { sameIdSet } from "@/lib/reorder";
import { loadStoredData, saveStoredData } from "@/lib/server/storage";
import type { Character, CharacterRole, User } from "@/lib/types";

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
    assignedRaids: [],
    noGoldRaids: [],
    clearedRaids: [],
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
  character.noGoldRaids = noGold
    ? character.noGoldRaids.filter((r) => r !== raidId)
    : [...character.noGoldRaids, raidId];
  await saveStoredData(data);
}
