"use client";

import { useEffect, useState } from "react";

// Keep navigation feeling deliberate instead of flashing through the loader.
const MIN_LOAD_TIME = 2400;

export default function Loading() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), MIN_LOAD_TIME);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <main className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-[#030609] text-white">
      <div className="relative flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[23px] border border-cyan-300/20 bg-white/[.02] shadow-[0_0_45px_rgba(34,211,238,.16)]">
          <img
            src="https://www.t3kit.xyz/assets/images/logo.webp"
            alt="KitSetups"
            className="h-12 w-12 rounded-xl object-contain"
          />
        </div>
        <p className="mt-6 font-mono text-[9px] tracking-[.35em] text-cyan-300">KITSETUPS</p>
        <div className="mt-3 flex items-center gap-2 font-mono text-[8px] tracking-[.25em] text-zinc-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,.8)]" />
          INITIALIZING MARKET DESK
        </div>
        <div className="mt-5 h-px w-32 overflow-hidden bg-white/5">
          <div className="h-full w-1/2 animate-[pulse_2.2s_ease-in-out_infinite] bg-cyan-300/60" />
        </div>
      </div>
    </main>
  );
}
