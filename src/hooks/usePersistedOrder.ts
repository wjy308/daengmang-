"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * localStorage에 남는 표시 순서. 서버 데이터가 아니라 이 브라우저에서만 쓰는 배치다.
 *
 * 저장된 순서에 없는 항목은 뒤에 붙이고, 사라진 항목은 무시한다.
 * 서버 렌더와 첫 렌더는 원본 순서 그대로라 하이드레이션이 어긋나지 않는다.
 */
export function usePersistedOrder(key: string, ids: string[]) {
  const [saved, setSaved] = useState<string[] | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      setSaved(
        Array.isArray(parsed) && parsed.every((v) => typeof v === "string")
          ? (parsed as string[])
          : [],
      );
    } catch {
      setSaved([]);
    }
  }, [key]);

  const ordered = saved
    ? [
        ...saved.filter((id) => ids.includes(id)),
        ...ids.filter((id) => !saved.includes(id)),
      ]
    : ids;

  const setOrder = useCallback(
    (next: string[]) => {
      setSaved(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // 저장 실패해도 이번 세션 배치에는 지장 없음
      }
    },
    [key],
  );

  return [ordered, setOrder] as const;
}
