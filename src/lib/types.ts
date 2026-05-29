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
  /** 이번 주 클리어한 레이드 */
  clearedRaids: RaidId[];
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

/** 브라우저별 선택 유저 (공유 데이터와 분리) */
export const SELECTED_USER_KEY = "daengmang-selected-user";

export const EMPTY_DATA: AppData = {
  users: [],
  selectedUserId: null,
};

export const ROLE_LABEL: Record<CharacterRole, string> = {
  dealer: "딜러",
  support: "서폿",
};
