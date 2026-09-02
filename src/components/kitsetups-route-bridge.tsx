"use client";

import Home from "@/app/page";

type KitSetupsTab = "home" | "setups" | "analysis" | "profile";

const STORAGE_KEY = "kitsetups-tab";

/**
 * Compatibility shell for the section routes while the dashboard UI remains
 * in the canonical Home component.
 *
 * Unlike the old bridge, this does NOT redirect back to "/". The App Router
 * route remains the browser URL, so /setups, /analysis and /profile survive
 * refreshes and deep links. The canonical dashboard still owns the existing
 * auth, data loading and visual UI.
 */
export default function KitSetupsRouteBridge({
  tab,
}: {
  tab: Exclude<KitSetupsTab, "home">;
}) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, tab);
  }

  return <Home />;
}
