"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type BrowserProfile,
  DEFAULT_BROWSER_PROFILE,
  loadBrowserProfile,
  saveBrowserProfile,
} from "@/lib/amajda-notify";

export function useBrowserProfile() {
  const [profile, setProfile] = useState<BrowserProfile>(DEFAULT_BROWSER_PROFILE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(loadBrowserProfile());
    setHydrated(true);
  }, []);

  const updateProfile = useCallback((next: BrowserProfile) => {
    setProfile(next);
    saveBrowserProfile(next);
  }, []);

  return { profile, hydrated, updateProfile };
}
