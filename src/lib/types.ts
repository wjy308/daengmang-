import type { RaidId } from "./raids";

export type CharacterRole = "dealer" | "support";

/** 아맞다 체크리스트 항목 (유저·캐릭별 커스텀) */
export interface AmajdaItem {
  id: string;
  label: string;
  /** 주간, 이벤트 등 기간 표시 (선택) */
  period?: string;
  /**
   * true(기본): 수요일 10시(KST) 주간 리셋 시 체크 해제
   * false: 체크 상태 유지
   */
  resetWeekly?: boolean;
}

export interface Character {
  id: string;
  name: string;
  role: CharacterRole;
  /** 계정 주간 골드 합산 대상 여부 (최대 6캐릭) */
  goldIncluded: boolean;
  /** 이 캐릭터가 도는 레이드 */
  assignedRaids: RaidId[];
  /** 골드를 받지 않는 레이드 (assignedRaids의 부분집합) */
  noGoldRaids: RaidId[];
  /** 더보기 진행한 레이드 (assignedRaids의 부분집합) */
  bonusRaids: RaidId[];
  /** 이번 주 클리어한 레이드 */
  clearedRaids: RaidId[];
  /** 캐릭별 아맞다 항목 */
  amajdaItems: AmajdaItem[];
  /** 이번 주기에 체크한 캐릭별 아맞다 항목 id */
  amajdaChecked: string[];
}

export interface User {
  id: string;
  nickname: string;
  characters: Character[];
  /** 유저(계정) 단위 아맞다 항목 */
  amajdaItems: AmajdaItem[];
  /** 이번 주기에 체크한 유저 단위 아맞다 항목 id */
  amajdaChecked: string[];
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
