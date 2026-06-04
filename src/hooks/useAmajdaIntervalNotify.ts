"use client";

import { useEffect, useRef } from "react";
import {
  filterUsersNeedingAmajdaNotify,
  MIN_INTERVAL_MINUTES,
} from "@/lib/amajda-notify";
import type { User } from "@/lib/types";

const MIN_INTERVAL_MS = MIN_INTERVAL_MINUTES * 60 * 1000;

/** setInterval만 쓰면 users 갱신·모달 열림마다 타이머가 리셋되고, 백그라운드 탭에서는 지연됨 */
function pollIntervalMs(targetMs: number): number {
  return Math.min(15_000, Math.max(5_000, Math.floor(targetMs / 4)));
}

export function useAmajdaIntervalNotify({
  enabled,
  intervalMinutes,
  browserUserIds,
  users,
  modalOpen,
  onNotify,
}: {
  enabled: boolean;
  intervalMinutes: number;
  browserUserIds: string[];
  users: User[];
  modalOpen: boolean;
  onNotify: (userIds: string[]) => void;
}) {
  const usersRef = useRef(users);
  const browserUserIdsRef = useRef(browserUserIds);
  const modalOpenRef = useRef(modalOpen);
  const onNotifyRef = useRef(onNotify);
  const lastNotifyAtRef = useRef<number | null>(null);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    browserUserIdsRef.current = browserUserIds;
  }, [browserUserIds]);

  useEffect(() => {
    modalOpenRef.current = modalOpen;
  }, [modalOpen]);

  useEffect(() => {
    onNotifyRef.current = onNotify;
  }, [onNotify]);

  const browserUserKey = browserUserIds.join(",");

  useEffect(() => {
    if (!enabled) {
      lastNotifyAtRef.current = null;
      return;
    }
    lastNotifyAtRef.current = Date.now();
  }, [enabled, intervalMinutes, browserUserKey]);

  useEffect(() => {
    if (!enabled || browserUserIds.length === 0) return;

    const intervalMs = intervalMinutes * 60 * 1000;
    if (intervalMs < MIN_INTERVAL_MS) return;

    const tryNotify = () => {
      if (modalOpenRef.current) return;

      const needing = filterUsersNeedingAmajdaNotify(
        usersRef.current,
        browserUserIdsRef.current,
      );
      if (needing.length === 0) return;

      const now = Date.now();
      const last = lastNotifyAtRef.current ?? now;
      if (now - last < intervalMs) return;

      lastNotifyAtRef.current = now;
      onNotifyRef.current(needing);
    };

    const pollMs = pollIntervalMs(intervalMs);
    const pollId = window.setInterval(tryNotify, pollMs);

    const onVisible = () => {
      if (document.visibilityState === "visible") tryNotify();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", tryNotify);

    return () => {
      window.clearInterval(pollId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", tryNotify);
    };
  }, [enabled, intervalMinutes, browserUserKey]);
}
