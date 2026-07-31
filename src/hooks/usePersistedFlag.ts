"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * localStorage에 남는 on/off 설정값.
 *
 * 서버 렌더와 첫 렌더는 항상 `fallback`으로 맞춰 하이드레이션 불일치를 피하고,
 * 저장된 값은 마운트 직후에 반영한다.
 */
export function usePersistedFlag(key: string, fallback: boolean) {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === "0" || raw === "1") setValue(raw === "1");
    } catch {
      // 스토리지를 못 쓰면 기본값 유지
    }
  }, [key]);

  const toggle = useCallback(() => {
    setValue((v) => {
      const next = !v;
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {
        // 저장 실패해도 이번 세션 동작에는 지장 없음
      }
      return next;
    });
  }, [key]);

  return [value, toggle] as const;
}
