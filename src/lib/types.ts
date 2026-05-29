import type { RaidId } from "./raids";

export type CharacterRole = "dealer" | "support";

export interface Character {
  id: string;
  name: string;
  role: CharacterRole;
  /** 이 캐릭터가 도는 레이드 */
  assignedRaids: RaidId[];
  /** 골드를 받지 않는 레이드 (assignedRaids의 부분집합) */
  noGoldRaids: RaidId[];
}

export interface User {
  id: string;
  nickname: string;
  characters: Character[];
}

export interface AppData {
  users: User[];
  selectedUserId: string | null;
}

export const STORAGE_KEY = "daengmang-raid-data";

export const EMPTY_DATA: AppData = {
  users: [],
  selectedUserId: null,
};

export const ROLE_LABEL: Record<CharacterRole, string> = {
  dealer: "딜러",
  support: "서폿",
};
