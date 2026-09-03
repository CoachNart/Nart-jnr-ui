"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const items = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/setups", label: "Setups", icon: "⌁" },
  { href: "/analysis", label: "Analysis", icon: "◫" },
  { href: "/history", label: "History", icon: "◷" },
  { href: "/profile", label: "Profile", icon: "◉" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#030506] text-zinc-100">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-[#030506]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            </span>
            <span className="font-mono text-xs font-black tracking-[0.18em] text-white">KITSETUPS</span>
          </Link>
          <span className="hidden font-mono text-[8px] tracking-[0.2em] text-zinc-700 sm:block">TRADING INTELLIGENCE</span>
        </div>
      </header>

      <div className="pb-24 pt-16">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-[#050708]/95 backdrop-blur-xl">
        <div className="mx-auto grid max-w-2xl grid-cols-5 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
          {items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-1.5 transition ${active ? "text-cyan-300" : "text-zinc-600 hover:text-zinc-300"}`}
              >
                {active && <span className="absolute top-0 h-0.5 w-7 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />}
                <span className="font-mono text-base leading-none">{item.icon}</span>
                <span className="font-mono text-[7px] font-bold tracking-[0.16em]">{item.label.toUpperCase()}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
