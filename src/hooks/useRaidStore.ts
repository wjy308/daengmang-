"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as raidApi from "@/lib/api/raid-api";
import type { RaidId } from "@/lib/raids";
import {
  EMPTY_DATA,
  SELECTED_USER_KEY,
  type AppData,
  type CharacterRole,
  type User,
} from "@/lib/types";

const POLL_INTERVAL_MS = 5000;
const MAX_GOLD_CHARACTERS = 6;

function createPendingAmajdaId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `pending-amajda-${crypto.randomUUID()}`;
  }
  return `pending-amajda-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadSelectedUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(SELECTED_USER_KEY);
  } catch {
    return null;
  }
}

function saveSelectedUserId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(SELECTED_USER_KEY, id);
  } else {
    localStorage.removeItem(SELECTED_USER_KEY);
  }
}

function resolveSelectedUserId(
  users: User[],
  selectedUserId: string | null,
): string | null {
  if (selectedUserId && users.some((u) => u.id === selectedUserId)) {
    return selectedUserId;
  }
  return users[0]?.id ?? null;
}

export function useRaidStore() {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutatingRef = useRef(false);

  const applyUsers = useCallback((users: User[]) => {
    setData((prev) => {
      const selectedUserId = resolveSelectedUserId(users, prev.selectedUserId);
      if (selectedUserId !== prev.selectedUserId) {
        saveSelectedUserId(selectedUserId);
      }
      return { users, selectedUserId };
    });
  }, []);

  const refresh = useCallback(async () => {
    const users = await raidApi.fetchUsers();
    applyUsers(users);
    setError(null);
  }, [applyUsers]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const selectedUserId = loadSelectedUserId();
      setData((prev) => ({ ...prev, selectedUserId }));
      try {
        const users = await raidApi.fetchUsers();
        if (cancelled) return;
        applyUsers(users);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.",
        );
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [applyUsers]);

  useEffect(() => {
    if (!hydrated) return;

    const id = window.setInterval(() => {
      if (mutatingRef.current) return;
      void refresh().catch(() => {
        /* polling errors are silent */
      });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [hydrated, refresh]);

  const runMutation = useCallback(
    async (update: (prev: AppData) => AppData, action: () => Promise<void>) => {
      mutatingRef.current = true;
      setData((prev) => {
        const next = update(prev);
        if (next.selectedUserId !== prev.selectedUserId) {
          saveSelectedUserId(next.selectedUserId);
        }
        return next;
      });

      try {
        await action();
        await refresh();
        setError(null);
      } catch (e) {
        await refresh();
        setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
      } finally {
        mutatingRef.current = false;
      }
    },
    [refresh],
  );

  const addUser = useCallback(
    (nickname: string) => {
      const trimmed = nickname.trim();
      if (!trimmed) return;

      void runMutation(
        (prev) => ({
          users: [
            ...prev.users,
            {
              id: "pending-user",
              nickname: trimmed,
              characters: [],
              amajdaItems: [],
              amajdaChecked: [],
            },
          ],
          selectedUserId: "pending-user",
        }),
        async () => {
          const user = await raidApi.createUser(trimmed);
          setData((prev) => ({
            users: prev.users.map((u) =>
              u.id === "pending-user" ? user : u,
            ),
            selectedUserId: user.id,
          }));
          saveSelectedUserId(user.id);
        },
      );
    },
    [runMutation],
  );

  const removeUser = useCallback(
    (userId: string) => {
      void runMutation(
        (prev) => {
          const users = prev.users.filter((u) => u.id !== userId);
          const selectedUserId = resolveSelectedUserId(
            users,
            prev.selectedUserId,
          );
          return { users, selectedUserId };
        },
        () => raidApi.deleteUser(userId),
      );
    },
    [runMutation],
  );

  const selectUser = useCallback((userId: string) => {
    setData((prev) => {
      saveSelectedUserId(userId);
      return { ...prev, selectedUserId: userId };
    });
  }, []);

  const addCharacter = useCallback(
    (userId: string, name: string, role: CharacterRole) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      void runMutation(
        (prev) => ({
          ...prev,
          users: prev.users.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  characters: [
                    ...u.characters,
                    {
                      id: "pending-character",
                      name: trimmed,
                      role,
                      goldIncluded:
                        u.characters.filter((c) => c.goldIncluded).length <
                        MAX_GOLD_CHARACTERS,
                      assignedRaids: [],
                      noGoldRaids: [],
                      bonusRaids: [],
                      clearedRaids: [],
                      amajdaItems: [],
                      amajdaChecked: [],
                    },
                  ],
                }
              : u,
          ),
        }),
        async () => {
          await raidApi.createCharacter(userId, trimmed, role);
        },
      );
    },
    [runMutation],
  );

  const setCharacterRole = useCallback(
    (userId: string, characterId: string, role: CharacterRole) => {
      void runMutation(
        (prev) => ({
          ...prev,
          users: prev.users.map((u) => {
            if (u.id !== userId) return u;
            return {
              ...u,
              characters: u.characters.map((c) =>
                c.id === characterId ? { ...c, role } : c,
              ),
            };
          }),
        }),
        () => raidApi.updateCharacterRole(userId, characterId, role),
      );
    },
    [runMutation],
  );

  const removeCharacter = useCallback(
    (userId: string, characterId: string) => {
      void runMutation(
        (prev) => ({
          ...prev,
          users: prev.users.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  characters: u.characters.filter((c) => c.id !== characterId),
                }
              : u,
          ),
        }),
        () => raidApi.deleteCharacter(userId, characterId),
      );
    },
    [runMutation],
  );

  const toggleCharacterRaid = useCallback(
    (userId: string, characterId: string, raidId: RaidId) => {
      void runMutation(
        (prev) => ({
          ...prev,
          users: prev.users.map((u) => {
            if (u.id !== userId) return u;
            return {
              ...u,
              characters: u.characters.map((c) => {
                if (c.id !== characterId) return c;
                const assigned = c.assignedRaids.includes(raidId);
                if (assigned) {
                  return {
                    ...c,
                    assignedRaids: c.assignedRaids.filter((r) => r !== raidId),
                    noGoldRaids: c.noGoldRaids.filter((r) => r !== raidId),
                    bonusRaids: c.bonusRaids.filter((r) => r !== raidId),
                    clearedRaids: c.clearedRaids.filter((r) => r !== raidId),
                  };
                }
                return {
                  ...c,
                  assignedRaids: [...c.assignedRaids, raidId],
                };
              }),
            };
          }),
        }),
        () => raidApi.toggleCharacterRaid(userId, characterId, raidId),
      );
    },
    [runMutation],
  );

  const toggleCharacterNoGold = useCallback(
    (userId: string, characterId: string, raidId: RaidId) => {
      void runMutation(
        (prev) => ({
          ...prev,
          users: prev.users.map((u) => {
            if (u.id !== userId) return u;
            return {
              ...u,
              characters: u.characters.map((c) => {
                if (c.id !== characterId) return c;
                if (!c.assignedRaids.includes(raidId)) return c;
                const noGold = c.noGoldRaids.includes(raidId);
                if (noGold) {
                  return {
                    ...c,
                    noGoldRaids: c.noGoldRaids.filter((r) => r !== raidId),
                  };
                }
                return {
                  ...c,
                  noGoldRaids: [...c.noGoldRaids, raidId],
                  bonusRaids: c.bonusRaids.filter((r) => r !== raidId),
                };
              }),
            };
          }),
        }),
        () => raidApi.toggleCharacterNoGold(userId, characterId, raidId),
      );
    },
    [runMutation],
  );

  const toggleCharacterBonus = useCallback(
    (userId: string, characterId: string, raidId: RaidId) => {
      void runMutation(
        (prev) => ({
          ...prev,
          users: prev.users.map((u) => {
            if (u.id !== userId) return u;
            return {
              ...u,
              characters: u.characters.map((c) => {
                if (c.id !== characterId) return c;
                if (!c.assignedRaids.includes(raidId)) return c;
                const bonus = c.bonusRaids.includes(raidId);
                return {
                  ...c,
                  bonusRaids: bonus
                    ? c.bonusRaids.filter((r) => r !== raidId)
                    : [...c.bonusRaids, raidId],
                };
              }),
            };
          }),
        }),
        () => raidApi.toggleCharacterBonus(userId, characterId, raidId),
      );
    },
    [runMutation],
  );

  const toggleCharacterGoldIncluded = useCallback(
    (userId: string, characterId: string) => {
      const targetUser = data.users.find((u) => u.id === userId);
      const targetCharacter = targetUser?.characters.find((c) => c.id === characterId);
      if (!targetUser || !targetCharacter) return;

      if (
        !targetCharacter.goldIncluded &&
        targetUser.characters.filter((c) => c.goldIncluded).length >=
          MAX_GOLD_CHARACTERS
      ) {
        setError("골드 합산 캐릭터는 유저당 최대 6명까지 선택할 수 있습니다.");
        return;
      }

      void runMutation(
        (prev) => ({
          ...prev,
          users: prev.users.map((u) => {
            if (u.id !== userId) return u;
            return {
              ...u,
              characters: u.characters.map((c) =>
                c.id === characterId ? { ...c, goldIncluded: !c.goldIncluded } : c,
              ),
            };
          }),
        }),
        () => raidApi.toggleCharacterGoldIncluded(userId, characterId),
      );
    },
    [data.users, runMutation],
  );

  const markPartyCleared = useCallback(
    (
      raidId: RaidId,
      members: { userId: string; characterId: string }[],
    ) => {
      void runMutation(
        (prev) => ({
          ...prev,
          users: prev.users.map((user) => ({
            ...user,
            characters: user.characters.map((character) => {
              const isMember = members.some(
                (m) =>
                  m.userId === user.id && m.characterId === character.id,
              );
              if (!isMember || character.clearedRaids.includes(raidId)) {
                return character;
              }
              return {
                ...character,
                clearedRaids: [...character.clearedRaids, raidId],
              };
            }),
          })),
        }),
        () => raidApi.markPartyCleared(raidId, members),
      );
    },
    [runMutation],
  );

  const cancelPartyCleared = useCallback(
    (
      raidId: RaidId,
      members: { userId: string; characterId: string }[],
    ) => {
      void runMutation(
        (prev) => ({
          ...prev,
          users: prev.users.map((user) => ({
            ...user,
            characters: user.characters.map((character) => {
              const isMember = members.some(
                (m) =>
                  m.userId === user.id && m.characterId === character.id,
              );
              if (!isMember || !character.clearedRaids.includes(raidId)) {
                return character;
              }
              return {
                ...character,
                clearedRaids: character.clearedRaids.filter((r) => r !== raidId),
              };
            }),
          })),
        }),
        () => raidApi.unmarkPartyCleared(raidId, members),
      );
    },
    [runMutation],
  );

  const reorderCharacters = useCallback(
    (userId: string, characterIds: string[]) => {
      void runMutation(
        (prev) => ({
          ...prev,
          users: prev.users.map((user) => {
            if (user.id !== userId) return user;
            const byId = new Map(user.characters.map((c) => [c.id, c]));
            return {
              ...user,
              characters: characterIds
                .map((id) => byId.get(id))
                .filter((c): c is NonNullable<typeof c> => !!c),
            };
          }),
        }),
        () => raidApi.reorderCharacters(userId, characterIds),
      );
    },
    [runMutation],
  );

  const reorderCharacterRaids = useCallback(
    (userId: string, characterId: string, raidIds: RaidId[]) => {
      void runMutation(
        (prev) => ({
          ...prev,
          users: prev.users.map((user) => {
            if (user.id !== userId) return user;
            return {
              ...user,
              characters: user.characters.map((character) =>
                character.id === characterId
                  ? { ...character, assignedRaids: [...raidIds] }
                  : character,
              ),
            };
          }),
        }),
        () => raidApi.reorderCharacterRaids(userId, characterId, raidIds),
      );
    },
    [runMutation],
  );

  const addUserAmajdaItem = useCallback(
    (userId: string, label: string, period?: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;

      const pendingId = createPendingAmajdaId();

      void runMutation(
        (prev) => ({
          ...prev,
          users: prev.users.map((user) => {
            if (user.id !== userId) return user;
            return {
              ...user,
              amajdaItems: [
                ...user.amajdaItems,
                {
                  id: pendingId,
                  label: trimmed,
                  period: period?.trim() || undefined,
                },
              ],
            };
          }),
        }),
        () => raidApi.addUserAmajdaItem(userId, trimmed, period),
      );
    },
    [runMutation],
  );

  const removeUserAmajdaItem = useCallback(
    (userId: string, itemId: string) => {
      void runMutation(
        (prev) => ({
          ...prev,
          users: prev.users.map((user) => {
            if (user.id !== userId) return user;
            return {
              ...user,
              amajdaItems: user.amajdaItems.filter((item) => item.id !== itemId),
              amajdaChecked: user.amajdaChecked.filter((id) => id !== itemId),
            };
          }),
        }),
        () => raidApi.removeUserAmajdaItem(userId, itemId),
      );
    },
    [runMutation],
  );

  const toggleUserAmajdaChecked = useCallback(
    (userId: string, itemId: string) => {
      void runMutation(
        (prev) => ({
          ...prev,
          users: prev.users.map((user) => {
            if (user.id !== userId) return user;
            const checked = user.amajdaChecked.includes(itemId);
            return {
              ...user,
              amajdaChecked: checked
                ? user.amajdaChecked.filter((id) => id !== itemId)
                : [...user.amajdaChecked, itemId],
            };
          }),
        }),
        () => raidApi.toggleUserAmajdaChecked(userId, itemId),
      );
    },
    [runMutation],
  );

  const addCharacterAmajdaItem = useCallback(
    (
      userId: string,
      characterId: string,
      label: string,
      period?: string,
    ) => {
      const trimmed = label.trim();
      if (!trimmed) return;

      const pendingId = createPendingAmajdaId();

      void runMutation(
        (prev) => ({
          ...prev,
          users: prev.users.map((user) => {
            if (user.id !== userId) return user;
            return {
              ...user,
              characters: user.characters.map((character) => {
                if (character.id !== characterId) return character;
                return {
                  ...character,
                  amajdaItems: [
                    ...character.amajdaItems,
                    {
                      id: pendingId,
                      label: trimmed,
                      period: period?.trim() || undefined,
                    },
                  ],
                };
              }),
            };
          }),
        }),
        () =>
          raidApi.addCharacterAmajdaItem(
            userId,
            characterId,
            trimmed,
            period,
          ),
      );
    },
    [runMutation],
  );

  const removeCharacterAmajdaItem = useCallback(
    (userId: string, characterId: string, itemId: string) => {
      void runMutation(
        (prev) => ({
          ...prev,
          users: prev.users.map((user) => {
            if (user.id !== userId) return user;
            return {
              ...user,
              characters: user.characters.map((character) => {
                if (character.id !== characterId) return character;
                return {
                  ...character,
                  amajdaItems: character.amajdaItems.filter(
                    (item) => item.id !== itemId,
                  ),
                  amajdaChecked: character.amajdaChecked.filter(
                    (id) => id !== itemId,
                  ),
                };
              }),
            };
          }),
        }),
        () =>
          raidApi.removeCharacterAmajdaItem(userId, characterId, itemId),
      );
    },
    [runMutation],
  );

  const toggleCharacterAmajdaChecked = useCallback(
    (userId: string, characterId: string, itemId: string) => {
      void runMutation(
        (prev) => ({
          ...prev,
          users: prev.users.map((user) => {
            if (user.id !== userId) return user;
            return {
              ...user,
              characters: user.characters.map((character) => {
                if (character.id !== characterId) return character;
                const checked = character.amajdaChecked.includes(itemId);
                return {
                  ...character,
                  amajdaChecked: checked
                    ? character.amajdaChecked.filter((id) => id !== itemId)
                    : [...character.amajdaChecked, itemId],
                };
              }),
            };
          }),
        }),
        () =>
          raidApi.toggleCharacterAmajdaChecked(userId, characterId, itemId),
      );
    },
    [runMutation],
  );

  const selectedUser =
    data.users.find((u) => u.id === data.selectedUserId) ?? null;

  return {
    hydrated,
    error,
    users: data.users,
    selectedUser,
    addUser,
    removeUser,
    selectUser,
    addCharacter,
    setCharacterRole,
    removeCharacter,
    toggleCharacterRaid,
    toggleCharacterNoGold,
    toggleCharacterBonus,
    toggleCharacterGoldIncluded,
    markPartyCleared,
    cancelPartyCleared,
    reorderCharacters,
    reorderCharacterRaids,
    addUserAmajdaItem,
    removeUserAmajdaItem,
    toggleUserAmajdaChecked,
    addCharacterAmajdaItem,
    removeCharacterAmajdaItem,
    toggleCharacterAmajdaChecked,
  };
}
