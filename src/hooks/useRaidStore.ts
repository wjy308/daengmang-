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
                      assignedRaids: [],
                      noGoldRaids: [],
                      clearedRaids: [],
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
                return {
                  ...c,
                  noGoldRaids: noGold
                    ? c.noGoldRaids.filter((r) => r !== raidId)
                    : [...c.noGoldRaids, raidId],
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
    markPartyCleared,
    reorderCharacters,
    reorderCharacterRaids,
  };
}
