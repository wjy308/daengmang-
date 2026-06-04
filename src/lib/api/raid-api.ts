import type { RaidId } from "@/lib/raids";
import type { Character, CharacterRole, User } from "@/lib/types";

async function request<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "요청에 실패했습니다.");
  }

  return res.json() as Promise<T>;
}

export async function fetchUsers(): Promise<User[]> {
  const data = await request<{ users: User[] }>("/api/users");
  return data.users;
}

export async function createUser(nickname: string): Promise<User> {
  const data = await request<{ user: User }>("/api/users", {
    method: "POST",
    body: JSON.stringify({ nickname }),
  });
  return data.user;
}

export async function deleteUser(userId: string): Promise<void> {
  await request<{ ok: true }>(`/api/users/${userId}`, {
    method: "DELETE",
  });
}

export async function createCharacter(
  userId: string,
  name: string,
  role: CharacterRole,
): Promise<Character> {
  const data = await request<{ character: Character }>(
    `/api/users/${userId}/characters`,
    {
      method: "POST",
      body: JSON.stringify({ name, role }),
    },
  );
  return data.character;
}

export async function deleteCharacter(
  userId: string,
  characterId: string,
): Promise<void> {
  await request<{ ok: true }>(
    `/api/users/${userId}/characters/${characterId}`,
    {
      method: "DELETE",
    },
  );
}

export async function updateCharacterRole(
  userId: string,
  characterId: string,
  role: CharacterRole,
): Promise<void> {
  await request<{ ok: true }>(
    `/api/users/${userId}/characters/${characterId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );
}

export async function toggleCharacterRaid(
  userId: string,
  characterId: string,
  raidId: RaidId,
): Promise<void> {
  await request<{ ok: true }>(
    `/api/users/${userId}/characters/${characterId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "toggleRaid", raidId }),
    },
  );
}

export async function toggleCharacterNoGold(
  userId: string,
  characterId: string,
  raidId: RaidId,
): Promise<void> {
  await request<{ ok: true }>(
    `/api/users/${userId}/characters/${characterId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "toggleNoGold", raidId }),
    },
  );
}

export async function toggleCharacterBonus(
  userId: string,
  characterId: string,
  raidId: RaidId,
): Promise<void> {
  await request<{ ok: true }>(
    `/api/users/${userId}/characters/${characterId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "toggleBonus", raidId }),
    },
  );
}

export async function toggleCharacterGoldIncluded(
  userId: string,
  characterId: string,
): Promise<void> {
  await request<{ ok: true }>(
    `/api/users/${userId}/characters/${characterId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "toggleGoldIncluded" }),
    },
  );
}

export interface PartyClearMember {
  userId: string;
  characterId: string;
}

export async function markPartyCleared(
  raidId: RaidId,
  members: PartyClearMember[],
): Promise<void> {
  await request<{ ok: true }>("/api/party-clear", {
    method: "POST",
    body: JSON.stringify({ raidId, members }),
  });
}

export async function unmarkPartyCleared(
  raidId: RaidId,
  members: PartyClearMember[],
): Promise<void> {
  await request<{ ok: true }>("/api/party-clear", {
    method: "POST",
    body: JSON.stringify({ raidId, members, action: "cancel" }),
  });
}

export async function reorderCharacters(
  userId: string,
  characterIds: string[],
): Promise<void> {
  await request<{ ok: true }>(`/api/users/${userId}/characters/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ characterIds }),
  });
}

export async function reorderCharacterRaids(
  userId: string,
  characterId: string,
  raidIds: RaidId[],
): Promise<void> {
  await request<{ ok: true }>(
    `/api/users/${userId}/characters/${characterId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "reorderRaids", raidIds }),
    },
  );
}

export async function addUserAmajdaItem(
  userId: string,
  label: string,
  period?: string,
): Promise<void> {
  await request(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "addAmajdaItem", label, period }),
  });
}

export async function removeUserAmajdaItem(
  userId: string,
  itemId: string,
): Promise<void> {
  await request(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "removeAmajdaItem", itemId }),
  });
}

export async function toggleUserAmajdaChecked(
  userId: string,
  itemId: string,
): Promise<void> {
  await request(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "toggleAmajdaChecked", itemId }),
  });
}

export async function addCharacterAmajdaItem(
  userId: string,
  characterId: string,
  label: string,
  period?: string,
): Promise<void> {
  await request(`/api/users/${userId}/characters/${characterId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "addAmajdaItem", label, period }),
  });
}

export async function removeCharacterAmajdaItem(
  userId: string,
  characterId: string,
  itemId: string,
): Promise<void> {
  await request(`/api/users/${userId}/characters/${characterId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "removeAmajdaItem", itemId }),
  });
}

export async function toggleCharacterAmajdaChecked(
  userId: string,
  characterId: string,
  itemId: string,
): Promise<void> {
  await request(`/api/users/${userId}/characters/${characterId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "toggleAmajdaChecked", itemId }),
  });
}
