"use client";

import { useEffect, useState } from "react";

const MIN_LOAD_TIME = 1400;

export default function Loading() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const started = Date.now();
    const finish = () => {
      const remaining = Math.max(0, MIN_LOAD_TIME - (Date.now() - started));
      window.setTimeout(() => setVisible(false), remaining);
    };
    finish();
    return () => undefined;
  }, []);

  if (!visible) return null;

  return (
    <main className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-[#030609] text-white">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(34,211,238,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.045)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute h-80 w-80 rounded-full bg-cyan-400/10 blur-[110px]" />
      <div className="relative flex flex-col items-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-[26px] border border-cyan-300/10" />
          <span className="absolute inset-1 rounded-[23px] border border-cyan-300/20 shadow-[0_0_45px_rgba(34,211,238,.16)]" />
          <img src="https://www.t3kit.xyz/assets/images/logo.webp" alt="KitSetups" className="relative h-12 w-12 rounded-xl object-contain" />
        </div>
        <p className="mt-6 font-mono text-[9px] tracking-[.35em] text-cyan-300">KITSETUPS</p>
        <div className="mt-3 flex items-center gap-2 font-mono text-[8px] tracking-[.25em] text-zinc-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,.8)]" />
          INITIALIZING MARKET DESK
        </div>
        <div className="mt-5 h-px w-32 overflow-hidden bg-white/5"><div className="h-full w-1/2 animate-[pulse_1.2s_ease-in-out_infinite] bg-cyan-300/60" /></div>
      </div>
    </main>
  );
}
