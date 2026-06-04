import { isUserAmajdaFullyChecked } from "@/lib/amajda";
import type { User } from "@/lib/types";

export const BROWSER_PROFILE_KEY = "daengmang-browser-profile";

export const MAX_BROWSER_USERS = 2;
export const MIN_INTERVAL_MINUTES = 1;
export const MAX_INTERVAL_MINUTES = 24 * 60;
export const DEFAULT_INTERVAL_MINUTES = 30;

export type AmajdaNotifyTrigger = "onPartyClear" | "onInterval";

export interface AmajdaNotifySettings {
  onPartyClear: boolean;
  onInterval: boolean;
}

export interface BrowserProfile {
  /** 이 브라우저를 쓰는 사람 (레이드 정리 유저 id, 최대 2명) */
  browserUserIds: string[];
  notify: AmajdaNotifySettings;
  /** 반복 알림 간격(분) */
  intervalMinutes: number;
}

export const DEFAULT_BROWSER_PROFILE: BrowserProfile = {
  browserUserIds: [],
  notify: {
    onPartyClear: true,
    onInterval: false,
  },
  intervalMinutes: DEFAULT_INTERVAL_MINUTES,
};

function normalizeIntervalMinutes(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return DEFAULT_INTERVAL_MINUTES;
  }
  const minutes = Math.floor(raw);
  if (minutes < MIN_INTERVAL_MINUTES) return MIN_INTERVAL_MINUTES;
  if (minutes > MAX_INTERVAL_MINUTES) return MAX_INTERVAL_MINUTES;
  return minutes;
}

function normalizeProfile(raw: unknown): BrowserProfile {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_BROWSER_PROFILE, browserUserIds: [] };
  }
  const record = raw as Record<string, unknown>;
  const browserUserIds = Array.isArray(record.browserUserIds)
    ? record.browserUserIds
        .map((id) => String(id))
        .filter(Boolean)
        .slice(0, MAX_BROWSER_USERS)
    : [];

  const notifyRaw =
    record.notify && typeof record.notify === "object"
      ? (record.notify as Record<string, unknown>)
      : {};

  return {
    browserUserIds,
    notify: {
      onPartyClear:
        typeof notifyRaw.onPartyClear === "boolean"
          ? notifyRaw.onPartyClear
          : DEFAULT_BROWSER_PROFILE.notify.onPartyClear,
      onInterval:
        typeof notifyRaw.onInterval === "boolean"
          ? notifyRaw.onInterval
          : false,
    },
    intervalMinutes: normalizeIntervalMinutes(record.intervalMinutes),
  };
}

export function loadBrowserProfile(): BrowserProfile {
  if (typeof window === "undefined") {
    return { ...DEFAULT_BROWSER_PROFILE, browserUserIds: [] };
  }
  try {
    const raw = localStorage.getItem(BROWSER_PROFILE_KEY);
    if (!raw) return { ...DEFAULT_BROWSER_PROFILE, browserUserIds: [] };
    return normalizeProfile(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_BROWSER_PROFILE, browserUserIds: [] };
  }
}

export function saveBrowserProfile(profile: BrowserProfile): void {
  if (typeof window === "undefined") return;
  const normalized: BrowserProfile = {
    browserUserIds: profile.browserUserIds.slice(0, MAX_BROWSER_USERS),
    notify: { ...profile.notify },
    intervalMinutes: normalizeIntervalMinutes(profile.intervalMinutes),
  };
  localStorage.setItem(BROWSER_PROFILE_KEY, JSON.stringify(normalized));
}

/** 아직 확인할 항목이 있는 브라우저 사용자 id만 반환 */
export function filterUsersNeedingAmajdaNotify(
  users: User[],
  userIds: string[],
): string[] {
  const idSet = new Set(userIds);
  return users
    .filter((user) => idSet.has(user.id) && !isUserAmajdaFullyChecked(user))
    .map((user) => user.id);
}

export function getMatchingBrowserUserIds(
  profile: BrowserProfile,
  memberUserIds: string[],
): string[] {
  const memberSet = new Set(memberUserIds);
  return profile.browserUserIds.filter((id) => memberSet.has(id));
}
