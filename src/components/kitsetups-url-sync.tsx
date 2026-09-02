"use client";

import { useEffect } from "react";

const STORAGE_KEY = "kitsetups-tab";
const TAB_PATHS = {
  home: "/",
  setups: "/setups",
  analysis: "/analysis",
  profile: "/profile",
} as const;

type Tab = keyof typeof TAB_PATHS;

function isTab(value: string | null): value is Tab {
  return value === "home" || value === "setups" || value === "analysis" || value === "profile";
}

function tabFromPath(pathname: string): Tab {
  if (pathname === "/setups") return "setups";
  if (pathname === "/analysis") return "analysis";
  if (pathname === "/profile") return "profile";
  return "home";
}

export default function KitSetupsUrlSync() {
  useEffect(() => {
    let currentPathTab = tabFromPath(window.location.pathname);
    let lastStorageTab = sessionStorage.getItem(STORAGE_KEY);

    if (!isTab(lastStorageTab)) {
      lastStorageTab = currentPathTab;
      sessionStorage.setItem(STORAGE_KEY, currentPathTab);
    } else if (window.location.pathname !== TAB_PATHS[lastStorageTab]) {
      // A direct /setups, /analysis or /profile visit is authoritative.
      sessionStorage.setItem(STORAGE_KEY, currentPathTab);
      lastStorageTab = currentPathTab;
    }

    const syncStorageToUrl = () => {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!isTab(stored) || stored === lastStorageTab) return;

      lastStorageTab = stored;
      const target = TAB_PATHS[stored];

      if (window.location.pathname !== target) {
        window.history.pushState({ kitsetupsTab: stored }, "", target);
      }
    };

    const handlePopState = () => {
      currentPathTab = tabFromPath(window.location.pathname);
      lastStorageTab = currentPathTab;
      sessionStorage.setItem(STORAGE_KEY, currentPathTab);
    };

    const timer = window.setInterval(syncStorageToUrl, 150);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return null;
}
