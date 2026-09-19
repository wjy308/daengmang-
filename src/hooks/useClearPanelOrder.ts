"use client";

import { useCallback, useEffect, useState } from "react";
import { request } from "@/lib/api/raid-api";
import type { ClearPanelOrder } from "@/lib/types";

const ENDPOINT = "/api/clear-panel-order";

/**
 * 직접 클리어 체크 패널의 레이드·유저 표시 순서 (공용 DB).
 * 바꾸는 즉시 화면에 반영하고 저장은 뒤에서 한다. 실패하면 서버 값으로 되돌린다.
 */
export function useClearPanelOrder() {
  const [order, setOrder] = useState<ClearPanelOrder>({ raidIds: [], userIds: [] });
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    request<ClearPanelOrder>(ENDPOINT)
      .then(setOrder)
      .catch(() => {
        // 순서를 못 불러와도 기본 순서로 쓰면 되므로 조용히 넘어간다
      });
  }, []);

  useEffect(reload, [reload]);

  const save = useCallback(
    (patch: Partial<ClearPanelOrder>) => {
      setOrder((prev) => ({ ...prev, ...patch }));
      request<ClearPanelOrder>(ENDPOINT, { method: "PUT", body: JSON.stringify(patch) })
        .then((saved) => {
          setOrder(saved);
          setError(null);
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : "순서 저장에 실패했습니다.");
          reload();
        });
    },
    [reload],
  );

  const saveRaidOrder = useCallback((raidIds: string[]) => save({ raidIds }), [save]);
  const saveUserOrder = useCallback((userIds: string[]) => save({ userIds }), [save]);

  return { order, saveRaidOrder, saveUserOrder, error };
}
