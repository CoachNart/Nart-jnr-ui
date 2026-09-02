"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type KitSetupsTab = "home" | "setups" | "analysis" | "profile";

const STORAGE_KEY = "kitsetups-tab";

export default function KitSetupsRouteBridge({
  tab,
}: {
  tab: Exclude<KitSetupsTab, "home">;
}) {
  const router = useRouter();

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, tab);
    router.replace("/");
  }, [router, tab]);

  return (
    <main className="min-h-screen bg-[#030506] text-zinc-100" aria-busy="true">
      <div className="flex min-h-screen items-center justify-center">
        <span className="font-mono text-[9px] font-bold tracking-[0.2em] text-zinc-600">
          LOADING KITSETUPS
        </span>
      </div>
    </main>
  );
}
