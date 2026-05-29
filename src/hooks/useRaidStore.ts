"use client";

import { useCallback, useEffect, useState } from "react";
import type { RaidId } from "@/lib/raids";
import {
  EMPTY_DATA,
  STORAGE_KEY,
  type AppData,
  type Character,
  type CharacterRole,
  type User,
} from "@/lib/types";

function migrateCharacter(raw: Record<string, unknown>): Character {
  const role: CharacterRole = raw.role === "support" ? "support" : "dealer";
  return {
    id: String(raw.id),
    name: String(raw.name),
    role,
    assignedRaids: Array.isArray(raw.assignedRaids)
      ? (raw.assignedRaids as RaidId[])
      : [],
    noGoldRaids: Array.isArray(raw.noGoldRaids)
      ? (raw.noGoldRaids as RaidId[])
      : [],
  };
}

function migrateUser(raw: Record<string, unknown>): User {
  const characters = Array.isArray(raw.characters)
    ? raw.characters.map((c) =>
        migrateCharacter(c as Record<string, unknown>),
      )
    : [];
  return {
    id: String(raw.id),
    nickname: String(raw.nickname),
    characters,
  };
}

function load(): AppData {
  if (typeof window === "undefined") return EMPTY_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DATA;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const users = Array.isArray(parsed.users)
      ? parsed.users.map((u) => migrateUser(u as Record<string, unknown>))
      : [];
    return {
      users,
      selectedUserId:
        typeof parsed.selectedUserId === "string" ? parsed.selectedUserId : null,
    };
  } catch {
    return EMPTY_DATA;
  }
}

function save(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function newId() {
  return crypto.randomUUID();
}

export function useRaidStore() {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(load());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: AppData | ((prev: AppData) => AppData)) => {
    setData((prev) => {
      const updated = typeof next === "function" ? next(prev) : next;
      save(updated);
      return updated;
    });
  }, []);

  const addUser = useCallback(
    (nickname: string) => {
      const trimmed = nickname.trim();
      if (!trimmed) return;
      const user: User = {
        id: newId(),
        nickname: trimmed,
        characters: [],
      };
      persist((prev) => ({
        users: [...prev.users, user],
        selectedUserId: user.id,
      }));
    },
    [persist],
  );

  const removeUser = useCallback(
    (userId: string) => {
      persist((prev) => {
        const users = prev.users.filter((u) => u.id !== userId);
        return {
          users,
          selectedUserId:
            prev.selectedUserId === userId
              ? (users[0]?.id ?? null)
              : prev.selectedUserId,
        };
      });
    },
    [persist],
  );

  const selectUser = useCallback(
    (userId: string) => {
      persist((prev) => ({ ...prev, selectedUserId: userId }));
    },
    [persist],
  );

  const addCharacter = useCallback(
    (userId: string, name: string, role: CharacterRole) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const character: Character = {
        id: newId(),
        name: trimmed,
        role,
        assignedRaids: [],
        noGoldRaids: [],
      };
      persist((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === userId
            ? { ...u, characters: [...u.characters, character] }
            : u,
        ),
      }));
    },
    [persist],
  );

  const setCharacterRole = useCallback(
    (userId: string, characterId: string, role: CharacterRole) => {
      persist((prev) => ({
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
      }));
    },
    [persist],
  );

  const removeCharacter = useCallback(
    (userId: string, characterId: string) => {
      persist((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === userId
            ? {
                ...u,
                characters: u.characters.filter((c) => c.id !== characterId),
              }
            : u,
        ),
      }));
    },
    [persist],
  );

  const toggleCharacterRaid = useCallback(
    (userId: string, characterId: string, raidId: RaidId) => {
      persist((prev) => ({
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
                };
              }
              return {
                ...c,
                assignedRaids: [...c.assignedRaids, raidId],
              };
            }),
          };
        }),
      }));
    },
    [persist],
  );

  const toggleCharacterNoGold = useCallback(
    (userId: string, characterId: string, raidId: RaidId) => {
      persist((prev) => ({
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
      }));
    },
    [persist],
  );

  const selectedUser =
    data.users.find((u) => u.id === data.selectedUserId) ?? null;

  return {
    hydrated,
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
  };
}
