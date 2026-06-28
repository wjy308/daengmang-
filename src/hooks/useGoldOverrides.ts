"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadGoldOverrides,
  saveGoldOverrides,
  type GoldOverride,
  type GoldOverrides,
} from "@/lib/gold-overrides";
import type { RaidId } from "@/lib/raids";

export function useGoldOverrides() {
  const [overrides, setOverridesState] = useState<GoldOverrides>({});

  useEffect(() => {
    setOverridesState(loadGoldOverrides());
  }, []);

  const setOverride = useCallback((raidId: RaidId, override: GoldOverride) => {
    setOverridesState((prev) => {
      const next = { ...prev, [raidId]: override };
      saveGoldOverrides(next);
      return next;
    });
  }, []);

  const resetOverride = useCallback((raidId: RaidId) => {
    setOverridesState((prev) => {
      const next = { ...prev };
      delete next[raidId];
      saveGoldOverrides(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setOverridesState({});
    saveGoldOverrides({});
  }, []);

  return { overrides, setOverride, resetOverride, resetAll };
}
