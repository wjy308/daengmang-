import type { RaidId } from "./raids";

export interface GoldOverride {
  boundGold: number;
  normalGold: number;
  bonusCost: number;
}

export type GoldOverrides = Partial<Record<RaidId, GoldOverride>>;

const STORAGE_KEY = "daengmang-gold-overrides";

export function loadGoldOverrides(): GoldOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GoldOverrides) : {};
  } catch {
    return {};
  }
}

export function saveGoldOverrides(overrides: GoldOverrides): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {}
}
